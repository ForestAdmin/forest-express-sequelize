'use strict';
var _ = require('lodash');
var Operators = require('../utils/operators');
var ErrorHTTP422 = require('./errors').ErrorHTTP422;

function HasManyDissociator(model, association, options, params, data) {
  var isDelete = Boolean(params.delete);
  var OPERATORS = new Operators(options);
  this.perform = function () {
    var associatedIds = _.map(data.data, function (value) {
      return value.id;
    });
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
          return record['remove' + _.capitalize(params.associationName)](
            associatedIds);
        } else {
          return null;
        }
      })
      .then(function () {
        if (isDelete) {
          return association.destroy({
            where: {id: { [OPERATORS.IN]: associatedIds }}
          });
        }
      })
      .catch(function (error) {
        throw new ErrorHTTP422(error.message);
      });
  };
}

module.exports = HasManyDissociator;
