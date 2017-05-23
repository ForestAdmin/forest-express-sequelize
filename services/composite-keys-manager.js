'use strict';
var _ = require('lodash');

function CompositeKeysManager(model, schema, record) {
  var GLUE = '-';

  this.getCondition = function (PrimaryCompositeKeys, params) {
    var where = {};

    _.keys(model.primaryKeys).forEach(function (primaryKey, index) {
      where[primaryKey] =
        (params ? params[primaryKey] : PrimaryCompositeKeys[index]);
    });
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
