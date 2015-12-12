'use strict';
var P = require('bluebird');
var OperatorValueParser = require('./operator-value-parser');

// jshint sub: true
function PieStatFinder(model, params, opts) {
  function getAggregateField() {
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
    return model.findAll({
      attributes: [
        params['group_by_field'],
        [
          opts.sequelize.fn(params['aggregate'],
          opts.sequelize.col(getAggregateField())),
          'value'
        ]
      ],
      where: getFilters(),
      group: [params['group_by_field']]
    })
    .then(function (records) {
      return P.map(records, function (record) {
        record = record.toJSON();

        return {
          key: String(record[params['group_by_field']]),
          value: record.value
        };
      });
    })
    .then(function (records) {
      return { value: records };
    });
  };
}

module.exports = PieStatFinder;
