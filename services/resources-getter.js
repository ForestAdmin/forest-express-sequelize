'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Operators = require('../utils/operators');
var OperatorValueParser = require('./operator-value-parser');
var Interface = require('forest-express');
var CompositeKeysManager = require('./composite-keys-manager');
var QueryBuilder = require('./query-builder');
var SearchBuilder = require('./search-builder');
var LiveQueryChecker = require('./live-query-checker');
var ErrorHTTP422 = require('./errors').ErrorHTTP422;

function ResourcesGetter(model, opts, params) {
  var schema = Interface.Schemas.schemas[model.name];
  var queryBuilder = new QueryBuilder(model, opts, params);
  var segmentScope;
  var segmentWhere;
  var OPERATORS = new Operators(opts);
  var primaryKey = _.keys(model.primaryKeys)[0];

  var fieldNamesRequested = (function() {
    if (!params.fields || !params.fields[model.name]) { return null; }

    // NOTICE: Populate the necessary associations for filters
    var associationsForQuery = [];
    _.each(params.filter, function (values, key) {
      if (key.indexOf(':') !== -1) {
        var association = key.split(':')[0];
        associationsForQuery.push(association);
      }
    });

    if (params.sort && params.sort.indexOf('.') !== -1) {
      associationsForQuery.push(params.sort.split('.')[0]);
    }

    // NOTICE: Force the primaryKey retrieval to store the records properly in
    //         the client.
    return _.union([primaryKey], params.fields[model.name].split(','),
      associationsForQuery);
  })();

  var searchBuilder = new SearchBuilder(model, opts, params,
      fieldNamesRequested);
  var hasSmartFieldSearch = false;

  function handleFilterParams() {
    var where = {};
    var conditions = [];

    _.each(params.filter, function (values, key) {
      if (key.indexOf(':') !== -1) {
        key = '$' + key.replace(':', '.') + '$';
      }
      values.split(',').forEach(function (value) {
        var condition = {};
        condition[key] = new OperatorValueParser(opts)
          .perform(model, key, value, params.timezone);
        conditions.push(condition);
      });
    });

    if (params.filterType) {
      where[OPERATORS[params.filterType.toUpperCase()]] = conditions;
    }

    return where;
  }

  function getWhere() {
    return new P(function (resolve, reject) {
      var where = {};
      where[OPERATORS.AND] = [];

      if (params.search) {
        where[OPERATORS.AND].push(searchBuilder.perform());
      }

      if (params.filter) {
        where[OPERATORS.AND].push(handleFilterParams());
      }

      if (segmentWhere) {
        where[OPERATORS.AND].push(segmentWhere);
      }

      if (params.segmentQuery) {
        var queryToFilterRecords = params.segmentQuery.trim();
        new LiveQueryChecker().perform(queryToFilterRecords);

        // WARNING: Choosing the first connection might generate issues if the model
        //          does not belongs to this database.
        opts.connections[0]
          .query(queryToFilterRecords, {
            type: opts.sequelize.QueryTypes.SELECT,
          })
          .then(function (results) {
            var recordIds = results.map(function (result) {
              return result.id;
            });
            var condition = { id: {} };
            condition.id[OPERATORS.IN] = recordIds;
            where[OPERATORS.AND].push(condition);

            return resolve(where);
          }, function (error) {
            var errorMessage = 'Invalid SQL query for this Live Query segment:\n' + error.message;
            Interface.logger.error(errorMessage);
            reject(new ErrorHTTP422(errorMessage));
          });
      } else {
        return resolve(where);
      }
    });
  }

  function getRecords() {
    var scope = segmentScope ? model.scope(segmentScope) : model.unscoped();
    var include = queryBuilder.getIncludes(model, fieldNamesRequested);

    return getWhere()
      .then(function (where) {
        var findAllOpts = {
          where: where,
          include: include,
          order: queryBuilder.getOrder(),
          offset: queryBuilder.getSkip(),
          limit: queryBuilder.getLimit()
        };

        if (params.search) {
          _.each(schema.fields, function (field) {
            if (field.search) {
              try {
                field.search(findAllOpts, params.search);
              } catch (error) {
                Interface.logger.error('Cannot search properly on Smart Field ' +
                  field.field, error);
              }
            }
          });

          var fieldsSearched = searchBuilder.getFieldsSearched();
          if (fieldsSearched.length === 0 && !hasSmartFieldSearch) {
            // NOTICE: No search condition has been set for the current search, no record can be found.
            return [];
          }
        }

        return scope.findAll(findAllOpts);
    });
  }

  function countRecords() {
    var scope = segmentScope ? model.scope(segmentScope) : model.unscoped();
    var include = queryBuilder.getIncludes(model, fieldNamesRequested);

    return getWhere()
      .then(function (where) {
        var options = {
          include: include,
          where: where
        };

        if (!primaryKey) {
          // NOTICE: If no primary key is found, use * as a fallback for Sequelize.
          options.col = '*';
        }

        if (params.search) {
          _.each(schema.fields, function (field) {
            if (field.search) {
              try {
                field.search(options, params.search);
              } catch (error) {
                Interface.logger.error('Cannot search properly on Smart Field ' +
                  field.field, error);
              }
            }
          });
        }

        return scope.count(options);
    });
  }

  function getSegment() {
    if (schema.segments && params.segment) {
      var segment = _.find(schema.segments, function (segment) {
        return segment.name === params.segment;
      });

      segmentScope = segment.scope;
      segmentWhere = segment.where;
    }
  }

  function getSegmentCondition() {
    getSegment();
    if (_.isFunction(segmentWhere)) {
      return segmentWhere(params)
        .then(function (where) {
          segmentWhere = where;
          return;
        });
    } else {
      return new P(function (resolve) { return resolve(); });
    }
  }

  this.perform = function () {
    return getSegmentCondition()
      .then(getRecords)
      .then(function (records) {
        var fieldsSearched = null;

        if (params.search) {
          fieldsSearched = searchBuilder.getFieldsSearched();
        }

        if (schema.isCompositePrimary) {
          records.forEach(function (record) {
            record.forestCompositePrimary =
              new CompositeKeysManager(model, schema, record)
                .createCompositePrimary();
          });
        }

        return [records, fieldsSearched];
      });
  };

  this.count = function () {
    return getSegmentCondition()
      .then(countRecords);
  };
}

module.exports = ResourcesGetter;
