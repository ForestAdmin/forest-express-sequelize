
import Operators from '../utils/operators';
import Recursion from '../utils/recursion';
import CompositeKeysManager from './composite-keys-manager';
import ResourcesGetter from './resources-getter';

class HasManyGetter extends ResourcesGetter {
  constructor(model, association, lianaOptions, params, user) {
    super(association, lianaOptions, params, user);

    this._parentModel = model.unscoped();
  }

  async _getRecords() {
    const options = await this._buildQueryOptions();
    const record = await this._parentModel.findOne(options);
    return (record && record[this._params.associationName]) || [];
  }

  async count() {
    const options = await this._buildQueryOptions({ forCount: true });
    return this._parentModel.count(options);
  }

  async _buildQueryOptions(buildOptions = {}) {
    const { associationName, recordId } = this._params;
    const [model, options] = await super._buildQueryOptions({
      ...buildOptions, tableAlias: associationName,
    });

    const parentOptions = {
      where: new CompositeKeysManager(this._parentModel).getRecordsConditions([recordId]),
      include: [{
        model,
        as: associationName,
        scope: false,
        required: !!buildOptions.forCount, // Why?
        where: options.where,
        include: options.include,
      }],
    };

    if (!buildOptions.forCount) {
      parentOptions.subQuery = false; // Why?
      parentOptions.attributes = []; // Don't fetch parent attributes (perf)
      parentOptions.offset = options.offset;
      parentOptions.limit = options.limit;

      // Order with the relation (https://github.com/sequelize/sequelize/issues/4553)
      parentOptions.order = (options.order || []).map((o) => [associationName, ...o]);
    }

    this._bubbleWheresInPlace(parentOptions, associationName);

    return parentOptions;
  }

  /**
   * Extract all where conditions along the include tree, and bubbles them up to the top.
   * This allows to work around a sequelize quirk that cause nested 'where' to fail when they
   * refer to relation fields from an intermediary include (ie '$book.id$').
   *
   * This happens when forest admin filters on relations are used.
   *
   * @see https://sequelize.org/master/manual/eager-loading.html#complex-where-clauses-at-the-top-level
   * @see https://github.com/ForestAdmin/forest-express-sequelize/blob/7d7ad0/src/services/filters-parser.js#L104
   */
  _bubbleWheresInPlace(options) {
    const Ops = Operators.getInstance({ Sequelize: this._parentModel.sequelize.constructor });

    (options.include ?? []).forEach((include) => {
      this._bubbleWheresInPlace(include);

      const newWhere = Recursion.mapKeysDeep(include.where, (key) => (
        key[0] === '$' && key[key.length - 1] === '$'
          ? `$${include.as}.${key.substring(1)}`
          : `$${include.as}.${key}$`
      ));

      delete include.where;
      if (newWhere) {
        options.where = { [Ops.AND]: [options.where, newWhere] };
      }
    });
  }
}

module.exports = HasManyGetter;
