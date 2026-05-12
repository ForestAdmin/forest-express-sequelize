import { scopeManager } from 'forest-express';
import _ from 'lodash';
import Operators from '../utils/operators';
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

    const options = queryOptions.sequelizeOptions;

    // `Model.destroy` ignores `include`, so a where clause referencing a
    // joined column (e.g. `$product.id$`) produces invalid SQL. Resolve the
    // matching primary keys with a SELECT first, then delete by PK.
    if (options.include?.length) {
      return this._destroyByPrimaryKey(options);
    }

    return this._model.destroy(options);
  }

  async _destroyByPrimaryKey(options) {
    const pkAttributes = Object.keys(this._model.primaryKeys);
    const matches = await this._model.findAll({
      attributes: pkAttributes,
      where: options.where,
      include: options.include,
    });

    if (matches.length === 0) return 0;

    return this._model.destroy({
      where: ResourcesRemover._buildPrimaryKeyWhere(this._model, pkAttributes, matches),
    });
  }

  static _buildPrimaryKeyWhere(model, pkAttributes, records) {
    if (pkAttributes.length === 1) {
      const [pk] = pkAttributes;
      return { [pk]: records.map((record) => record.get(pk)) };
    }

    const OPERATORS = Operators.getInstance({ Sequelize: model.sequelize.constructor });
    return {
      [OPERATORS.OR]: records.map(
        (record) => _.fromPairs(pkAttributes.map((pk) => [pk, record.get(pk)])),
      ),
    };
  }
}

module.exports = ResourcesRemover;
