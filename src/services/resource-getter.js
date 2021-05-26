import { scopeManager } from 'forest-express';
import createError from 'http-errors';
import PrimaryKeysManager from './primary-keys-manager';
import QueryOptions from './query-options';

class ResourceGetter {
  constructor(model, params, user) {
    this._model = model.unscoped();
    this._params = params;
    this._user = user;
  }

  async perform() {
    const { timezone } = this._params;
    const scopeFilters = await scopeManager.getScopeForUser(this._user, this._model.name, true);

    const queryOptions = new QueryOptions(this._model, { includeRelations: true });
    await queryOptions.filterByIds([this._params.recordId]);
    await queryOptions.filterByConditionTree(scopeFilters, timezone);

    const record = await this._model.findOne(queryOptions.sequelizeOptions);
    if (!record) {
      throw createError(404, `The ${this._model.name} #${this._params.recordId} does not exist.`);
    }

    new PrimaryKeysManager(this._model).annotateRecords([record]);
    return record;
  }
}

module.exports = ResourceGetter;
