const _ = require('lodash');
const orm = require('../utils/orm');

function HasManyAssociator(model, association, opts, params, data) {
  this.perform = function perform() {
    return orm.findRecord(model, params.recordId)
      .then((record) => {
        const associatedIds = _.map(data.data, value => value.id);

        // NOTICE: Deactivate validation to prevent potential issues with custom model validations.
        //         In this case, the full record attributes are missing which may raise an
        //         unexpected validation error.
        return record[`add${_.upperFirst(params.associationName)}`](associatedIds, { validate: false });
      });
  };
}

module.exports = HasManyAssociator;
