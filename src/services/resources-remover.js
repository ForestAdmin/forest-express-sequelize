const PrimaryKeysManager = require('./primary-keys-manager');
const { InvalidParameterError } = require('./errors');

function ResourcesRemover(model, ids, options) {
  this.perform = () => {
    if (!Array.isArray(ids) || !ids.length) {
      throw new InvalidParameterError('`ids` must be a non-empty array.');
    }

    const where = new PrimaryKeysManager(model).getRecordsConditions(ids, options);

    return model.destroy({ where });
  };
}

module.exports = ResourcesRemover;
