'use strict';
var _ = require('lodash');
var Operators = require('../utils/operators');
var BaseStatGetter = require('./base-stat-getter');
var OperatorDateIntervalParser = require('./operator-date-interval-parser');
var Interface = require('forest-express');

// jshint sub: true
function ValueStatGetter(model, params, options) {
  BaseStatGetter.call(this, model, params, options);

  var OPERATORS = new Operators(options);

  var schema = Interface.Schemas.schemas[model.name];
  function getAggregate() {
    return params.aggregate.toLowerCase();
  }

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName
    //         cannot be '*'.
    var fieldName = params['aggregate_field'] || schema.primaryKeys[0]||
      schema.fields[0].field;
    return schema.name + '.' + fieldName;
  }

  function getIncludes() {
    var includes = [];
    _.values(model.associations).forEach(function (association) {
      if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
        includes.push({
          model: association.target.unscoped(),
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
        new OperatorDateIntervalParser(filter.value, params.timezone, options);
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
    var filters = this.getFilters();
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
            filterDateIntervalForPrevious.value, params.timezone, options
          );
          var conditions = filters[OPERATORS.AND];
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
