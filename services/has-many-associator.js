'use strict';
var _ = require('lodash');

function HasManyAssociator(model, association, opts, params, data) {
  this.perform = function () {
    return model
      .findById(params.recordId)
      .then(function (record) {
        var associatedIds = _.map(data.data, (value) => value.id);
        return record['add' + _.capitalize(params.associationName)](
          associatedIds);
      });
  };
}

module.exports = HasManyAssociator;
