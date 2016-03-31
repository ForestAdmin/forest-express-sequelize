'use strict';
var _ = require('lodash');

function ResourceFinder(model, params) {
  function getIncludes() {
    var includes = [];

    _.values(model.associations).forEach(function (association) {
      if (['hasOne', 'belongsTo'].indexOf(association.associationType) > -1) {
        includes.push(association.target);
      }
    });

    return includes;
  }

  this.perform = function () {
    return model
      .findById(params.recordId, {
        include: getIncludes()
      })
      .then(function (record) {
        // Ensure the Serializer set the relationship links on has many
        // relationships by setting them to an empty array.
        _.values(model.associations).forEach(function (association) {
          if (['HasMany', 'BelongsToMany'].indexOf(association.associationType) > -1) {
            record[association.associationAccessor] = [];
          }
        });

        return record.toJSON();
      });
  };
}

module.exports = ResourceFinder;
