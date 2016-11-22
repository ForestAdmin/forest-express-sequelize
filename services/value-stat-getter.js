'use strict';
var _ = require('lodash');
var OperatorValueParser = require('./operator-value-parser');
var OperatorDateIntervalParser = require('./operator-date-interval-parser');
var Interface = require('forest-express');

// jshint sub: true
function ValueStatGetter(model, params, opts) {
  var schema = Interface.Schemas.schemas[model.name];

  function getAggregate() {
    return params.aggregate.toLowerCase();
  }

  function getAggregateField() {
    var fieldName = params['aggregate_field'] || schema.idField;
    return schema.name + '.' + fieldName;
  }

  function getFilters() {
    var where = {};
    var conditions = [];

    if (params.filters) {
      params.filters.forEach(function (filter) {
        var field = filter.field;
        if (field.indexOf(':') !== -1) {
          field = '$' + field.replace(':', '.') + '$';
        }

        var condition = {};
        condition[field] = new OperatorValueParser(opts).perform(model,
          filter.field, filter.value);
        conditions.push(condition);
      });
    }

    if (params.filterType) { where['$' + params.filterType] = conditions; }
    return where;
  }

  function getIncludes() {
    var includes = [];
    _.values(model.associations).forEach(function (association) {
      if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
        includes.push({
          model: association.target,
          as: association.associationAccessor,
          attributes: []
        });
      }
    });

    return includes;
  }

  function getIntervalDateFilterForPrevious() {
    var intervalDateFilter;

    params.filters.forEach(function (filter) {
      var operatorValueParser =
        new OperatorDateIntervalParser(filter.value);
      if (operatorValueParser.hasPreviousInterval()) {
        intervalDateFilter = filter;
      }
    });
    return intervalDateFilter;
  }

  this.perform = function () {
    var countCurrent;
    var aggregateField = getAggregateField();
    var aggregate = getAggregate();
    var filters = getFilters();
    var filterDateIntervalForPrevious = getIntervalDateFilterForPrevious();

    return model
      .unscoped()
      .aggregate(aggregateField, aggregate, {
        include: getIncludes(),
        where: filters
      })
      .then(function (count) {
        countCurrent = count || 0;

        // NOTICE: Search for previous interval value only if the filterType is
        //         'AND', it would not be pertinent for a 'OR' filterType.
        if (filterDateIntervalForPrevious && params.filterType === 'and') {
          var operatorValueParser = new OperatorDateIntervalParser(
            filterDateIntervalForPrevious.value
          );
          var conditions = filters.$and;
          conditions.forEach(function (condition) {
            if (condition[filterDateIntervalForPrevious.field]) {
              condition[filterDateIntervalForPrevious.field] =
                operatorValueParser.getIntervalDateFilterForPreviousInterval();
            }
          });
          return model
            .unscoped()
            .aggregate(aggregateField, aggregate, {
              include: getIncludes(),
              where: filters
            })
            .then(function (count) { return count || 0; });
        }
        return undefined;
      })
      .then(function (countPrevious) {
        return {
          value: {
            countCurrent: countCurrent,
            countPrevious: countPrevious
          }
        };
      });
  };
}

module.exports = ValueStatGetter;
