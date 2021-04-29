import { ErrorHTTP422 } from './errors';
import QueryOptions from './query-options';
import ResourceGetter from './resource-getter';

class ResourceUpdater {
  constructor(model, params, newRecord) {
    this._model = model.unscoped();
    this._params = params;
    this._newRecord = newRecord;
  }

  async perform() {
    const queryOptions = new QueryOptions(this._model);
    await queryOptions.filterByIds([this._params.recordId]);

    const record = await this._model.findOne(queryOptions.sequelizeOptions);
    if (record) {
      Object.assign(record, this._newRecord);

      try {
        await record.validate();
      } catch (error) {
        throw new ErrorHTTP422(error.message);
      }
      record.save();
    }

    return new ResourceGetter(this._model, { recordId: this._params.recordId }).perform();
  }
}

module.exports = ResourceUpdater;
