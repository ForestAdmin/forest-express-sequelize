'use strict';
var _ = require('lodash');
var P = require('bluebird');
var moment = require('moment');
var BaseStatGetter = require('./base-stat-getter');
var Database = require('../utils/database');
var Interface = require('forest-express');

// jshint sub: true
function LineStatGetter(model, params, opts) {
  BaseStatGetter.call(this, model, params, opts);

  var schema = Interface.Schemas.schemas[model.name];
  var timeRange = params['time_range'].toLowerCase();

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName
    //         cannot be '*'.
    var fieldName = params['aggregate_field'] || schema.primaryKeys[0] ||
      schema.fields[0].field;
    return schema.name + '.' + fieldName;
  }

  function getGroupByDateField() {
    var fieldName = params['group_by_date_field'];
    return schema.name + '.' + fieldName;
  }

  var groupByDateField = getGroupByDateField();

  function getGroupByDateFieldFormatedForMySQL(timeRange) {
    switch (timeRange) {
      case 'day':
        return opts.sequelize.fn('DATE_FORMAT', opts.sequelize.col(groupByDateField),
          '%Y-%m-%d 00:00:00');
      case 'week':
        var groupByDateFieldFormated = '`' + groupByDateField.replace('.', '`.`') + '`';
        return opts.sequelize.literal('DATE_FORMAT(DATE_SUB(' + groupByDateFieldFormated +
          ', INTERVAL ((7 + WEEKDAY(' + groupByDateFieldFormated + ')) % 7) DAY), ' +
          '\'%Y-%m-%d 00:00:00\')');
      case 'month':
        return opts.sequelize.fn('DATE_FORMAT', opts.sequelize.col(groupByDateField),
          '%Y-%m-01 00:00:00');
      case 'year':
        return opts.sequelize.fn('DATE_FORMAT', opts.sequelize.col(groupByDateField),
          '%Y-01-01 00:00:00');
    }
  }

  function getGroupByDateFieldFormatedForMSSQL(timeRange) {
    switch (timeRange) {
      case 'day':
        return opts.sequelize.fn('FORMAT', opts.sequelize.col(groupByDateField),
          'yyyy-MM-dd 00:00:00');
      case 'week':
        var groupByDateFieldFormated = '[' + groupByDateField.replace('.', '].[') + ']';
        return opts.sequelize.literal('FORMAT(DATEADD(DAY, -DATEPART(dw,' +
          groupByDateFieldFormated + '),' + groupByDateFieldFormated + '), \'yyyy-MM-dd 00:00:00\')');
      case 'month':
        return opts.sequelize.fn('FORMAT', opts.sequelize.col(groupByDateField),
          'yyyy-MM-01 00:00:00');
      case 'year':
        return opts.sequelize.fn('FORMAT', opts.sequelize.col(groupByDateField),
          'yyyy-01-01 00:00:00');
    }
  }

  function getGroupByDateFieldFormatedForSQLite(timeRange) {
    switch (timeRange) {
      case 'day': {
        return opts.sequelize.fn('STRFTIME', '%Y-%m-%d',
          opts.sequelize.col(groupByDateField));
      }
      case 'week': {
        return opts.sequelize.fn('STRFTIME', '%Y-%W',
          opts.sequelize.col(groupByDateField));
      }
      case 'month': {
        return opts.sequelize.fn('STRFTIME', '%Y-%m-01',
          opts.sequelize.col(groupByDateField));
      }
      case 'year': {
        return opts.sequelize.fn('STRFTIME', '%Y-01-01',
          opts.sequelize.col(groupByDateField));
      }
    }
  }

  function getGroupByDateInterval() {
    if (Database.isMySQL(opts)) {
      return [getGroupByDateFieldFormatedForMySQL(timeRange), 'date'];
    } else if (Database.isMSSQL(opts)) {
      return [getGroupByDateFieldFormatedForMSSQL(timeRange), 'date'];
    } else if (Database.isSQLite(opts)) {
      return [getGroupByDateFieldFormatedForSQLite(timeRange), 'date'];
    } else {
      return [
        opts.sequelize.fn('to_char',
          opts.sequelize.fn('date_trunc', params['time_range'],
            opts.sequelize.literal('"' + getGroupByDateField()
              .replace('.', '"."') + '" at time zone \'' + params.timezone + '\'')),
          'YYYY-MM-DD 00:00:00'
        ),
        'date'
      ];
    }
  }

  function getFormat() {
    switch (timeRange) {
      case 'day': return 'DD/MM/YYYY';
      case 'week': return '[W]w-YYYY';
      case 'month': return 'MMM YY';
      case 'year': return 'YYYY';
    }
  }

  function fillEmptyDateInterval(records) {
    if (records.length) {
      var sqlFormat = 'YYYY-MM-DD 00:00:00';
      if (Database.isSQLite(opts) && timeRange === 'week') {
        sqlFormat = 'YYYY-WW';
      }

      var firstDate = moment(records[0].label, sqlFormat);
      var lastDate = moment(records[records.length - 1].label, sqlFormat);

      for (var i = firstDate ; i.toDate() <= lastDate.toDate() ;
        i = i.add(1, timeRange)) {

        var label = i.format(sqlFormat);
        if (!_.find(records, { label: label })) {
          records.push({ label: label, values: { value: 0 }});
        }
      }

      records = _.sortBy(records, 'label');
      return _.map(records, function (record) {
        return {
          label: moment(record.label, sqlFormat).format(getFormat()),
          values: record.values
        };
      });
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

  function getGroupBy() {
    return Database.isMSSQL(opts) ? [getGroupByDateFieldFormatedForMSSQL(timeRange)] : [opts.sequelize.literal('1')];
  }

  function getOrder() {
    return Database.isMSSQL(opts) ? [getGroupByDateFieldFormatedForMSSQL(timeRange)] : [opts.sequelize.literal('1')];
  }

  this.perform = function () {
    return model.unscoped().findAll({
      attributes: [getGroupByDateInterval(), getAggregate()],
      include: getIncludes(),
      where: this.getFilters(),
      group: getGroupBy(),
      order: getOrder(),
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
