'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Operators = require('../utils/operators');
var OperatorValueParser = require('./operator-value-parser');
var Interface = require('forest-express');
var CompositeKeysManager = require('./composite-keys-manager');
var QueryBuilder = require('./query-builder');
var SearchBuilder = require('./search-builder');

function ResourcesGetter(model, opts, params) {
  var schema = Interface.Schemas.schemas[model.name];
  var queryBuilder = new QueryBuilder(model, opts, params);
  var segmentScope;
  var segmentWhere;
  var OPERATORS = new Operators(opts);

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
    var primaryKeyArray = [_.keys(model.primaryKeys)[0]];

    return _.union(primaryKeyArray, params.fields[model.name].split(','),
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

    return where;
  }

  function getAndCountRecords() {
    var where = getWhere();

    var countOpts = {
      include: queryBuilder.getIncludes(model, fieldNamesRequested),
      where: where
    };

    var findAllOpts = {
      where: where,
      include: queryBuilder.getIncludes(model, fieldNamesRequested),
      order: queryBuilder.getOrder(),
      offset: queryBuilder.getSkip(),
      limit: queryBuilder.getLimit()
    };

    if (params.search) {
      _.each(schema.fields, function (field) {
        if (field.search) {
          try {
            field.search(countOpts, params.search);
            field.search(findAllOpts, params.search);
            hasSmartFieldSearch = true;
          } catch (error) {
            Interface.logger.error('Cannot search properly on Smart Field ' +
              field.field, error);
          }
        }
      });

      var fieldsSearched = searchBuilder.getFieldsSearched();
      if (fieldsSearched.length === 0 && !hasSmartFieldSearch) {
        // NOTICE: No search condition has been set in the queryis possible on the current model,
        return [0, []];
      }
    }

    if (segmentScope) {
      return P.all([
        model.scope(segmentScope).count(countOpts),
        model.scope(segmentScope).findAll(findAllOpts)
      ]);
    } else {
      return P.all([
        model.unscoped().count(countOpts),
        model.unscoped().findAll(findAllOpts)
      ]);
    }
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
    getSegment();

    return getSegmentCondition()
      .then(getAndCountRecords)
      .spread(function (count, records) {
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

        return [records, count, fieldsSearched];
      });
  };
}

module.exports = ResourcesGetter;
