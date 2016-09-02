'use strict';
var _ = require('lodash');
var P = require('bluebird');
var ResourceGetter = require('./resource-getter');
var Interface = require('forest-express');

function ResourceCreator(model, params) {
  var schema = Interface.Schemas.schemas[model.name];

  this.perform = function () {
    return model.create(params)
      .then(function(record) {
        var promises = [];

        if (model.associations) {
          _.forOwn(model.associations, function(association, name) {
            if (['HasOne', 'HasMany', 'BelongsToMany']
              .indexOf(association.associationType) > -1) {
              promises.push(record['set' + _.capitalize(name)](params[name]));
            }
          });
        }

        return P.all(promises).thenReturn(record);
      })
      .then(function (record) {
        return new ResourceGetter(model, {
          recordId: record[schema.idField]
        }).perform();
      });
  };
}

module.exports = ResourceCreator;
