const _ = require('lodash');
const orm = require('../utils/orm');
const associationRecord = require('../utils/association-record');

// WORKAROUND: Make the hasOne associations update work while waiting
//             for the Sequelize 4 release with the fix of the following
//             issue: https://github.com/sequelize/sequelize/issues/6069
const getTargetKey = async (pk, association) => {
  let targetKey = pk;

  if (association.associationType === 'HasOne' || association.targetKey !== 'id') {
    const record = await associationRecord.get(association.target, pk);
    if (association.associationType === 'HasOne') {
      targetKey = record;
    } else if (association.targetKey !== 'id') { // should we add _id, uuid?
      // NOTICE: special use case with foreign key non pointing to a primary key
      targetKey = record[association.targetKey];
    }
  }

  return targetKey;
};

class BelongsToUpdater {
  constructor(model, assoc, opts, params, data) {
    this.model = model;
    this.assoc = assoc;
    this.opts = opts;
    this.params = params;
    this.data = data;
  }

  async perform() {
    const { associationName, recordId } = this.params;
    const record = await orm.findRecord(this.model, recordId);
    const association = Object.values(this.model.associations)
      .find((a) => a.associationAccessor === associationName);

    if (association && this.data.data) {
      const pk = this.data.data.id;
      const targetKey = await getTargetKey(pk, association);

      // NOTICE: Enable model hooks to change fields values during an association update.
      const options = { fields: null };
      const setterName = `set${_.upperFirst(associationName)}`;
      return record[setterName](targetKey, options);
    }

    return null;
  }
}

module.exports = BelongsToUpdater;
