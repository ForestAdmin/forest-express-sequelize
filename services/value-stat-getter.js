'use strict';
var OperatorValueParser = require('./operator-value-parser');

function ValueStatGetter(model, params, opts) {
  function getAggregate() {
    return params.aggregate.toLowerCase();
  }

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
      .aggregate(getAggregateField(), getAggregate(), {
        where: getFilters()
      })
      .then(function (count) {
        return { value: count };
      });
  };
}

module.exports = ValueStatGetter;
