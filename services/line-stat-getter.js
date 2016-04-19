'use strict';
var P = require('bluebird');
var OperatorValueParser = require('./operator-value-parser');

// jshint sub: true
function LineStatGetter(model, params, opts) {
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
        [
          opts.sequelize.fn('date_trunc', params['time_range'],
          opts.sequelize.col(params['group_by_date_field'])),
          'date'
        ],
        [
          opts.sequelize.fn(params['aggregate'],
          opts.sequelize.col(getAggregateField())),
          'value'
        ]
      ],
      where: getFilters(),
      group: ['date'],
      order: ['date']
    })
    .then(function (records) {
      return P.map(records, function (record) {
        record = record.toJSON();

        return {
          label: record.date,
          values: { value: record.value }
        };
      });
    })
    .then(function (records) {
      return { value: records };
    });
  };
}

module.exports = LineStatGetter;
