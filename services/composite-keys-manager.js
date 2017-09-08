'use strict';
var _ = require('lodash');

function CompositeKeysManager(model, schema, record) {
  var GLUE = '-';

  this.getRecordConditions = function (recordId) {
    var where = {};
    var primaryKeyValues = recordId.split(GLUE);

    // NOTICE: Prevent liana to crash when a composite primary keys is null,
    //         this behaviour should be avoid instead of fixed. 
    primaryKeyValues.forEach(function (key, index) {
      if (key === 'null') { primaryKeyValues[index] = null; }
    });

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
      // NOTICE: Prevent liana to crash when a composite primary keys is null,
      //         this behaviour should be avoid instead of fixed.
      if (record[primaryKey] === null) {
        record[primaryKey] = 'null';
      }
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
