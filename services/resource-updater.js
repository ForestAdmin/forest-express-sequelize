'use strict';
var Interface = require('forest-express');
var ResourceGetter = require('./resource-getter');
var CompositeKeysManager = require('./composite-keys-manager');

function ResourceUpdater(model, params) {
  var schema = Interface.Schemas.schemas[model.name];

  this.perform = function () {
    var KeysManager = new CompositeKeysManager(model, schema, params);
    var where = {};

    if (schema.isCompositePrimary) {
      where = KeysManager.getCondition(null, params);
    } else {
      where[schema.idField] = params[schema.idField];
    }

    return model
      .update(params, { where: where, individualHooks: true })
      .then(function () {
        if (schema.isCompositePrimary) {
          params.forestCompositePrimary = KeysManager.createCompositePrimary();
        }
        return new ResourceGetter(model, {
          recordId: params[schema.idField]
        }).perform();
      });
  };
}

module.exports = ResourceUpdater;
