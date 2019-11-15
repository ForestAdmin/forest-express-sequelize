const createError = require('http-errors');
const Interface = require('forest-express');
const CompositeKeysManager = require('./composite-keys-manager');
const ResourceFinder = require('./resource-finder');

function ResourceGetter(model, params) {
  const schema = Interface.Schemas.schemas[model.name];

  this.perform = function perform() {
    return new ResourceFinder(model, params, true)
      .perform()
      .then((record) => {
        if (!record) {
          throw createError(404, `The ${model.name} #${params.recordId
          } does not exist.`);
        }

        if (schema.isCompositePrimary) {
          record.forestCompositePrimary = new CompositeKeysManager(
            model,
            schema, record,
          ).createCompositePrimary();
        }

        return record;
      });
  };
}

module.exports = ResourceGetter;
