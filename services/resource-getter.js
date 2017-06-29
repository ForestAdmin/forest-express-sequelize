'use strict';
var _ = require('lodash');
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

        // NOTICE: Do not use "toJSON" method to prevent issues on models that
        //         override this method.
        record = record.get({ plain: true });

        // Ensure the Serializer set the relationship links on has many
        // relationships by setting them to an empty array.
        _.values(model.associations).forEach(function (association) {
          if (['HasMany', 'BelongsToMany'].indexOf(association.associationType) > -1) {
            record[association.associationAccessor] = [];
          }
        });

        if (schema.isCompositePrimary) {
          record.forestCompositePrimary = new CompositeKeysManager(model,
            schema, record).createCompositePrimary();
        }

        return record;
      });
  };
}

module.exports = ResourceGetter;
