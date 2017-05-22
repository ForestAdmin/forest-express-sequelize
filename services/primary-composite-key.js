'use strict';
var _ = require('lodash');

function PrimaryCompositeKeys(model, schema, record) {
  var glue = '-';

  this.get = function () {
    var forestCompositePrimary = '';
    _.keys(model.primaryKeys).forEach(function (key, index) {
      if (index === 0) {
        forestCompositePrimary = record[key];
      } else {
        forestCompositePrimary = forestCompositePrimary + glue + record[key];
      }
    });
    return forestCompositePrimary;
  };
}

module.exports = PrimaryCompositeKeys;
