'use strict';
var _ = require('lodash');

function CompositeKeysManager(model, schema, record) {
  var GLUE = '-';

  this.get = function () {
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
