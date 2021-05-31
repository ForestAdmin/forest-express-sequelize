import { pick } from 'lodash';
import Operators from '../utils/operators';
import QueryUtils from '../utils/query';
import PrimaryKeysManager from './primary-keys-manager';
import ResourcesGetter from './resources-getter';

class HasManyGetter extends ResourcesGetter {
  constructor(model, association, lianaOptions, params) {
    super(association, lianaOptions, params);

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
    const operators = Operators.getInstance({ Sequelize: this._parentModel.sequelize.constructor });
    const { associationName, recordId } = this._params;
    const [model, options] = await super._buildQueryOptions({
      ...buildOptions, tableAlias: associationName,
    });

    const parentOptions = QueryUtils.bubbleWheresInPlace(operators, {
      where: new PrimaryKeysManager(this._parentModel).getRecordsConditions([recordId]),
      include: [{
        model,
        as: associationName,
        scope: false,
        required: !!buildOptions.forCount, // Why?
        ...pick(options, ['where', 'include']),
      }],
    });

    if (!buildOptions.forCount) {
      parentOptions.subQuery = false; // Why?
      parentOptions.attributes = []; // Don't fetch parent attributes (perf)
      parentOptions.offset = options.offset;
      parentOptions.limit = options.limit;

      // Order with the relation (https://github.com/sequelize/sequelize/issues/4553)
      if (options.order) {
        parentOptions.order = options.order.map((fields) => [associationName, ...fields]);
      }
    }

    return parentOptions;
  }
}

module.exports = HasManyGetter;
