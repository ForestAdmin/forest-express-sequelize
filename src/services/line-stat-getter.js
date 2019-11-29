import _ from 'lodash';
import P from 'bluebird';
import moment from 'moment';
import { Schemas } from 'forest-express';
import { isMySQL, isMSSQL, isSQLite } from '../utils/database';
import FiltersParser from './filters-parser';
import Orm from '../utils/orm';

function LineStatGetter(model, params, options) {
  const schema = Schemas.schemas[model.name];
  const timeRange = params.time_range.toLowerCase();

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
    const fieldName = params.aggregate_field
      || schema.primaryKeys[0]
      || schema.fields[0].field;
    return `${schema.name}.${Orm.getColumnName(schema, fieldName)}`;
  }

  function getGroupByDateField() {
    return `${schema.name}.${Orm.getColumnName(schema, params.group_by_date_field)}`;
  }

  const groupByDateField = getGroupByDateField();

  function getGroupByDateFieldFormatedForMySQL(currentTimeRange) {
    const groupByDateFieldFormated = `\`${groupByDateField.replace('.', '`.`')}\``;
    switch (currentTimeRange) {
      case 'day':
        return options.sequelize.fn(
          'DATE_FORMAT',
          options.sequelize.col(groupByDateField),
          '%Y-%m-%d 00:00:00',
        );
      case 'week':
        return options.sequelize
          .literal(`DATE_FORMAT(DATE_SUB(${groupByDateFieldFormated}, \
INTERVAL ((7 + WEEKDAY(${groupByDateFieldFormated})) % 7) DAY), '%Y-%m-%d 00:00:00')`);
      case 'month':
        return options.sequelize.fn(
          'DATE_FORMAT',
          options.sequelize.col(groupByDateField),
          '%Y-%m-01 00:00:00',
        );
      case 'year':
        return options.sequelize.fn(
          'DATE_FORMAT',
          options.sequelize.col(groupByDateField),
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
        return options.sequelize.fn(
          'FORMAT',
          options.sequelize.col(groupByDateField),
          'yyyy-MM-dd 00:00:00',
        );
      case 'week':
        return options.sequelize
          .literal(`FORMAT(DATEADD(DAY, -DATEPART(dw,${groupByDateFieldFormated}),\
${groupByDateFieldFormated}), 'yyyy-MM-dd 00:00:00')`);
      case 'month':
        return options.sequelize.fn(
          'FORMAT',
          options.sequelize.col(groupByDateField),
          'yyyy-MM-01 00:00:00',
        );
      case 'year':
        return options.sequelize.fn(
          'FORMAT',
          options.sequelize.col(groupByDateField),
          'yyyy-01-01 00:00:00',
        );
      default:
        return null;
    }
  }

  function getGroupByDateFieldFormatedForSQLite(currentTimeRange) {
    switch (currentTimeRange) {
      case 'day': {
        return options.sequelize.fn(
          'STRFTIME',
          '%Y-%m-%d',
          options.sequelize.col(groupByDateField),
        );
      }
      case 'week': {
        return options.sequelize.fn(
          'STRFTIME',
          '%Y-%W',
          options.sequelize.col(groupByDateField),
        );
      }
      case 'month': {
        return options.sequelize.fn(
          'STRFTIME',
          '%Y-%m-01',
          options.sequelize.col(groupByDateField),
        );
      }
      case 'year': {
        return options.sequelize.fn(
          'STRFTIME',
          '%Y-01-01',
          options.sequelize.col(groupByDateField),
        );
      }
      default:
        return null;
    }
  }

  function getGroupByDateInterval() {
    if (isMySQL(options)) {
      return [getGroupByDateFieldFormatedForMySQL(timeRange), 'date'];
    }
    if (isMSSQL(options)) {
      return [getGroupByDateFieldFormatedForMSSQL(timeRange), 'date'];
    }
    if (isSQLite(options)) {
      return [getGroupByDateFieldFormatedForSQLite(timeRange), 'date'];
    }
    return [
      options.sequelize.fn(
        'to_char',
        options.sequelize.fn(
          'date_trunc',
          params.time_range,
          options.sequelize.literal(`"${getGroupByDateField().replace('.', '"."')}" at time zone '${params.timezone}'`),
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
      if (isSQLite(options) && timeRange === 'week') {
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
      return _.map(records, (record) => ({
        label: moment(record.label, sqlFormat).format(getFormat()),
        values: record.values,
      }));
    }
    return records;
  }

  function getAggregate() {
    return [
      options.sequelize.fn(
        params.aggregate.toLowerCase(),
        options.sequelize.col(getAggregateField()),
      ),
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
    return isMSSQL(options) ? [getGroupByDateFieldFormatedForMSSQL(timeRange)] : [options.sequelize.literal('1')];
  }

  function getOrder() {
    return isMSSQL(options) ? [getGroupByDateFieldFormatedForMSSQL(timeRange)] : [options.sequelize.literal('1')];
  }

  this.perform = async () => {
    const where = await new FiltersParser(schema, params.timezone, options).perform(params.filters);

    return model.unscoped().findAll({
      attributes: [getGroupByDateInterval(), getAggregate()],
      include: getIncludes(),
      where,
      group: getGroupBy(),
      order: getOrder(),
      raw: true,
    })
      .then((records) => P.map(records, (record) => ({
        label: record.date,
        values: { value: parseInt(record.value, 10) },
      })))
      .then((records) => ({ value: fillEmptyDateInterval(records) }));
  };
}

module.exports = LineStatGetter;
