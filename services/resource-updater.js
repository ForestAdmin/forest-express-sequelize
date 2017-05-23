'use strict';
var Interface = require('forest-express');
var ResourceGetter = require('./resource-getter');
var CompositeKeysManager = require('./composite-keys-manager');

function ResourceUpdater(model, params, record) {
  var schema = Interface.Schemas.schemas[model.name];

  this.perform = function () {
    var where = {};
    var compositeKeysManager = new CompositeKeysManager(model, schema, record);

    if (schema.isCompositePrimary) {
      where = compositeKeysManager.getRecordConditions(params.recordId);
    } else {
      where[schema.idField] = params.recordId;
    }

    return model
      .update(record, { where: where, individualHooks: true })
      .then(function () {
        if (schema.isCompositePrimary) {
          record.forestCompositePrimary =
            compositeKeysManager.createCompositePrimary();
        }

        return new ResourceGetter(model, {
          recordId: params.recordId
        }).perform();
      });
  };
}

module.exports = ResourceUpdater;
