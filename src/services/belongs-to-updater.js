const _ = require('lodash');
const orm = require('../utils/orm');

function BelongsToUpdater(model, assoc, opts, params, data) {
  this.perform = function perform() {
    return orm.findRecord(model, params.recordId)
      .then((record) => {
        // WORKAROUND: Make the hasOne associations update work while waiting
        //             for the Sequelize 4 release with the fix of the following
        //             issue: https://github.com/sequelize/sequelize/issues/6069
        // TODO: Once Sequelize 4 is mainstream, use the following code instead:
        //       return record['set' + _.upperFirst(params.associationName)](
        //         data.data ? data.data.id : null);
        let isHasOne = false;
        let modelAssociation;

        _.each(model.associations, (association) => {
          if (association.associationAccessor === params.associationName) {
            isHasOne = association.associationType === 'HasOne';
            modelAssociation = association.target;
          }
        });

        const setterName = `set${_.upperFirst(params.associationName)}`;

        // NOTICE: Enable model hooks to change fields values during an association update.
        const options = { fields: null };

        if (isHasOne && data.data) {
          return orm.findRecord(modelAssociation, data.data.id)
            .then((recordAssociated) => {
              record[setterName](recordAssociated, options);
            });
        }
        return record[setterName](data.data ? data.data.id : null, options);
      });
  };
}

module.exports = BelongsToUpdater;
