const createError = require('http-errors');
const PrimaryKeysManager = require('./primary-keys-manager');
const ResourceFinder = require('./resource-finder');

function ResourceGetter(model, params) {
  this.perform = function perform() {
    return new ResourceFinder(model, params, true)
      .perform()
      .then((record) => {
        if (!record) {
          throw createError(404, `The ${model.name} #${params.recordId
          } does not exist.`);
        }

        new PrimaryKeysManager(model).annotateRecords([record]);

        return record;
      });
  };
}

module.exports = ResourceGetter;
