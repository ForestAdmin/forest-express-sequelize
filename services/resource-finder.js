'use strict';
var _ = require('lodash');
var Interface = require('forest-express');
var CompositeKeysManager = require('./composite-keys-manager');

function ResourceFinder(model, params, include) {
  var schema = Interface.Schemas.schemas[model.name];
  var compositeKeysManager = new CompositeKeysManager(model, schema, params);

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
    var find = {};

    if (include) { find.include = getIncludes(); }
    if (schema.isCompositePrimary) {
      find.where = compositeKeysManager.getRecordConditions(params.recordId);
    } else {
      find.where[schema.idField] = params.recordId;
    }

    return model.find(find);
  };
}

module.exports = ResourceFinder;
