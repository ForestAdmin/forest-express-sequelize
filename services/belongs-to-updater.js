'use strict';
var _ = require('lodash');

function BelongsToUpdater(model, association, opts, params, data) {
  this.perform = function () {
    return model
      .findById(params.recordId)
      .then(function (record) {
        return record['set' + _.capitalize(params.associationName)](
          data.data ? data.data.id : null);
      });
  };
}

module.exports = BelongsToUpdater;
