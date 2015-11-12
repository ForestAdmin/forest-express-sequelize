'use strict';
var ResourceFinder = require('./resource-finder');

function ResourceUpdater(model, params) {

  this.perform = function () {
    return model
      .update(params, {
        where: { id: params.id }
      })
      .then(function () {
        return new ResourceFinder(model, { recordId: params.id }).perform();
      });
  };
}

module.exports = ResourceUpdater;
