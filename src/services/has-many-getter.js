import { pick } from 'lodash';
import SequelizeCompatibility from '../utils/sequelize-compatibility';
import PrimaryKeysManager from './primary-keys-manager';
import ResourcesGetter from './resources-getter';

class HasManyGetter extends ResourcesGetter {
  constructor(model, association, lianaOptions, params, user) {
    super(association, lianaOptions, params, user);

    this._parentModel = model.unscoped();
  }

  async _getRecords() {
    const options = await this._buildQueryOptions();
    const parentRecord = await this._parentModel.findOne(options);
    const records = parentRecord?.[this._params.associationName] ?? [];

    new PrimaryKeysManager(this._model).annotateRecords(records);
    return records;
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

    const parentOptions = SequelizeCompatibility.postProcess(this._parentModel, {
      where: new PrimaryKeysManager(this._parentModel).getRecordsConditions([recordId]),
      include: [{
        model,
        as: associationName,
        scope: false,
        required: !!buildOptions.forCount, // Why?
        ...pick(options, ['attributes', 'where', 'include']),
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
