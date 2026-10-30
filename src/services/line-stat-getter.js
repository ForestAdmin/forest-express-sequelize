import { Schemas, scopeManager } from 'forest-express';
import createError from 'http-errors';
import _ from 'lodash';
import moment from 'moment';
import { isMSSQL, isMySQL, isSQLite } from '../utils/database';
import Orm from '../utils/orm';
import QueryOptions from './query-options';

const ALLOWED_AGGREGATORS = new Set(['count', 'sum', 'avg', 'min', 'max']);

function describeInput(value) {
  return typeof value === 'string' ? JSON.stringify(value) : typeof value;
}

function assertValidGroupByField(schema, groupByFieldName) {
  const schemaField = typeof groupByFieldName === 'string'
    && !groupByFieldName.includes(':')
    && schema.fields.find((field) => field.field === groupByFieldName);

  if (!schemaField || schemaField.isVirtual || schemaField.reference) {
    throw createError(400, `Invalid group by field ${describeInput(groupByFieldName)}`);
  }
}

function assertValidAggregator(aggregator) {
  if (typeof aggregator !== 'string' || !ALLOWED_AGGREGATORS.has(aggregator.toLowerCase())) {
    throw createError(400, `Invalid aggregator ${describeInput(aggregator)}`);
  }
}

const VALID_TIMEZONES = new Set();

function LineStatGetter(model, params, options, user) {
  const schema = Schemas.schemas[model.name];
  const timeRange = params.timeRange.toLowerCase();

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
    const fieldName = params.aggregateFieldName
      || schema.primaryKeys[0]
      || schema.fields[0].field;
    return `${schema.name}.${Orm.getColumnName(schema, fieldName)}`;
  }

  function getGroupByDateField() {
    if (typeof params.groupByFieldName !== 'string') return null;
    return `${schema.name}.${Orm.getColumnName(schema, params.groupByFieldName)}`;
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

  function getTimezoneName() {
    const timezone = params.timezone?.toString();

    if (!timezone) {
      throw createError(400, 'Missing timezone');
    }

    if (!VALID_TIMEZONES.has(timezone)) {
      if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
        throw new Error('Time zones are not available in this environment');
      }

      try {
        Intl.DateTimeFormat('en-US', { timeZone: timezone });
      } catch {
        throw createError(400, `Invalid timezone: "${timezone}"`);
      }

      VALID_TIMEZONES.add(timezone);
    }

    return timezone;
  }

  function isTimezoneInQuery() {
    return !isMySQL(model.sequelize) && !isMSSQL(model.sequelize) && !isSQLite(model.sequelize);
  }

  function getGroupByDateInterval(timezone) {
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
          params.timeRange,
          options.Sequelize.fn(
            'timezone',
            timezone,
            options.Sequelize.literal(`"${groupByDateField.replace('.', '"."')}"`),
          ),
        ),
        'YYYY-MM-DD 00:00:00',
      ),
      'date',
    ];
  }

  function getFormat() {
    switch (timeRange) {
      case 'day': return 'DD/MM/YYYY';
      case 'week': return '[W]W-GGGG';
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
        params.aggregator.toLowerCase(),
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
    assertValidGroupByField(schema, params.groupByFieldName);
    assertValidAggregator(params.aggregator);

    const { filter } = params;
    const timezone = isTimezoneInQuery() ? getTimezoneName() : params.timezone;
    const scopeFilters = await scopeManager.getScopeForUser(user, model.name, true);

    const queryOptions = new QueryOptions(model, { includeRelations: true });
    await queryOptions.filterByConditionTree(filter, timezone);
    await queryOptions.filterByConditionTree(scopeFilters, timezone);

    const sequelizeOptions = {
      ...queryOptions.sequelizeOptions,
      attributes: [getGroupByDateInterval(timezone), getAggregate()],
      group: getGroupBy(),
      order: getOrder(),
      raw: true,
    };

    // do not load related properties
    if (sequelizeOptions.include) {
      sequelizeOptions.include = sequelizeOptions.include.map(
        (includeProperties) => ({ ...includeProperties, attributes: [] }),
      );
    }

    const records = await model.unscoped().findAll(sequelizeOptions);

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
