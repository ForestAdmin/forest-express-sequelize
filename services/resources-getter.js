'use strict';
var _ = require('lodash');
var P = require('bluebird');
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

  function handleFilterParams() {
    var where = {};
    var conditions = [];

    _.each(params.filter, function (values, key) {
      if (key.indexOf(':') !== -1) {
        key = '$' + key.replace(':', '.') + '$';
      }
      values.split(',').forEach(function (value) {
        var condition = {};
        condition[key] = new OperatorValueParser()
          .perform(model, key, value, params.timezone);
        conditions.push(condition);
      });
    });

    if (params.filterType) { where['$' + params.filterType] = conditions; }

    return where;
  }

  function getWhere() {
    var where = { $and: [] };

    if (params.search) {
      where.$and.push(new SearchBuilder(model, opts, params,
          fieldNamesRequested).perform());
    }

    if (params.filter) {
      where.$and.push(handleFilterParams());
    }

    if (segmentWhere) {
      where.$and.push(segmentWhere);
    }

    return where;
  }

  function getAndCountRecords() {
    var countOpts = {
      include: queryBuilder.getIncludes(model, fieldNamesRequested),
      where: getWhere()
    };

    var findAllOpts = {
      where: getWhere(),
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
          } catch (error) {
            Interface.logger.error('Cannot search properly on Smart Field ' +
              field.field, error);
          }
        }
      });
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
        if (schema.isCompositePrimary) {
          records.forEach(function (record) {
            record.forestCompositePrimary =
              new CompositeKeysManager(model, schema, record)
                .createCompositePrimary();
          });
        }
        return [count, records];
      });
  };
}

module.exports = ResourcesGetter;
