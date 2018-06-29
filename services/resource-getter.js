'use strict';
var createError = require('http-errors');
var Interface = require('forest-express');
var CompositeKeysManager = require('./composite-keys-manager');
var ResourceFinder = require('./resource-finder');

function ResourceGetter(model, params) {
  var schema = Interface.Schemas.schemas[model.name];

  this.perform = function () {
    return new ResourceFinder(model, params, true)
      .perform()
      .then(function (record) {
        if (!record) {
          throw createError(404, 'The ' + model.name + ' #' + params.recordId +
            ' does not exist.');
        }

        if (schema.isCompositePrimary) {
          record.forestCompositePrimary = new CompositeKeysManager(model,
            schema, record).createCompositePrimary();
        }

        return record;
      });
  };
}

module.exports = ResourceGetter;
