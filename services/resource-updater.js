'use strict';
var ResourceGetter = require('./resource-getter');

function ResourceUpdater(model, params) {

  this.perform = function () {
    return model
      .update(params, {
        where: { id: params.id }
      })
      .then(function () {
        return new ResourceGetter(model, { recordId: params.id }).perform();
      });
  };
}

module.exports = ResourceUpdater;
