'use strict';
var _ = require('lodash');
var P = require('bluebird');
var ErrorHTTP422 = require('./errors').ErrorHTTP422;
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
          promises.push(recordCreated['set' + _.upperFirst(name)](params[name], { save: false }));
        }
      });
    }

    return P.all(promises)
      .then(function () {
        return recordCreated.validate()
          .catch(function (error) {
            throw new ErrorHTTP422(error.message);
          });
      })
      .then(function () { return recordCreated.save(); })
      .then(function (record) {
        var promisesAfterSave = [];

        // NOTICE: Many to many associations have to be set after the record creation in order to
        //         have an id.
        if (model.associations) {
          _.forOwn(model.associations, function (association, name) {
            if (association.associationType === 'HasOne') {
              promisesAfterSave.push(record['set' + _.upperFirst(name)](params[name]));
            } else if (['BelongsToMany', 'HasMany'].indexOf(association.associationType) > -1) {
              promisesAfterSave.push(record['add' + _.upperFirst(name)](params[name]));
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
