'use strict';
var P = require('bluebird');

// jshint sub: true
function PieStatFinder(model, params, opts) {
  function getAggregateField() {
    return params['aggregate_field'] || 'id';
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
