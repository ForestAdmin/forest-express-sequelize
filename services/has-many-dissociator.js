'use strict';
var _ = require('lodash');
var Operators = require('../utils/operators');
var ErrorHTTP422 = require('./errors').ErrorHTTP422;

function HasManyDissociator(model, association, options, params, data) {
  var OPERATORS = new Operators(options);
  var isDelete = Boolean(params.delete);

  this.perform = function () {
    var associatedIds = _.map(data.data, function (value) { return value.id; });
    return model
      .findById(params.recordId)
      .then(function (record) {
        var removeAssociation = false;

        if (isDelete) {
          _.each(model.associations, function(association, associationName) {
            if (associationName === params.associationName) {
              removeAssociation = (association.associationType === 'belongsToMany');
            }
          });
        } else {
          removeAssociation = true;
        }

        if (removeAssociation) {
          return record['remove' + _.upperFirst(params.associationName)](associatedIds);
        }
        return null;
      })
      .then(function () {
        if (isDelete) {
          var condition = { id: {} };
          condition.id[OPERATORS.IN] = associatedIds;

          return association.destroy({ where: condition });
        }
      })
      .catch(function (error) {
        throw new ErrorHTTP422(error.message);
      });
  };
}

module.exports = HasManyDissociator;
