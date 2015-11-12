'use strict';

function ResourceFinder(model, params) {
  this.perform = function () {
    return model
      .findById(params.recordId, {
        include: [{ all: true }]
      })
      .then(function (record) {
        return record.toJSON();
      });
  };
}

module.exports = ResourceFinder;
