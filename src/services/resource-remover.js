const ResourceFinder = require('./resource-finder');

function ResourceRemover(model, params) {
  this.perform = () => new ResourceFinder(model, params)
    .perform()
    .then((record) => {
      if (record) {
        return record.destroy();
      }
      return null;
    });
}

module.exports = ResourceRemover;
