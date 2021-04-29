import { ScopeManager } from 'forest-express';
import { InvalidParameterError } from './errors';
import QueryOptions from './query-options';

class ResourcesRemover {
  constructor(model, ids, user) {
    this._model = model.unscoped();
    this._ids = ids;
    this._user = user;
  }

  async perform() {
    if (!Array.isArray(this._ids) || !this._ids.length) {
      throw new InvalidParameterError('`ids` must be a non-empty array.');
    }

    const { timezone } = this._params;
    const scopeFilters = await ScopeManager.getScopeForUser(this._user, this._model.name);

    const queryOptions = new QueryOptions(this._model);
    await queryOptions.filterByIds(this._ids);
    await queryOptions.filterByConditionTree(scopeFilters, timezone);

    return this._model.destroy(queryOptions.sequelizeOptions);
  }
}

module.exports = ResourcesRemover;
