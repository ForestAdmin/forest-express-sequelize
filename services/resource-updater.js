'use strict';
var ResourceGetter = require('./resource-getter');
var Interface = require('forest-express');
var _ = require('lodash');

function ResourceUpdater(model, params) {
  var schema = Interface.Schemas.schemas[model.name];

  this.perform = function () {
    var where = {};

    if (schema.isCompositePrimary) {
      _.keys(model.primaryKeys).forEach(function (key) {
        where[key] = params[key];
      });
    } else {
      where[schema.idField] = params[schema.idField];
    }

    return model
      .update(params, { where: where, individualHooks: true })
      .then(function () {
        if (schema.isCompositePrimary) {
          params.forestCompositePrimary = '';
          _.keys(model.primaryKeys).forEach(function (key, index) {
            var glue = '';
            if (index > 0) { glue = '-'; }
            params.forestCompositePrimary = params.forestCompositePrimary +
              glue +
              params[key];
          });
        }
        return new ResourceGetter(model, {
          recordId: params[schema.idField]
        }).perform();
      });
  };
}

module.exports = ResourceUpdater;
