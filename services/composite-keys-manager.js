'use strict';
var _ = require('lodash');

function CompositeKeysManager(model, schema, record) {
  var GLUE = '-';

  this.getRecordConditions = function (recordId) {
    var where = {};
    var primaryKeyValues = recordId.split(GLUE);

    if (primaryKeyValues.length === _.keys(model.primaryKeys).length) {
      _.keys(model.primaryKeys).forEach(function (primaryKey, index) {
        where[primaryKey] = primaryKeyValues[index];
      });
    }
    return where;
  };

  this.createCompositePrimary = function () {
    var compositePrimary = '';

    _.keys(model.primaryKeys).forEach(function (primaryKey, index) {
      if (index === 0) {
        compositePrimary = record[primaryKey];
      } else {
        compositePrimary = compositePrimary + GLUE + record[primaryKey];
      }
    });
    return compositePrimary;
  };
}

module.exports = CompositeKeysManager;
