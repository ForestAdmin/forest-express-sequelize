const Interface = require('forest-express');
const CompositeKeysManager = require('./composite-keys-manager');
const { InvalidParameterError } = require('./errors');

function ResourcesRemover(model, ids) {
  this.perform = () => {
    if (!Array.isArray(ids) || !ids.length) {
      throw new InvalidParameterError('`ids` must be an array.');
    }

    const schema = Interface.Schemas.schemas[model.name];
    const compositeKeysManager = new CompositeKeysManager(model);
    const where = schema.isCompositePrimary
      ? compositeKeysManager.getRecordsConditions(ids) : { [schema.idField]: ids };

    return model.destroy({ where });
  };
}

module.exports = ResourcesRemover;
