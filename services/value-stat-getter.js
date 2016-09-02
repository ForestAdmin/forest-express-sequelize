'use strict';
var moment = require('moment');
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
    var filters = {};

    if (params.filters) {
      params.filters.forEach(function (filter) {
        filters[filter.field] = new OperatorValueParser(opts).perform(model,
          filter.field, filter.value);
      });
    }

    return filters;
  }

  function getIntervalDateFilter() {
    var intervalDateFilter;

    params.filters.forEach(function (filter) {
      var operatorValueParser =
        new OperatorDateIntervalParser(filter.value.substring(1));
      if (operatorValueParser.isIntervalDateValue()) {
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
    var filterDateInterval = getIntervalDateFilter();

    return model
      .aggregate(aggregateField, aggregate, { where: filters })
      .then((count) => {
        countCurrent = count || 0;

        if (filterDateInterval) {
          var operatorValueParser = new OperatorDateIntervalParser(
            filterDateInterval.value.substring(1)
          );
          filters[filterDateInterval.field] = operatorValueParser
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
