'use strict';
var _ = require('lodash');
var P = require('bluebird');
var ResourceGetter = require('./resource-getter');
var Interface = require('forest-express');

function ResourceCreator(model, params) {
  var schema = Interface.Schemas.schemas[model.name];

  this.perform = function () {
    var promises = [];
    var resourceInstance = model.build(params);

    if (model.associations) {
      _.forOwn(model.associations, function(association, name) {
        if (['BelongsTo', 'HasOne', 'HasMany', 'BelongsToMany']
          .indexOf(association.associationType) > -1) {
          promises.push(resourceInstance['set' + _.capitalize(name)](params[name], { save: false }));
        }
      });
    }

    return P.all(promises).thenReturn(resourceInstance)
      .then(function (resourceInstance) {
        return resourceInstance.save();
      })
      .then(function (record) {
        return new ResourceGetter(model, {
          recordId: record[schema.idField]
        }).perform();
      });
  };
}

module.exports = ResourceCreator;
