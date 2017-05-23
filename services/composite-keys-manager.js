'use strict';
var _ = require('lodash');

function CompositeKeysManager(model, schema, record) {
  var GLUE = '-';

  this.splitCompositePrimary = function (recordId) {
    recordId = recordId.split(GLUE);
    var where = {};
    if (recordId.length === _.keys(model.primaryKeys).length) {
      _.keys(model.primaryKeys).forEach(function (key, index) {
        where[key] = recordId[index];
      });
    }
    return where;
  };

  this.createCompositePrimary = function () {
    var forestCompositePrimary = '';
    _.keys(model.primaryKeys).forEach(function (primaryKey, index) {
      if (index === 0) {
        forestCompositePrimary = record[primaryKey];
      } else {
        forestCompositePrimary = forestCompositePrimary +
          GLUE + record[primaryKey];
      }
    });
    return forestCompositePrimary;
  };
}

module.exports = CompositeKeysManager;
