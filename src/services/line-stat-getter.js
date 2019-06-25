import _ from 'lodash';
import P from 'bluebird';
import moment from 'moment';
import { Schemas } from 'forest-express';
import BaseStatGetter from './base-stat-getter';
import { isMySQL, isMSSQL, isSQLite } from '../utils/database';

// jshint sub: true
function LineStatGetter(model, params, opts) {
  BaseStatGetter.call(this, model, params, opts);

  const schema = Schemas.schemas[model.name];
  const timeRange = params.time_range.toLowerCase();

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName
    //         cannot be '*'.
    const fieldName = params.aggregate_field || schema.primaryKeys[0] ||
      schema.fields[0].field;
    return `${schema.name}.${fieldName}`;
  }

  function getGroupByDateField() {
    const fieldName = params.group_by_date_field;
    return `${schema.name}.${fieldName}`;
  }

  const groupByDateField = getGroupByDateField();

  function getGroupByDateFieldFormatedForMySQL(currentTimeRange) {
    const groupByDateFieldFormated = `\`${groupByDateField.replace('.', '`.`')}\``;
    switch (currentTimeRange) {
      case 'day':
        return opts.sequelize.fn(
          'DATE_FORMAT',
          opts.sequelize.col(groupByDateField),
          '%Y-%m-%d 00:00:00',
        );
      case 'week':
        return opts.sequelize
          .literal(`DATE_FORMAT(DATE_SUB(${groupByDateFieldFormated}, \
INTERVAL ((7 + WEEKDAY(${groupByDateFieldFormated})) % 7) DAY), '%Y-%m-%d 00:00:00')`);
      case 'month':
        return opts.sequelize.fn(
          'DATE_FORMAT',
          opts.sequelize.col(groupByDateField),
          '%Y-%m-01 00:00:00',
        );
      case 'year':
        return opts.sequelize.fn(
          'DATE_FORMAT',
          opts.sequelize.col(groupByDateField),
          '%Y-01-01 00:00:00',
        );
      default:
        return null;
    }
  }

  function getGroupByDateFieldFormatedForMSSQL(currentTimeRange) {
    const groupByDateFieldFormated = `[${groupByDateField.replace('.', '].[')}]`;
    switch (currentTimeRange) {
      case 'day':
        return opts.sequelize.fn(
          'FORMAT',
          opts.sequelize.col(groupByDateField),
          'yyyy-MM-dd 00:00:00',
        );
      case 'week':
        return opts.sequelize
          .literal(`FORMAT(DATEADD(DAY, -DATEPART(dw,${groupByDateFieldFormated}),\
${groupByDateFieldFormated}), 'yyyy-MM-dd 00:00:00')`);
      case 'month':
        return opts.sequelize.fn(
          'FORMAT',
          opts.sequelize.col(groupByDateField),
          'yyyy-MM-01 00:00:00',
        );
      case 'year':
        return opts.sequelize.fn(
          'FORMAT',
          opts.sequelize.col(groupByDateField),
          'yyyy-01-01 00:00:00',
        );
      default:
        return null;
    }
  }

  function getGroupByDateFieldFormatedForSQLite(currentTimeRange) {
    switch (currentTimeRange) {
      case 'day': {
        return opts.sequelize.fn(
          'STRFTIME',
          '%Y-%m-%d',
          opts.sequelize.col(groupByDateField),
        );
      }
      case 'week': {
        return opts.sequelize.fn(
          'STRFTIME',
          '%Y-%W',
          opts.sequelize.col(groupByDateField),
        );
      }
      case 'month': {
        return opts.sequelize.fn(
          'STRFTIME',
          '%Y-%m-01',
          opts.sequelize.col(groupByDateField),
        );
      }
      case 'year': {
        return opts.sequelize.fn(
          'STRFTIME',
          '%Y-01-01',
          opts.sequelize.col(groupByDateField),
        );
      }
      default:
        return null;
    }
  }

  function getGroupByDateInterval() {
    if (isMySQL(opts)) {
      return [getGroupByDateFieldFormatedForMySQL(timeRange), 'date'];
    } else if (isMSSQL(opts)) {
      return [getGroupByDateFieldFormatedForMSSQL(timeRange), 'date'];
    } else if (isSQLite(opts)) {
      return [getGroupByDateFieldFormatedForSQLite(timeRange), 'date'];
    }
    return [
      opts.sequelize.fn(
        'to_char',
        opts.sequelize.fn(
          'date_trunc',
          params.time_range,
          opts.sequelize.literal(`"${getGroupByDateField().replace('.', '"."')}" at time zone '${params.timezone}'`),
        ),
        'YYYY-MM-DD 00:00:00',
      ),
      'date',
    ];
  }

  function getFormat() {
    switch (timeRange) {
      case 'day': return 'DD/MM/YYYY';
      case 'week': return '[W]w-YYYY';
      case 'month': return 'MMM YY';
      case 'year': return 'YYYY';
      default: return null;
    }
  }

  function fillEmptyDateInterval(records) {
    if (records.length) {
      let sqlFormat = 'YYYY-MM-DD 00:00:00';
      if (isSQLite(opts) && timeRange === 'week') {
        sqlFormat = 'YYYY-WW';
      }

      const firstDate = moment(records[0].label, sqlFormat);
      const lastDate = moment(records[records.length - 1].label, sqlFormat);

      for (let i = firstDate; i.toDate() <= lastDate.toDate(); i = i.add(1, timeRange)) {
        const label = i.format(sqlFormat);
        if (!_.find(records, { label })) {
          records.push({ label, values: { value: 0 } });
        }
      }

      records = _.sortBy(records, 'label');
      return _.map(records, record => ({
        label: moment(record.label, sqlFormat).format(getFormat()),
        values: record.values,
      }));
    }
    return records;
  }

  function getAggregate() {
    return [
      opts.sequelize.fn(params.aggregate.toLowerCase(), opts.sequelize.col(getAggregateField())),
      'value',
    ];
  }

  function getIncludes() {
    const includes = [];
    _.values(model.associations).forEach((association) => {
      if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
        includes.push({
          model: association.target.unscoped(),
          as: association.associationAccessor,
          attributes: [],
        });
      }
    });

    return includes;
  }

  function getGroupBy() {
    return isMSSQL(opts) ? [getGroupByDateFieldFormatedForMSSQL(timeRange)] : [opts.sequelize.literal('1')];
  }

  function getOrder() {
    return isMSSQL(opts) ? [getGroupByDateFieldFormatedForMSSQL(timeRange)] : [opts.sequelize.literal('1')];
  }

  this.perform = () => model
    .unscoped()
    .findAll({
      attributes: [getGroupByDateInterval(), getAggregate()],
      include: getIncludes(),
      where: this.getFilters(),
      group: getGroupBy(),
      order: getOrder(),
      raw: true,
    })
    .then(records => P.map(records, record => ({
      label: record.date,
      values: { value: parseInt(record.value, 10) },
    })))
    .then(records => ({ value: fillEmptyDateInterval(records) }));
}

module.exports = LineStatGetter;
