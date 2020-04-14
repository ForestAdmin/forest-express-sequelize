const Interface = require('forest-express');
const { ErrorHTTP422 } = require('./errors');
const ResourceGetter = require('./resource-getter');
const CompositeKeysManager = require('./composite-keys-manager');
const ResourceFinder = require('./resource-finder');

function ResourceUpdater(model, params, newRecord) {
  const schema = Interface.Schemas.schemas[model.name];

  this.perform = () => {
    const compositeKeysManager = new CompositeKeysManager(model, schema, newRecord);

    return new ResourceFinder(model, params)
      .perform()
      .then((record) => {
        if (record) {
          Object.assign(record, newRecord);

          return record.validate()
            .catch((error) => { throw new ErrorHTTP422(error.message); })
            .then(() => record.save());
        }
        return null;
      })
      .then(() => {
        if (schema.isCompositePrimary) {
          newRecord.forestCompositePrimary = compositeKeysManager.createCompositePrimary();
        }

        return new ResourceGetter(model, {
          recordId: params.recordId,
        }).perform();
      });
  };
}

module.exports = ResourceUpdater;
