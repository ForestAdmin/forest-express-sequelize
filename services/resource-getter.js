'use strict';
var _ = require('lodash');

function ResourceGetter(model, params) {
  function getIncludes() {
    var includes = [];

    _.values(model.associations).forEach(function (association) {
      if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
        includes.push({
          model: association.target,
          as: association.associationAccessor
        });
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
        record = record.toJSON();

        // Ensure the Serializer set the relationship links on has many
        // relationships by setting them to an empty array.
        _.values(model.associations).forEach(function (association) {
          if (['HasMany', 'BelongsToMany'].indexOf(association.associationType) > -1) {
            record[association.associationAccessor] = [];
          }
        });

        return record;
      });
  };
}

module.exports = ResourceGetter;
