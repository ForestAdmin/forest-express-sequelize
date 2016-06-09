'use strict';
var _ = require('lodash');
var P = require('bluebird');
var ResourceGetter = require('./resource-getter');

function ResourceUpdater(model, params) {

  this.perform = function () {
    return model
      .update(params, {
        where: { id: params.id },
        individualHooks: true
      })
      .then(function () {
        return model.findById(params.id);
      })
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

        return P.all(promises);
      })
      .then(function () {
        return new ResourceGetter(model, { recordId: params.id }).perform();
      });
  };
}

module.exports = ResourceUpdater;
