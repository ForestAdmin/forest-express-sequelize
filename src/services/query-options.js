import { logger, Schemas, scopeManager } from 'forest-express';
import _ from 'lodash';
import { isMSSQL } from '../utils/database';
import Operators from '../utils/operators';
import QueryUtils from '../utils/query';
import SequelizeCompatibility from '../utils/sequelize-compatibility';
import { ErrorHTTP422 } from './errors';
import FiltersParser from './filters-parser';
import PrimaryKeysManager from './primary-keys-manager';
import QueryBuilder from './query-builder';
import SearchBuilder from './search-builder';

const TO_ONE = ['HasOne', 'BelongsTo'];

/**
 * The SELECT that model.findAll(options) would run, as SQL to nest in another query. It goes
 * through the steps findAll takes before generating its SQL, so includes and paranoid models read
 * as they do in a list. Included models select no column of their own.
 */
function selectSql(model, options) {
  const withoutAttributes = (includes) => includes?.map((include) => ({
    ...include,
    attributes: [],
    ...(include.include && { include: withoutAttributes(include.include) }),
  }));
  const selectOptions = {
    ...options,
    // The joins read the root alias from `as`, the columns from `tableAs`.
    ...(options.tableAs && { as: options.tableAs }),
    include: withoutAttributes(options.include),
    raw: true,
  };
  if (!selectOptions.include) delete selectOptions.include;

  model._conformIncludes(selectOptions, model);
  model._expandIncludeAll(selectOptions);
  if (selectOptions.include) {
    selectOptions.hasJoin = true;
    model._validateIncludedElements(selectOptions);
  }
  model.sequelize.constructor.Utils.mapFinderOptions(selectOptions, model);
  model._paranoidClause(model, selectOptions);

  const generator = model.sequelize.getQueryInterface().queryGenerator;
  return generator.selectQuery(model.getTableName(), selectOptions, model).replace(/;\s*$/, '');
}

/**
 * A condition matching the rows of model that the query options select, by primary key, so
 * conditions written for one join can be applied from another.
 * @param {string} alias the alias model has in the query the condition goes into
 * @returns {*} the condition, or null when model has no primary key to match on, or when its
 *  composite key would be matched through aliases the query minifies
 */
function primaryKeyCondition(model, { where, include }, alias) {
  const keys = model.primaryKeyAttributes;
  const { sequelize } = model;
  const { AND, EQ, IN } = Operators.getInstance({ Sequelize: sequelize.constructor });

  if (keys.length === 1) {
    const sql = selectSql(model, { where, include, attributes: keys });
    return { [keys[0]]: { [IN]: sequelize.literal(`(${sql})`) } };
  }
  if (!keys.length || sequelize.options.minifyAliases) return null;

  // A join of the subquery under the enclosing row's alias would hide that row from it.
  const aliases = (includes, prefix = '') => (includes ?? []).flatMap((relation) => [
    `${prefix}${relation.as}`, ...aliases(relation.include, `${prefix}${relation.as}->`),
  ]);
  if (aliases(include).includes(alias)) return null;

  // Under its own alias, so each key column compares with the row of the enclosing query.
  const sameKey = keys.map((key) => ({
    [key]: { [EQ]: sequelize.col(`${alias}.${model.rawAttributes[key].field}`) },
  }));
  const sql = selectSql(model, {
    where: { [AND]: [where, ...sameKey].filter(Boolean) },
    include,
    attributes: keys,
    tableAs: 'forest_scoped',
  });
  return { [AND]: [sequelize.literal(`EXISTS (${sql})`)] };
}

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

    if (this._requestedFields.size && !this._hasRequestedSmartFields) {
      // Restricting loaded fields on the root model is opt-in with sequelize to avoid
      // side-effects as this was not supported historically and it would probably break
      // smart fields.
      // @see https://github.com/ForestAdmin/forest-express-sequelize/blob/7d7ad0/src/services/resources-getter.js#L142

      const simpleSchemaFields = this._schema.fields
        .filter((field) => !field.reference)
        .map((field) => field.field);
      options.attributes = [...this._requestedFields]
        .filter((field) => simpleSchemaFields.includes(field));
      options.attributes.push(...this._schema.primaryKeys);
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
    const fields = [...this._requestedFields, ...this._requestedRelations, ...this._neededFields];
    const include = [
      ...new QueryBuilder().getIncludes(this._model, fields),
      ...this._customerIncludes,
    ].map((relation) => {
      // Includes added by smart field searches may name the association or the model alone.
      const as = relation.as ?? relation.association?.as ?? (
        typeof relation.association === 'string' ? relation.association : _.values(this._model.associations)
          .find((association) => association.target === (relation.model ?? relation))?.as
      );
      const where = this._relatedScopes[as];
      if (!where) return relation;

      // Not required: a related record the scope hides joins as empty, and its row is kept.
      return {
        ...(relation.model || relation.association ? relation : { model: relation }),
        as,
        where,
        required: false,
        [SequelizeCompatibility.JOIN_CONDITION]: true,
      };
    });

    return include.length ? include : null;
  }

  /** Compute sequelize query `.order` property */
  get _sequelizeOrder() {
    if (isMSSQL(this._model.sequelize)) {
      // Work around sequelize bug: https://github.com/sequelize/sequelize/issues/11258
      const primaryKeys = Object.keys(this._model.primaryKeys);
      return this._order.filter((order) => !primaryKeys.includes(order[0]));
    }

    return this._order;
  }

  get _hasRequestedSmartFields() {
    return this._schema.fields
      .some((field) => field.isVirtual && this._requestedFields.has(field.field));
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
    this._requestedFields = new Set();
    this._requestedRelations = new Set();
    this._neededFields = new Set();
    this._scopes = []; // @see sequelizeScopes getter

    // Other sequelize params
    this._where = [];
    this._order = [];
    this._offset = undefined;
    this._limit = undefined;
    this._customerIncludes = [];
    this._relatedScopes = {}; // @see applyRelatedScopes

    if (this._options.includeRelations) {
      _.values(this._model.associations)
        .filter((association) => TO_ONE.includes(association.associationType))
        .forEach((association) => this._requestedRelations.add(association.associationAccessor));
    }
  }

  /**
   * Add the required includes from a list of field names.
   * @param {string[]} fields Fields of HasOne and BelongTo relations are
   *  accepted (ie. 'book.name').
   * @param {string[]} fields the output of the extractRequestedFields() util function
   * @param {boolean} applyOnRootModel restrict fetched fields also on the root
   */
  async requireFields(fields) {
    if (fields) {
      fields.forEach((field) => this._requestedFields.add(field));
    }
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
   * Join each to-one related collection whose scope applies to related records through that
   * scope, so a related record it hides reads as empty in filters, sorts and searches.
   * @param {*} user the user the scopes are resolved for
   * @param {string} timezone timezone of the user (required if a scope filters on dates)
   */
  async applyRelatedScopes(user, timezone) {
    const associations = _.values(this._model.associations)
      .filter((association) => TO_ONE.includes(association.associationType));

    await Promise.all(associations.map(async ({ as, target }) => {
      const scope = await QueryOptions.getRelatedScope(target, user, timezone);
      if (!scope?.where) return;
      if (!scope.include) {
        this._relatedScopes[as] = scope.where;
        return;
      }

      // A scope going through relations of its own is checked by key: nested in this join, its
      // conditions would name the wrong aliases. Where no key can be matched, the relation is
      // filtered on as stored.
      const alias = this._options.tableAlias ? `${this._options.tableAlias}->${as}` : as;
      const condition = primaryKeyCondition(target, scope, alias);
      if (condition) this._relatedScopes[as] = condition;
    }));
  }

  /**
   * The scope that hides related records of a collection, when the server flags it as applying
   * to related records. A collection without a primary key has its related records served as
   * stored, so it has none.
   * @param {sequelize.model} model the related collection
   * @param {*} user the user the scope is resolved for
   * @param {string} timezone timezone of the user (required if the scope filters on dates)
   * @returns {Promise<{where, include}|null>} the scope as Sequelize options, null when none
   */
  static async getRelatedScope(model, user, timezone) {
    // A forest-express release without the lookup reads as not flagged.
    if (!await scopeManager.scopeAppliesToRelatedRecords?.(user, model.name)) return null;
    if (!model.primaryKeyAttributes.length) return null;

    const scopeOptions = new QueryOptions(model);
    await scopeOptions.filterByConditionTree(
      await scopeManager.getScopeForUser(user, model.name, true),
      timezone,
    );
    const { where, include } = scopeOptions.sequelizeOptions;
    return { where, include };
  }

  /**
   * Apply the collection's own scope. Its conditions on related fields compare the related
   * records as stored, which the join applyRelatedScopes restricted no longer holds, so a scope
   * touching such a relation is checked by key. Where no key can be matched, those relations are
   * filtered on as stored instead.
   * @param {*} scope the scope's condition tree
   * @param {string} timezone timezone of the user (required if filtering on dates)
   */
  async filterByScope(scope, timezone) {
    const hiddenRelated = scope && !_.isEmpty(this._relatedScopes)
      ? (await new FiltersParser(this._schema, timezone, { Sequelize: this._Sequelize })
        .getAssociations(scope)).filter((as) => this._relatedScopes[as])
      : [];
    if (!hiddenRelated.length) {
      await this.filterByConditionTree(scope, timezone);
      return;
    }

    const stored = new QueryOptions(this._model);
    await stored.filterByConditionTree(scope, timezone);
    const condition = primaryKeyCondition(
      this._model, stored.sequelizeOptions, this._options.tableAlias ?? this._model.name,
    );
    if (condition) {
      this._where.push(condition);
      return;
    }

    hiddenRelated.forEach((as) => delete this._relatedScopes[as]);
    await this.filterByConditionTree(scope, timezone);
  }

  /**
   * Leave out the rows whose related record exists but is hidden by its scope, so a chart
   * grouping on its fields does not count them as empty. Rows with no related record are kept.
   * @param {string} as name of a to-one association that applyRelatedScopes joined
   */
  async excludeHiddenRelated(as) {
    if (!this._relatedScopes[as]) return;

    const association = this._model.associations[as];
    const { target } = association;
    const [targetKey, rootColumn] = association.associationType === 'BelongsTo'
      ? [association.targetKey, association.identifierField]
      : [association.foreignKey, association.sourceKeyField];
    const operators = Operators.getInstance({ Sequelize: this._Sequelize });
    // Under its own alias, so the condition reaches this query's row even when both are one table.
    const related = selectSql(target, {
      attributes: [targetKey],
      where: { [targetKey]: { [operators.EQ]: this._Sequelize.col(`${this._model.name}.${rootColumn}`) } },
      tableAs: 'forest_related',
    });

    this._where.push({
      [operators.OR]: [
        { [`$${as}.${target.primaryKeyField}$`]: { [operators.NE]: null } },
        this._Sequelize.literal(`NOT EXISTS (${related})`),
      ],
    });
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

    const { conditions, include } = await helper.performWithSmartFields(this._options.tableAlias);
    if (conditions) {
      this._where.push(conditions);
    } else {
      this._where.push(this._Sequelize.literal('(0=1)'));
    }

    if (include) {
      if (Array.isArray(include)) {
        this._customerIncludes.push(...include);
      } else {
        this._customerIncludes.push(include);
      }
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

    const primaryKey = _.values(this._model.primaryKeys)[0].field;
    const queryToFilterRecords = query.trim();

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
   * Apply sort instructions from a sort string in the form 'field', '-field' or 'field.subfield',
   * several of them comma-separated: 'field,-otherField'.
   * @param {string} sortString a sort string
   */
  async sort(sortString) {
    if (!sortString) return;

    sortString.split(',').filter(Boolean).forEach((sortChunk) => {
      const [sortField, order] = sortChunk[0] === '-'
        ? [sortChunk.substring(1), 'DESC']
        : [sortChunk, 'ASC'];

      if (sortField.includes('.')) {
        // Sort on the belongsTo displayed field
        const [associationName, fieldName] = sortField.split('.');
        this._order.push([associationName, fieldName, order]);
        this._neededFields.add(sortField);
      } else {
        this._order.push([sortField, order]);
      }
    });
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
