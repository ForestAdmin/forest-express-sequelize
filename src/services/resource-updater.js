const { ErrorHTTP422 } = require('./errors');
const ResourceGetter = require('./resource-getter');
const CompositeKeysManager = require('./composite-keys-manager');
const ResourceFinder = require('./resource-finder');

function ResourceUpdater(model, params, newRecord) {
  this.perform = () => new ResourceFinder(model, params)
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
      new CompositeKeysManager(model).annotateRecords([newRecord]);

      return new ResourceGetter(model, {
        recordId: params.recordId,
      }).perform();
    });
}

module.exports = ResourceUpdater;
