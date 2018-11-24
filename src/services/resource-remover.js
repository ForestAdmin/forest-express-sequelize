'use strict';
var ResourceFinder = require('./resource-finder');

function ResourceRemover(model, params) {
  this.perform = function () {
    return new ResourceFinder(model, params)
      .perform()
      .then(function (record) {
        if (record) {
          return record.destroy();
        }
        return;
      });
  };
}

module.exports = ResourceRemover;
