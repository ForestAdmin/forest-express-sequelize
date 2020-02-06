const _ = require('lodash');

function CompositeKeysManager(model, schema, record) {
  const GLUE = '-';

  this.getPrimaryKeyValues = function getPrimaryKeyValues(recordId) {
    const primaryKeyValues = recordId.split(GLUE);

    // NOTICE: Prevent liana to crash when a composite primary keys is null,
    //         this behaviour should be avoid instead of fixed.
    primaryKeyValues.forEach((key, index) => {
      if (key === 'null') { primaryKeyValues[index] = null; }
    });

    return primaryKeyValues;
  };

  this.getRecordsConditions = function getRecordsConditions(recordsIds) {
    return recordsIds.reduce((where, recordId) => {
      Object.entries(this.getRecordConditions(recordId)).forEach(([key, value]) => {
        where[key] = [...(where[key] || []), value];
      });
      return where;
    }, {});
  };

  this.getRecordConditions = function getRecordConditions(recordId) {
    const where = {};
    const primaryKeyValues = this.getPrimaryKeyValues(recordId);

    if (primaryKeyValues.length === _.keys(model.primaryKeys).length) {
      _.keys(model.primaryKeys).forEach((primaryKey, index) => {
        where[primaryKey] = primaryKeyValues[index];
      });
    }
    return where;
  };

  this.createCompositePrimary = function createCompositePrimary() {
    let compositePrimary = '';

    _.keys(model.primaryKeys).forEach((primaryKey, index) => {
      // NOTICE: Prevent liana to crash when a composite primary keys is null,
      //         this behaviour should be avoid instead of fixed.
      if (record[primaryKey] === null) {
        record[primaryKey] = 'null';
      }
      if (index === 0) {
        compositePrimary = record[primaryKey];
      } else {
        compositePrimary = compositePrimary + GLUE + record[primaryKey];
      }
    });
    return compositePrimary;
  };
}

module.exports = CompositeKeysManager;
