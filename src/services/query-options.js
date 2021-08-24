import { logger, Schemas } from 'forest-express';
import _ from 'lodash';
import { isMSSQL } from '../utils/database';
import Operators from '../utils/operators';
import QueryUtils from '../utils/query';
import SequelizeCompatibility from '../utils/sequelize-compatibility';
import { ErrorHTTP422 } from './errors';
import FiltersParser from './filters-parser';
import LiveQueryChecker from './live-query-checker';
import PrimaryKeysManager from './primary-keys-manager';
import QueryBuilder from './query-builder';
import SearchBuilder from './search-builder';

/**
 * Sequelize query options generator which is configured using forest admin concepts (filters,
 * search, segments, ...).
 * Those can be used for update, findAll, destroy, ...
 */
class QueryOptions {
  /**
   * Query options which can be used with sequelize.
   * i.e: Books.findAll(queryOptions.sequelizeOptions);
   */
  get sequelizeOptions() {
    const options = {};
    if (this._sequelizeWhere) options.where = this._sequelizeWhere;
    if (this._sequelizeInclude) options.include = this._sequelizeInclude;
    if (this._sequelizeOrder.length) options.order = this._sequelizeOrder;
    if (this._offset !== undefined && this._limit !== undefined) {
      options.offset = this._offset;
      options.limit = this._limit;
    }

    if (this._restrictFieldsOnRootModel && this._requestedFields.size) {
      options.attributes = [...this._requestedFields].filter((s) => !s.includes('.'));
    }

    return SequelizeCompatibility.postProcess(this._model, options);
  }

  /**
   * Used to support segments defined as a sequelize scope.
   * This feature is _not_ in the documentation, but support should be kept.
   */
  get sequelizeScopes() {
    return this._scopes;
  }

  /** Compute sequelize query `.where` property */
  get _sequelizeWhere() {
    const operators = Operators.getInstance({ Sequelize: this._Sequelize });

    switch (this._where.length) {
      case 0:
        return null;
      case 1:
        return this._where[0];
      default:
        return QueryUtils.mergeWhere(operators, ...this._where);
    }
  }

  /** Compute sequelize query `.include` property */
  get _sequelizeInclude() {
    const fields = [...this._requestedFields, ...this._neededFields];
    const include = [
      ...new QueryBuilder().getIncludes(this._model, fields.length ? fields : null),
      ...this._customerIncludes,
    ];

    return include.length ? include : null;
  }

  /** Compute sequelize query `.order` property */
  get _sequelizeOrder() {
    if (isMSSQL(this._model.sequelize) && this._sequelizeInclude?.length) {
      // Work around sequelize bug: https://github.com/sequelize/sequelize/issues/11258
      const primaryKeys = Object.keys(this._model.primaryKeys);
      return this._order.filter((order) => !primaryKeys.includes(order[0]));
    }

    return this._order;
  }

  /**
   * @param {sequelize.model} model Sequelize model that should be targeted
   * @param {boolean} options.includeRelations Include BelongsTo and HasOne relations by default
   * @param {boolean} options.tableAlias Alias that will be used for this table on the final query
   *  This should have been handled by sequelize but it was needed in order to use
   *  sequelize.fn('lower', sequelize.col('<alias>.col')) in the search-builder with
   *  has-many-getter.
   */
  constructor(model, options = {}) {
    this._Sequelize = model.sequelize.constructor;
    this._schema = Schemas.schemas[model.name];
    this._model = model.unscoped();
    this._options = options;

    // Used to compute relations that will go in the final 'include'
    this._restrictFieldsOnRootModel = false;
    this._requestedFields = new Set();
    this._neededFields = new Set();
    this._scopes = []; // @see sequelizeScopes getter

    // Other sequelize params
    this._where = [];
    this._order = [];
    this._offset = undefined;
    this._limit = undefined;
    this._customerIncludes = [];

    if (this._options.includeRelations) {
      _.values(this._model.associations)
        .filter((association) => ['HasOne', 'BelongsTo'].includes(association.associationType))
        .forEach((association) => this._requestedFields.add(association.associationAccessor));
    }
  }

  /**
   * Add the required includes from a list of field names.
   * @param {string[]} fields Fields of HasOne and BelongTo relations are
   *  accepted (ie. 'book.name').
   * @param {string[]} fields the output of the extractRequestedFields() util function
   * @param {boolean} applyOnRootModel restrict fetched fields also on the root
   */
  async requireFields(fields, applyOnRootModel = false) {
    if (fields) {
      fields.forEach((field) => this._requestedFields.add(field));
    }

    this._restrictFieldsOnRootModel = Boolean(applyOnRootModel);
  }

  /**
   * Filter resulting query set with packed primary ids.
   * This works both for normal collection, and those which use composite primary keys.
   * @param {string[]} recordIds Packed record ids
   */
  async filterByIds(recordIds) {
    this._where.push(new PrimaryKeysManager(this._model).getRecordsConditions(recordIds));
  }

  /**
   * Apply condition tree to those query options (scopes, user filters, charts, ...)
   * @param {*} filters standard forest filters
   * @param {string} timezone timezone of the user (required if filtering on dates)
   */
  async filterByConditionTree(filters, timezone) {
    if (!filters) return;

    const filterParser = new FiltersParser(this._schema, timezone, { Sequelize: this._Sequelize });
    const whereClause = await filterParser.perform(filters);
    this._where.push(whereClause);

    const associations = await filterParser.getAssociations(filters);
    associations.forEach((association) => this._neededFields.add(association));
  }

  /**
   * Retrict rows to those matching a search string
   * @param {string} search search string
   * @param {boolean} searchExtended if truthy, enable search in relations
   */
  async search(search, searchExtended) {
    if (!search) return [];

    const options = { Sequelize: this._Sequelize };
    const fieldNames = this._requestedFields.size ? [...this._requestedFields] : null;
    const helper = new SearchBuilder(this._model, options, { search, searchExtended }, fieldNames);

    const { conditions, include } = helper.performWithSmartFields(this._options.tableAlias);
    if (conditions) {
      this._where.push(conditions);
    } else {
      this._where.push(this._Sequelize.literal('(0=1)'));
    }

    if (include) {
      this._customerIncludes.push(...include);
    }

    return helper.getFieldsSearched();
  }

  /**
   * Apply a forestadmin segment
   * @param {string} name name of the segment (from the querystring)
   * @param {string} segmentQuery SQL query of the segment (also from querystring)
   */
  async segment(name) {
    if (!name) return;

    const segment = this._schema.segments?.find((s) => s.name === name);

    // Segments can be provided as a sequelize scope (undocumented).
    if (segment?.scope) {
      this._scopes.push(segment.scope);
    }

    // ... or as a function which returns a sequelize where clause ...
    if (typeof segment?.where === 'function') {
      this._where.push(await segment.where());
    }
  }

  /**
   * Apply a segment query.
   * FIXME: Select SQL injection allows to fetch any information from database.
   * @param {string} query
   */
  async segmentQuery(query) {
    if (!query) return;

    const [primaryKey] = _.keys(this._model.primaryKeys);
    const queryToFilterRecords = query.trim();

    new LiveQueryChecker().perform(queryToFilterRecords);

    try {
      const options = { type: this._Sequelize.QueryTypes.SELECT };
      const records = await this._model.sequelize.query(queryToFilterRecords, options);
      const recordIds = records.map((result) => result[primaryKey] || result.id);

      this.filterByIds(recordIds);
    } catch (error) {
      const errorMessage = `Invalid SQL query for this Live Query segment:\n${error.message}`;
      logger.error(errorMessage);
      throw new ErrorHTTP422(errorMessage);
    }
  }

  /**
   * Apply sort instructions from a sort string in the form 'field', '-field' or 'field.subfield'.
   * Multiple sorts are not supported
   * @param {string} sortString a sort string
   */
  async sort(sortString) {
    if (!sortString) return;

    const [sortField, order] = sortString[0] === '-'
      ? [sortString.substring(1), 'DESC']
      : [sortString, 'ASC'];

    if (sortField.includes('.')) {
      // Sort on the belongsTo displayed field
      const [associationName, fieldName] = sortField.split('.');
      this._order.push([associationName, fieldName, order]);
      this._neededFields.add(sortField);
    } else {
      this._order.push([sortField, order]);
    }
  }

  /**
   * Apply pagination.
   * When called with invalid parameters the query will be paginated using default values.
   * @param {number|string} number page number (starting at one)
   * @param {number|string} size page size
   */
  async paginate(number, size) {
    const limit = Number.parseInt(size, 10);
    const offset = (Number.parseInt(number, 10) - 1) * limit;

    if (offset >= 0 && limit > 0) {
      this._offset = offset;
      this._limit = limit;
    } else {
      this._offset = 0;
      this._limit = 10;
    }
  }
}

module.exports = QueryOptions;
