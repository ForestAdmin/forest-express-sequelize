'use strict';
var _ = require('lodash');

function HasManyAssociator(model, association, opts, params, data) {
  this.perform = function () {
    return model
      .findById(params.recordId)
      .then(function (record) {
        var associatedIds = _.map(data.data, function (value) {
          return value.id;
        });
        return record['add' + _.upperFirst(params.associationName)](
          associatedIds);
      });
  };
}

module.exports = HasManyAssociator;
