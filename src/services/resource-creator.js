const _ = require('lodash');
const P = require('bluebird');
const Interface = require('forest-express');
const { ErrorHTTP422 } = require('./errors');
const ResourceGetter = require('./resource-getter');
const CompositeKeysManager = require('./composite-keys-manager');
const associationRecord = require('../utils/association-record');
const { primaryKeyIsForeignKey } = require('../utils/primaryKey-is-ForeignKey');

class ResourceCreator {
  constructor(model, params) {
    this.model = model;
    this.params = params;
    this.schema = Interface.Schemas.schemas[model.name];
  }

  async _getTargetKey(name, association) {
    const pk = this.params[name];

    let targetKey = pk;
    if (typeof pk !== 'undefined' && association.targetKey !== 'id') {
      const record = await associationRecord.get(association.target, pk);
      targetKey = record[association.targetKey];
    }
    return targetKey;
  }

  async _makePromisesBeforeSave(record, [name, association]) {
    if (association.associationType === 'BelongsTo') {
      const setterName = `set${_.upperFirst(name)}`;
      const targetKey = await this._getTargetKey(name, association);
      const pkIsFk = primaryKeyIsForeignKey(association);
      if (pkIsFk) {
        record[association.source.primaryKeyAttribute] = this.params[name];
      }
      return record[setterName](targetKey, { save: false });
    }
    return null;
  }

  _makePromisesAfterSave(record, [name, association]) {
    let setterName;
    if (association.associationType === 'HasOne') {
      setterName = `set${_.upperFirst(name)}`;
    } else if (['BelongsToMany', 'HasMany'].includes(association.associationType)) {
      setterName = `add${_.upperFirst(name)}`;
    }
    if (setterName) {
      return record[setterName](this.params[name]);
    }
    return null;
  }

  async _handleSave(record, callback) {
    const { associations } = this.model;
    if (associations) {
      await P.all(Object.entries(associations)
        .map((entry) => callback.bind(this)(record, entry)));
    }
  }

  async perform() {
    // buildInstance
    const recordCreated = this.model.build(this.params);

    // handleAssociationsBeforeSave
    await this._handleSave(recordCreated, this._makePromisesBeforeSave);

    // saveInstance (validate then save)
    try {
      await recordCreated.validate();
    } catch (error) {
      throw new ErrorHTTP422(error.message);
    }
    const record = await recordCreated.save();

    // handleAssociationsAfterSave
    // NOTICE: Many to many associations have to be set after the record creation in order to
    //         have an id.
    await this._handleSave(record, this._makePromisesAfterSave);

    // appendCompositePrimary
    if (this.schema.isCompositePrimary) {
      record.forestCompositePrimary = new CompositeKeysManager(this.model, this.schema, record)
        .createCompositePrimary();
    }

    // return makeResourceGetter()
    return new ResourceGetter(this.model, {
      recordId: record[this.schema.idField],
    }).perform();
  }
}

module.exports = ResourceCreator;
