'use strict';
var ResourceFinder = require('./resource-finder');

function ResourceCreator(model, params) {

  this.perform = function () {
    return model.create(params)
      .then(function (record) {
        return new ResourceFinder(model, { recordId: record.id });
      });
  };
}

module.exports = ResourceCreator;
