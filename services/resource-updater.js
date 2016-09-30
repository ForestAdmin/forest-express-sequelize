'use strict';
var _ = require('lodash');
var P = require('bluebird');
var ResourceGetter = require('./resource-getter');
var Interface = require('forest-express');

function ResourceUpdater(model, params) {
  var schema = Interface.Schemas.schemas[model.name];

  this.perform = function () {
    var where = {};
    where[schema.idField] = params[schema.idField];

    return model
      .update(params, { where: where, individualHooks: true })
      .then(function () {
        return new ResourceGetter(model, {
          recordId: params[schema.idField]
        }).perform();
      });
  };
}

module.exports = ResourceUpdater;
