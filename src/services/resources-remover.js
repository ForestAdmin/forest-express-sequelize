const { InvalidParameterError } = require('./errors');
const QueryOptions = require('./query-options');

class ResourcesRemover {
  constructor(model, ids) {
    this._model = model.unscoped();
    this._ids = ids;
  }

  async perform() {
    if (!Array.isArray(this._ids) || !this._ids.length) {
      throw new InvalidParameterError('`ids` must be a non-empty array.');
    }

    const queryOptions = new QueryOptions(this._model);
    await queryOptions.filterByIds(this._ids);

    return this._model.destroy(queryOptions.sequelizeOptions);
  }
}

module.exports = ResourcesRemover;
