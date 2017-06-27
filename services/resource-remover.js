'use strict';
var ResourceFinder = require('./resource-finder');

function ResourceRemover(model, params) {
  this.perform = function () {
    return new ResourceFinder(model, params)
      .perform()
      .then(function (record) {
        return record.destroy();
      });
  };
}

module.exports = ResourceRemover;
