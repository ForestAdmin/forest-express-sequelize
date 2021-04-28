import _ from 'lodash';
import Operators from '../utils/operators';

/**
 * This helper class allows abstracting away the complexity
 * of using collection which have composite primary keys.
 */
class CompositeKeysManager {
  static _GLUE = '|'

  constructor(model) {
    this._primaryKeys = _.keys(model.primaryKeys);
    this._Sequelize = model.sequelize.constructor;
  }

  /** Build sequelize where condition from a list of packed recordIds */
  getRecordsConditions(recordIds) {
    if (recordIds.length <= 0) {
      return this._Sequelize.literal('(0=1)');
    }

    switch (this._primaryKeys.length) {
      case 0:
        throw new Error('No primary key was found');

      case 1:
        return this._getRecordsConditionsSimple(recordIds);

      default:
        return this._getRecordsConditionComposite(recordIds);
    }
  }

  /* Annotate records with their packed primary key */
  annotateRecords(records) {
    if (this._primaryKeys.length > 1) {
      records.forEach((record) => {
        record.forestCompositePrimary = this._createCompositePrimary(record);
      });
    }
  }

  _getRecordsConditionsSimple(recordIds) {
    return { [this._primaryKeys[0]]: recordIds.length === 1 ? recordIds[0] : recordIds };
  }

  _getRecordsConditionComposite(recordIds) {
    const Ops = Operators.getInstance({ Sequelize: this._Sequelize });

    return recordIds.length === 1
      ? this._getRecordConditions(recordIds[0])
      : { [Ops.OR]: recordIds.map((id) => this._getRecordConditions(id)) };
  }

  /** Build sequelize where condition from a single packed recordId */
  _getRecordConditions(recordId) {
    return _.zipObject(this._primaryKeys, this._getPrimaryKeyValues(recordId));
  }

  /** Create packed recordId from record */
  _createCompositePrimary(record) {
    return this._primaryKeys.map(
      (field) => (record[field] === null ? 'null' : record[field]),
    ).join(CompositeKeysManager._GLUE);
  }

  /** Unpack recordId into an array */
  _getPrimaryKeyValues(recordId) {
    // Prevent liana to crash when a composite primary keys is null,
    // this behaviour should be avoid instead of fixed.
    const unpacked = recordId
      .split(CompositeKeysManager._GLUE)
      .map((key) => (key === 'null' ? null : key));

    if (unpacked.length !== this._primaryKeys.length) {
      throw new Error('Invalid packed primary key');
    }

    return unpacked;
  }
}

module.exports = CompositeKeysManager;
