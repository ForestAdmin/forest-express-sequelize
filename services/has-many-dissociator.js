'use strict';
var _ = require('lodash');
var ErrorHTTP422 = require('./errors').ErrorHTTP422;

function HasManyAssociator(model, association, opts, params, data) {
  this.perform = function () {
    return model
      .findById(params.recordId)
      .then(function (record) {
        var associatedIds = _.map(data.data, function (value) {
          return value.id;
        });
        return record['remove' + _.capitalize(params.associationName)](
          associatedIds);
      })
      .catch(function (error) {
        throw new ErrorHTTP422(error.message);
      });
  };
}

module.exports = HasManyAssociator;
