'use strict';
var Interface = require('forest-express');
var CompositeKeysManager = require('./composite-keys-manager');

function ResourceRemover(model, params) {
  var schema = Interface.Schemas.schemas[model.name];

  this.perform = function () {
    var where = {};
    var compositeKeysManager = new CompositeKeysManager(model, schema, params);

    if (schema.isCompositePrimary) {
      where = compositeKeysManager.getRecordConditions(params.recordId);
    } else {
      where[schema.idField] = params.recordId;
    }
    return model
      .find({ where: where })
      .then(function (record) {
        return record.destroy();
      });
  };
}

module.exports = ResourceRemover;
