'use strict';
var _ = require('lodash');
var P = require('bluebird');
var moment = require('moment');
var OperatorValueParser = require('./operator-value-parser');
var Interface = require('forest-express');

// jshint sub: true
function LineStatGetter(model, params, opts) {
  var schema = Interface.Schemas.schemas[model.name];

  function isMysql() {
    return (['mysql', 'mariadb'].indexOf(opts.sequelize.options.dialect) > -1);
  }

  function getAggregateField() {
    var fieldName = params['aggregate_field'] || schema.idField;
    return schema.name + '.' + fieldName;
  }

  function getGroupByDateField() {
    var fieldName = params['group_by_date_field'];
    return schema.name + '.' + fieldName;
  }

  function getGroupByDateInterval() {
    var timeRange = params['time_range'].toLowerCase();
    var column = params['group_by_date_field'];

    if (isMysql()) {
      switch (timeRange) {
        case 'day':
          return [
            opts.sequelize.fn('DATE_FORMAT',
            opts.sequelize.col(column),
            '%Y-%m-%d 00:00:00'),
            'date'
          ];
        case 'week':
          return [
            opts.sequelize.literal('DATE_FORMAT(DATE_SUB(' + column + ', ' +
              'INTERVAL ((7 + WEEKDAY(' + column + ')) % 7) DAY), ' +
              '\'%Y-%m-%d 00:00:00\')'),
            'date'
          ];
        case 'month':
          return [
            opts.sequelize.fn('DATE_FORMAT',
            opts.sequelize.col(column),
            '%Y-%m-01 00:00:00'),
            'date'
          ];
        case 'year':
          return [
            opts.sequelize.fn('DATE_FORMAT',
            opts.sequelize.col(column),
            '%Y-01-01 00:00:00'),
            'date'
          ];
      }
    } else {
      return [
        opts.sequelize.fn('to_char',
          opts.sequelize.fn('date_trunc', params['time_range'],
          opts.sequelize.col(getGroupByDateField())),
        'YYYY-MM-DD 00:00:00'),
        'date'
      ];
    }
  }

  function fillEmptyDateInterval(records) {
    if (records.length) {
      var firstDate = moment(records[0].label);
      var lastDate = moment(records[records.length - 1].label);
      var timeRange = params['time_range'].toLowerCase();

      for (var i = firstDate ; i.toDate() <= lastDate.toDate() ;
        i = i.add(1, timeRange)) {

        var label = i.format('Y-MM-DD 00:00:00');
        if (!_.find(records, { label: label })) {
          records.push({ label: label, values: { value: 0 }});
        }
      }

      return _.sortBy(records, 'label');
    } else {
      return records;
    }
  }

  function getAggregate() {
    return [
      opts.sequelize.fn(params.aggregate.toLowerCase(),
        opts.sequelize.col(getAggregateField())),
      'value'
    ];
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

  this.perform = function () {
    return model.unscoped().findAll({
      attributes: [getGroupByDateInterval(), getAggregate()],
      include: getIncludes(),
      where: getFilters(),
      group: ['date'],
      order: ['date'],
      raw: true
    })
    .then(function (records) {
      return P.map(records, function (record) {
        return {
          label: record.date,
          values: { value: parseInt(record.value) }
        };
      });
    })
    .then(function (records) {
      return { value: fillEmptyDateInterval(records) };
    });
  };
}

module.exports = LineStatGetter;
