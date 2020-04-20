import _ from 'lodash';
import Operators from '../utils/operators';

const REGEX_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;

function CompositeKeysManager(model, schema, record) {
  const GLUE = '-';

  this.getPrimaryKeyValues = function getPrimaryKeyValues(recordId) {
    let primaryKeyValues = recordId.split(GLUE);

    // NOTICE: In the specific case of a composite primary key using UUID,
    //         this key would contains the GLUE character in its definition,
    //         Instead of just splitting, all the keys can be retrieved
    //         be directly searching UUID
    if (model && primaryKeyValues.length !== _.keys(model.primaryKeys).length) {
      primaryKeyValues = recordId.match(REGEX_UUID);
    }
    // NOTICE: Prevent liana to crash when a composite primary keys is null,
    //         this behaviour should be avoid instead of fixed.
    primaryKeyValues.forEach((key, index) => {
      if (key === 'null') { primaryKeyValues[index] = null; }
    });

    return primaryKeyValues;
  };

  this.getRecordsConditions = function getRecordsConditions(recordsIds, options) {
    const { OR } = new Operators(options);
    return { [OR]: recordsIds.map((recordId) => this.getRecordConditions(recordId)) };
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
