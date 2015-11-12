'use strict';
var P = require('bluebird');

// jshint sub: true
function LineStatFinder(model, params, opts) {
  function getAggregateField() {
    return params['aggregate_field'] || 'id';
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

module.exports = LineStatFinder;
