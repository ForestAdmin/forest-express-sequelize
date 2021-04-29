import createError from 'http-errors';
import CompositeKeysManager from './composite-keys-manager';
import QueryOptions from './query-options';

class ResourceGetter {
  constructor(model, params) {
    this._model = model.unscoped();
    this._params = params;
  }

  async perform() {
    const queryOptions = new QueryOptions(this._model, { includeRelations: true });
    await queryOptions.filterByIds([this._params.recordId]);

    const record = await this._model.findOne(queryOptions.sequelizeOptions);
    if (!record) {
      throw createError(404, `The ${this._model.name} #${this._params.recordId} does not exist.`);
    }

    new CompositeKeysManager(this._model).annotateRecords([record]);
    return record;
  }
}

module.exports = ResourceGetter;
