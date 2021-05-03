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
    const { associationName, recordId } = this._params;
    const [model, options] = await super._buildQueryOptions({
      ...buildOptions, tableAlias: associationName,
    });

    const parentOptions = {
      where: new PrimaryKeysManager(this._parentModel).getRecordsConditions([recordId]),
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

    return parentOptions;
  }
}

module.exports = HasManyGetter;
