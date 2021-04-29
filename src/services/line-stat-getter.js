import { Schemas } from 'forest-express';
import _ from 'lodash';
import moment from 'moment';
import { isMSSQL, isMySQL, isSQLite } from '../utils/database';
import Orm from '../utils/orm';
import QueryOptions from './query-options';

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
        return options.Sequelize.fn(
          'DATE_FORMAT',
          options.Sequelize.col(groupByDateField),
          '%Y-%m-%d 00:00:00',
        );
      case 'week':
        return options.Sequelize
          .literal(`DATE_FORMAT(DATE_SUB(${groupByDateFieldFormated}, \
INTERVAL ((7 + WEEKDAY(${groupByDateFieldFormated})) % 7) DAY), '%Y-%m-%d 00:00:00')`);
      case 'month':
        return options.Sequelize.fn(
          'DATE_FORMAT',
          options.Sequelize.col(groupByDateField),
          '%Y-%m-01 00:00:00',
        );
      case 'year':
        return options.Sequelize.fn(
          'DATE_FORMAT',
          options.Sequelize.col(groupByDateField),
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
        return options.Sequelize.fn(
          'FORMAT',
          options.Sequelize.col(groupByDateField),
          'yyyy-MM-dd 00:00:00',
        );
      case 'week':
        return options.Sequelize
          .literal(`FORMAT(DATEADD(DAY, -DATEPART(dw,${groupByDateFieldFormated}),\
${groupByDateFieldFormated}), 'yyyy-MM-dd 00:00:00')`);
      case 'month':
        return options.Sequelize.fn(
          'FORMAT',
          options.Sequelize.col(groupByDateField),
          'yyyy-MM-01 00:00:00',
        );
      case 'year':
        return options.Sequelize.fn(
          'FORMAT',
          options.Sequelize.col(groupByDateField),
          'yyyy-01-01 00:00:00',
        );
      default:
        return null;
    }
  }

  function getGroupByDateFieldFormatedForSQLite(currentTimeRange) {
    switch (currentTimeRange) {
      case 'day': {
        return options.Sequelize.fn(
          'STRFTIME',
          '%Y-%m-%d',
          options.Sequelize.col(groupByDateField),
        );
      }
      case 'week': {
        return options.Sequelize.fn(
          'STRFTIME',
          '%Y-%W',
          options.Sequelize.col(groupByDateField),
        );
      }
      case 'month': {
        return options.Sequelize.fn(
          'STRFTIME',
          '%Y-%m-01',
          options.Sequelize.col(groupByDateField),
        );
      }
      case 'year': {
        return options.Sequelize.fn(
          'STRFTIME',
          '%Y-01-01',
          options.Sequelize.col(groupByDateField),
        );
      }
      default:
        return null;
    }
  }

  function getGroupByDateInterval() {
    if (isMySQL(model.sequelize)) {
      return [getGroupByDateFieldFormatedForMySQL(timeRange), 'date'];
    }
    if (isMSSQL(model.sequelize)) {
      return [getGroupByDateFieldFormatedForMSSQL(timeRange), 'date'];
    }
    if (isSQLite(model.sequelize)) {
      return [getGroupByDateFieldFormatedForSQLite(timeRange), 'date'];
    }
    return [
      options.Sequelize.fn(
        'to_char',
        options.Sequelize.fn(
          'date_trunc',
          params.time_range,
          options.Sequelize.literal(`"${getGroupByDateField().replace('.', '"."')}" at time zone '${params.timezone}'`),
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
      if (isSQLite(model.sequelize) && timeRange === 'week') {
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
      options.Sequelize.fn(
        params.aggregate.toLowerCase(),
        options.Sequelize.col(getAggregateField()),
      ),
      'value',
    ];
  }

  function getGroupBy() {
    return isMSSQL(model.sequelize) ? [getGroupByDateFieldFormatedForMSSQL(timeRange)] : [options.Sequelize.literal('1')];
  }

  function getOrder() {
    return isMSSQL(model.sequelize) ? [getGroupByDateFieldFormatedForMSSQL(timeRange)] : [options.Sequelize.literal('1')];
  }

  this.perform = async () => {
    const { filters, timezone } = params;
    const queryOptions = new QueryOptions(model, { includeRelations: true });
    await queryOptions.filterByConditionTree(filters, timezone);

    const { include, where } = queryOptions.sequelizeOptions;
    const records = await model.unscoped().findAll({
      include: include ? include.map((i) => ({ ...i, attributes: [] })) : undefined,
      where,
      attributes: [getGroupByDateInterval(), getAggregate()],
      group: getGroupBy(),
      order: getOrder(),
      raw: true,
    });

    return {
      value: fillEmptyDateInterval(
        records.map((record) => ({
          label: record.date,
          values: { value: parseInt(record.value, 10) },
        })),
      ),
    };
  };
}

module.exports = LineStatGetter;
