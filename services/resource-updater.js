'use strict';
var _ = require('lodash');
var ErrorHTTP422 = require('./errors').ErrorHTTP422;
var Interface = require('forest-express');
var ResourceGetter = require('./resource-getter');
var CompositeKeysManager = require('./composite-keys-manager');
var ResourceFinder = require('./resource-finder');

function ResourceUpdater(model, params, newRecord) {
  var schema = Interface.Schemas.schemas[model.name];

  this.perform = function () {
    var compositeKeysManager =
      new CompositeKeysManager(model, schema, newRecord);

    return new ResourceFinder(model, params)
      .perform()
      .then(function (record) {
        if (record) {
          _.each(newRecord, function (value, attribute) {
            record[attribute] = value;
          });

          return record.validate()
            .catch(function (error) { throw new ErrorHTTP422(error.message); })
            .then(function () { return record.save(); });
        }
      })
      .then(function () {
        if (schema.isCompositePrimary) {
          newRecord.forestCompositePrimary =
            compositeKeysManager.createCompositePrimary();
        }

        return new ResourceGetter(model, {
          recordId: params.recordId
        }).perform();
      });
  };
}

module.exports = ResourceUpdater;
