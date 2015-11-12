'use strict';

function ResourceRemover(model, params) {
  this.perform = function () {
    return model
      .findById(params.recordId)
      .then(function (record) {
        return record.destroy();
      });
  };
}

module.exports = ResourceRemover;
