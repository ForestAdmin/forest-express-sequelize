import Promise from 'bluebird';
import { BaseOperatorDateParser, Schemas, scopeManager } from 'forest-express';
import _ from 'lodash';
import Operators from '../utils/operators';
import Orm from '../utils/orm';
import FiltersParser from './filters-parser';
import QueryOptions from './query-options';

class ValueStatGetter {
  constructor(model, params, options, user) {
    this._model = model;
    this._params = params;
    this._options = options;
    this._user = user;

    this._OPERATORS = Operators.getInstance(options);
    this._schema = Schemas.schemas[model.name];
    this._operatorDateParser = new BaseOperatorDateParser({
      operators: this._OPERATORS, timezone: params.timezone,
    });
  }

  /** Function used to aggregate results (count, sum, ...) */
  get _aggregateFunction() {
    return this._params.aggregate.toLowerCase();
  }

  /** Column name we're aggregating on */
  get _aggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
    const fieldName = this._params.aggregate_field
      || this._schema.primaryKeys[0]
      || this._schema.fields[0].field;

    return `${this._schema.name}.${Orm.getColumnName(this._schema, fieldName)}`;
  }

  async perform() {
    const { filters, timezone } = this._params;
    const scopeFilters = await scopeManager.getScopeForUser(this._user, this._model.name, true);

    const queryOptions = new QueryOptions(this._model, { includeRelations: true });
    await queryOptions.filterByConditionTree(filters, timezone);
    await queryOptions.filterByConditionTree(scopeFilters, timezone);

    // No attributes should be retrieved from relations for the group by to work.
    const options = queryOptions.sequelizeOptions;
    options.include = options.include
      ? options.include.map((includeProperties) => ({ ...includeProperties, attributes: [] }))
      : undefined;

    return {
      value: await Promise.props({
        countCurrent: this._getCount(options),
        countPrevious: this._getCountPrevious(options),
      }),
    };
  }

  async _getCount(options) {
    const count = await this._model
      .unscoped()
      .aggregate(this._aggregateField, this._aggregateFunction, options);

    // sequelize@4 returns NaN, while sequelize@5+ returns null
    return count || 0;
  }

  /**
   * Fetch the value for the previous period.
   *
   * FIXME Will not work on edges cases
   * - when the 'rawPreviousInterval.field' appears twice
   * - when scopes use the same field as the filter
   */
  async _getCountPrevious(options) {
    const { filters, timezone } = this._params;
    if (!filters) {
      return undefined;
    }

    const conditionsParser = new FiltersParser(this._schema, timezone, this._options);
    const rawInterval = conditionsParser.getPreviousIntervalCondition(filters);
    if (!rawInterval) {
      return undefined;
    }

    const interval = this._operatorDateParser.getPreviousDateFilter(
      rawInterval.operator, rawInterval.value,
    );

    const newOptions = _.cloneDeepWith(options, (object) => (
      object && object[rawInterval.field]
        ? { ...object, [rawInterval.field]: interval }
        : undefined
    ));

    return this._getCount(newOptions);
  }
}

module.exports = ValueStatGetter;
