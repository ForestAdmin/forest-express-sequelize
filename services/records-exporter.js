'use strict';
// var _ = require('lodash');
var P = require('bluebird');
// var OperatorValueParser = require('./operator-value-parser');
// var Interface = require('forest-express');
// var CompositeKeysManager = require('./composite-keys-manager');
// var QueryBuilder = require('./query-builder');
// var SearchBuilder = require('./search-builder');

function RecordsExporter() {
  this.perform = function (dataSender) {
    dataSender('id, name, address\n');

    return new P(function (resolve) {
      setTimeout(function() {
        dataSender('1, sandy, 11 rue des vergers\n');
      }, 3000);
      setTimeout(function() {
        dataSender('3, toto, 13 rue des vergers\n');
        resolve();
      }, 6000);
    });
  };
}

module.exports = RecordsExporter;
