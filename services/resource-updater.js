'use strict';
var Interface = require('forest-express');
var ResourceGetter = require('./resource-getter');
var CompositeKeysManager = require('./composite-keys-manager');
var ResourceFinder = require('./resource-finder');

function ResourceUpdater(model, params, newRecord) {
  var schema = Interface.Schemas.schemas[model.name];

  this.perform = function () {
    var compositeKeysManager = new CompositeKeysManager(model, schema, newRecord);

    return new ResourceFinder(model, params)
      .perform()
      .then(function (record) {
        if (record) {
          return record.update(newRecord);
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
