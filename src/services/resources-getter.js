import _ from 'lodash';
import { Schemas } from 'forest-express';
import PrimaryKeysManager from './primary-keys-manager';
import QueryOptions from './query-options';
import extractRequestedFields from './requested-fields-extractor';

class ResourcesGetter {
  constructor(model, lianaOptions, params) {
    // The lianaOptions argument is kept for retrocompatibility w/ forest-express.
    this._model = model.unscoped();
    this._params = params ?? lianaOptions;
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

  async perform() {
    return [
      await this._getRecords(),
      await this._getFieldsSearched(),
    ];
  }

  /** Load records matching current query (w/ pagination) */
  async _getRecords() {
    const [model, options] = await this._buildQueryOptions();
    const records = await model.findAll(options);
    new PrimaryKeysManager(this._model).annotateRecords(records);
    return records;
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
      fields, filters, search, searchExtended, segment, segmentQuery, timezone,
    } = this._params;

    const requestedFields = extractRequestedFields(fields, this._model, Schemas.schemas);
    const queryOptions = new QueryOptions(this._model, { tableAlias });
    await queryOptions.requireFields(requestedFields);
    await queryOptions.search(search, searchExtended);
    await queryOptions.filterByConditionTree(filters, timezone);
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
