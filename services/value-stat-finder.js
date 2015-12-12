'use strict';
//var P = require('bluebird');
var OperatorValueParser = require('./operator-value-parser');

function ValueStatFinder(model, params, opts) {
  function getAggregateField() {
    // jshint sub: true
    return params['aggregate_field'] || 'id';
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

  this.perform = function () {
    return model
      .aggregate(getAggregateField(), 'count', {
        distinct: true,
        where: getFilters()
      })
      .then(function (count) {
        return { value: count };
      });
  };
}

module.exports = ValueStatFinder;
