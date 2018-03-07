'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Interface = require('forest-express');
var ResourceGetter = require('./resource-getter');
var CompositeKeysManager = require('./composite-keys-manager');

function ResourceCreator(model, params) {
  var schema = Interface.Schemas.schemas[model.name];

  this.perform = function () {
    var promises = [];
    var recordCreated = model.build(params);

    if (model.associations) {
      _.forOwn(model.associations, function (association, name) {
        if (association.associationType === 'BelongsTo') {
          promises.push(recordCreated['set' + _.capitalize(name)](params[name], { save: false }));
        }
      });
    }

    return P.all(promises)
      .then(function () { return recordCreated.save(); })
      .then(function (record) {
        var promisesAfterSave = [];

        // NOTICE: Many to many associations have to be set after the record creation in order to
        //         have an id.
        if (model.associations) {
          _.forOwn(model.associations, function (association, name) {
            if (params[name]) {
              if (association.associationType === 'HasOne') {
                promisesAfterSave.push(record['set' + _.capitalize(name)](params[name]));
              }
              if (/Many$/.test(association.associationType) && params[name].length) {
                promisesAfterSave.push(record['add' + _.capitalize(name)](params[name]));
              }
            }
          });
        }

        return P.all(promisesAfterSave)
          .thenReturn(record);
      })
      .then(function (record) {
        if (schema.isCompositePrimary) {
          record.forestCompositePrimary =
            new CompositeKeysManager(model, schema, record)
              .createCompositePrimary();
        }
        return new ResourceGetter(model, {
          recordId: record[schema.idField]
        }).perform();
      });
  };
}

module.exports = ResourceCreator;
