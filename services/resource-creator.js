'use strict';
var _ = require('lodash');
var P = require('bluebird');
var ResourceGetter = require('./resource-getter');

function ResourceCreator(model, params) {

  this.perform = function () {
    return model.create(params)
      .then(function(record) {
        var promises = [];

        if (model.associations) {
          _.forOwn(model.associations, function(association, name) {
            if (['HasOne', 'HasMany', 'BelongsToMany']
              .indexOf(association.associationType) > -1) {
              promises.push(record[`set${_.capitalize(name)}`](params[name]));
            }
          });
        }

        return P.all(promises).thenReturn(record);
      })
      .then(function (record) {
        return new ResourceGetter(model, { recordId: record.id }).perform();
      });
  };
}

module.exports = ResourceCreator;
