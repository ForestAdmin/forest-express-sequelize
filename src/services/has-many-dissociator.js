const _ = require('lodash');
const Operators = require('../utils/operators');
const orm = require('../utils/orm');
const { ErrorHTTP422 } = require('./errors');

function HasManyDissociator(model, association, options, params, data) {
  const OPERATORS = new Operators(options);
  const isDelete = Boolean(params.delete);

  this.perform = () => {
    const associatedIds = _.map(data.data, (value) => value.id);
    return orm.findRecord(model, params.recordId)
      .then((record) => {
        let removeAssociation = false;

        if (isDelete) {
          _.each(model.associations, (innerAssociation, associationName) => {
            if (associationName === params.associationName) {
              removeAssociation = (innerAssociation.associationType === 'belongsToMany');
            }
          });
        } else {
          removeAssociation = true;
        }

        if (removeAssociation) {
          return record[`remove${_.upperFirst(params.associationName)}`](associatedIds);
        }
        return null;
      })
      .then(() => {
        if (isDelete) {
          const primaryKeys = _.keys(association.primaryKeys);
          const [idField] = primaryKeys;
          const condition = {
            [idField]: {
              [OPERATORS.IN]: associatedIds,
            },
          };

          return association.destroy({ where: condition });
        }

        return null;
      })
      .catch((error) => {
        throw new ErrorHTTP422(error.message);
      });
  };
}

module.exports = HasManyDissociator;
