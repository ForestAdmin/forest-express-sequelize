const createError = require('http-errors');
const Interface = require('forest-express');
const CompositeKeysManager = require('./composite-keys-manager');
const ResourceFinder = require('./resource-finder');

// eslint-disable-next-line no-unused-vars
function ResourceGetter(model, lianaOptions, params, user) {
  const schema = Interface.Schemas.schemas[model.name];

  this.perform = function perform() {
    return new ResourceFinder(model, lianaOptions, params, true, user)
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
