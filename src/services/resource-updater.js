import { scopeManager } from 'forest-express';
import { ErrorHTTP422 } from './errors';
import QueryOptions from './query-options';
import ResourceGetter from './resource-getter';

class ResourceUpdater {
  constructor(model, params, newRecord, user) {
    this._model = model.unscoped();
    this._params = params;
    this._newRecord = newRecord;
    this._user = user;
  }

  async perform() {
    const { timezone } = this._params;
    const scopeFilters = await scopeManager.getScopeForUser(this._user, this._model.name, true);

    const queryOptions = new QueryOptions(this._model);
    await queryOptions.filterByIds([this._params.recordId]);
    await queryOptions.filterByConditionTree(scopeFilters, timezone);

    const record = await this._model.findOne(queryOptions.sequelizeOptions);
    if (record) {
      Object.assign(record, this._newRecord);

      try {
        await record.validate();
        await record.save();
      } catch (error) {
        throw new ErrorHTTP422(error.message);
      }
    }

    return new ResourceGetter(
      this._model,
      { ...this.params, recordId: this._params.recordId },
      this._user,
    ).perform();
  }
}

module.exports = ResourceUpdater;
