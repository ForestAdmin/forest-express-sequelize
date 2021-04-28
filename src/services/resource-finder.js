const _ = require('lodash');
const CompositeKeysManager = require('./composite-keys-manager');

function ResourceFinder(model, params, withIncludes) {
  function getIncludes() {
    const includes = [];

    _.values(model.associations).forEach((association) => {
      if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
        includes.push({
          model: association.target.unscoped(),
          as: association.associationAccessor,
        });
      }
    });

    // NOTICE: Avoid to inject an empty "include" array inside conditions
    //         otherwise Sequelize 4.8.x won't set the WHERE clause in the SQL
    //         query.
    return includes.length === 0 ? null : includes;
  }

  this.perform = () => {
    const conditions = { where: {} };

    if (withIncludes) {
      conditions.include = getIncludes();
    }

    conditions.where = new CompositeKeysManager(model).getRecordsConditions([params.recordId]);

    return model.findOne(conditions);
  };
}

module.exports = ResourceFinder;
