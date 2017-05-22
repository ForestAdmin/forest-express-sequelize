'use strict';
var _ = require('lodash');
var createError = require('http-errors');
var Interface = require('forest-express');
var PrimaryCompositeKeys = require('./primary-composite-key');

function ResourceGetter(model, params) {
  var schema = Interface.Schemas.schemas[model.name];

  function getIncludes() {
    var includes = [];

    _.values(model.associations).forEach(function (association) {
      if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
        includes.push({
          model: association.target.unscoped(),
          as: association.associationAccessor
        });
      }
    });

    return includes;
  }

  this.perform = function () {
    var where = {};
    if (schema.isCompositePrimary && params.recordId) {
      var recordId = params.recordId.split('-');
      if (recordId.length === _.keys(model.primaryKeys).length) {
        _.keys(model.primaryKeys).forEach(function (key, index) {
          where[key] = recordId[index];
        });
      } else { return; }
    } else {
      where.id = params.recordId;
    }

    return model
      .find({ where: where, include: getIncludes() })
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
          record.forestCompositePrimary =
            new PrimaryCompositeKeys(model, schema, record).get();
        }

        return record;
      });
  };
}

module.exports = ResourceGetter;
