'use strict';
var _ = require('lodash');

function BelongsToUpdater(model, association, opts, params, data) {
  this.perform = function () {
    return model
      .findById(params.recordId)
      .then(function (record) {
        // WORKAROUND: Make the hasOne associations update work while waiting
        //             for the Sequelize 4 release with the fix of the following
        //             issue: https://github.com/sequelize/sequelize/issues/6069
        // TODO: Once Sequelize 4 is mainstream, use the following code instead:
        //       return record['set' + _.upperFirst(params.associationName)](
        //         data.data ? data.data.id : null);
        var isHasOne = false;
        var modelAssociation;

        _.each(model.associations, function (association) {
          if (association.associationAccessor === params.associationName) {
            isHasOne = association.associationType === 'HasOne';
            modelAssociation = association.target;
          }
        });

        var setterName = 'set' + _.upperFirst(params.associationName);

        // NOTICE: Enable model hooks to change fields values during an association update.
        var options = { fields: null };

        if (isHasOne && data.data) {
          return modelAssociation
            .findById(data.data.id)
            .then(function (recordAssociated) {
              record[setterName](recordAssociated, options);
            });
        } else {
          return record[setterName](data.data ? data.data.id : null, options);
        }
      });
  };
}

module.exports = BelongsToUpdater;
