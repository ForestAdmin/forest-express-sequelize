'use strict';
var OperatorValueParser = require('./operator-value-parser');
var OperatorDateIntervalParser = require('./operator-date-interval-parser');
var Interface = require('forest-express');

function ValueStatGetter(model, params, opts) {
  var schema = Interface.Schemas.schemas[model.name];

  function getAggregate() {
    return params.aggregate.toLowerCase();
  }

  function getAggregateField() {
    // jshint sub: true
    return params['aggregate_field'] || schema.idField;
  }

  function getFilters() {
    var where = {};
    var conditions = [];

    if (params.filters) {
      params.filters.forEach(function (filter) {
        var condition = {};
        condition[filter.field] = new OperatorValueParser(opts).perform(model,
          filter.field, filter.value);
        conditions.push(condition);
      });
    }

    if (params.filterType) { where['$' + params.filterType] = conditions; }
    return where;
  }

  function getIntervalDateFilterForPrevious() {
    var intervalDateFilter;

    params.filters.forEach(function (filter) {
      var operatorValueParser =
        new OperatorDateIntervalParser(filter.value.substring(1));
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
      .aggregate(aggregateField, aggregate, { where: filters })
      .then(function (count) {
        countCurrent = count || 0;

        if (filterDateIntervalForPrevious) {
          var operatorValueParser = new OperatorDateIntervalParser(
            filterDateIntervalForPrevious.value.substring(1)
          );
          filters[filterDateIntervalForPrevious.field] = operatorValueParser
            .getIntervalDateFilterForPreviousInterval();
          return model
            .aggregate(aggregateField, aggregate, { where: filters })
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
