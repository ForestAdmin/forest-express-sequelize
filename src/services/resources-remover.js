import { scopeManager } from 'forest-express';
import { InvalidParameterError } from './errors';
import QueryOptions from './query-options';

class ResourcesRemover {
  constructor(model, params, ids, user) {
    this._model = model.unscoped();
    this._params = params;
    this._ids = ids;
    this._user = user;
  }

  async perform() {
    if (!Array.isArray(this._ids) || !this._ids.length) {
      throw new InvalidParameterError('`ids` must be a non-empty array.');
    }

    const { timezone } = this._params;
    const scopeFilters = await scopeManager.getScopeForUser(this._user, this._model.name, true);

    const queryOptions = new QueryOptions(this._model);
    await queryOptions.filterByIds(this._ids);
    await queryOptions.filterByConditionTree(scopeFilters, timezone);

    return this._model.destroy(queryOptions.sequelizeOptions);
  }
}

module.exports = ResourcesRemover;
