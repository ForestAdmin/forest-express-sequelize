import { scopeManager } from 'forest-express';
import createError from 'http-errors';
import PrimaryKeysManager from './primary-keys-manager';
import QueryOptions from './query-options';
import redactRelatedRecords from './related-record-scopes';

class ResourceGetter {
  constructor(model, params, user, { redactRelatedRecords: redactRelated = true } = {}) {
    this._model = model.unscoped();
    this._params = params;
    this._user = user;
    // Code calling the getter itself, such as a smart action, reads related records as stored: only
    // what the agent serves is emptied.
    this._redact = redactRelated;
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
    if (this._redact) await redactRelatedRecords(this._model, [record], this._user, timezone);
    return record;
  }
}

module.exports = ResourceGetter;
