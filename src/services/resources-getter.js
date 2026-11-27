import { Schemas, scopeManager } from 'forest-express';
import _ from 'lodash';
import PrimaryKeysManager from './primary-keys-manager';
import QueryOptions from './query-options';
import redactRelatedRecords from './related-record-scopes';
import extractRequestedFields from './requested-fields-extractor';

class ResourcesGetter {
  constructor(
    model,
    lianaOptions,
    params,
    user,
    { redactRelatedRecords: redactRelated = true } = {},
  ) {
    // lianaOptions is kept for compatibility with forest-express-mongoose
    this._model = model.unscoped();
    this._params = params;
    this._user = user;
    // Code calling the getter itself, such as a smart action, reads related records as stored: only
    // what the agent serves is emptied.
    this._redact = redactRelated;
  }

  async perform() {
    return [
      await this._getRecords(),
      await this._getFieldsSearched(),
    ];
  }

  /** Count records matching current query (wo/ pagination) */
  async count() {
    const [model, options] = await this._buildQueryOptions({ forCount: true });

    // If no primary key is found, use * as a fallback for Sequelize.
    return model.count({
      ...options,
      col: _.isEmpty(this._model.primaryKeys) ? '*' : undefined,
    });
  }

  /** Load records matching current query (w/ pagination) */
  async _getRecords() {
    const [model, options] = await this._buildQueryOptions();
    const records = await model.findAll(options);
    new PrimaryKeysManager(this._model).annotateRecords(records);
    if (!this._redact) return records;
    return redactRelatedRecords(this._model, records, this._user, this._params.timezone);
  }

  /** Get list of fields descriptors which are used when searching (for frontend highlighting). */
  async _getFieldsSearched() {
    const { fields, search, searchExtended } = this._params;
    const requestedFields = extractRequestedFields(fields, this._model, Schemas.schemas);

    const queryOptions = new QueryOptions(this._model);
    await queryOptions.requireFields(requestedFields);
    return queryOptions.search(search, searchExtended);
  }

  /** Compute query options (shared for count and getRecords) */
  async _buildQueryOptions(buildOptions = {}) {
    const { forCount, tableAlias } = buildOptions;
    const {
      fields, filters,
      search, searchExtended, segment, segmentQuery, timezone,
    } = this._params;

    const scopeFilters = await scopeManager.getScopeForUser(this._user, this._model.name, true);

    const requestedFields = extractRequestedFields(fields, this._model, Schemas.schemas);
    const queryOptions = new QueryOptions(this._model, {
      tableAlias,
      includeRelations: searchExtended,
    });
    if (!forCount) await queryOptions.requireFields(requestedFields);
    // Code calling the getter itself filters on related records as stored, as it reads them.
    if (this._redact) await queryOptions.applyRelatedScopes(this._user, timezone);
    await queryOptions.search(search, searchExtended);
    await queryOptions.filterByConditionTree(filters, timezone);
    await queryOptions.filterByScope(scopeFilters, timezone);
    await queryOptions.segment(segment);
    await queryOptions.segmentQuery(segmentQuery);

    if (!forCount) {
      const { sort, page } = this._params;
      await queryOptions.sort(sort);
      await queryOptions.paginate(page?.number, page?.size);
    }

    return [
      // add scopes to model
      queryOptions.sequelizeScopes.reduce((m, scope) => m.scope(scope), this._model),
      queryOptions.sequelizeOptions,
    ];
  }
}

module.exports = ResourcesGetter;
