const _ = require('lodash');
const P = require('bluebird');
const Interface = require('forest-express');
const { ErrorHTTP422 } = require('./errors');
const ResourceGetter = require('./resource-getter');
const PrimaryKeysManager = require('./primary-keys-manager');
const associationRecord = require('../utils/association-record');
const isPrimaryKeyAForeignKey = require('../utils/is-primary-key-a-foreign-key');

class ResourceCreator {
  constructor(model, params, body, user) {
    this.model = model;
    this.params = params;
    this.body = body;
    this.schema = Interface.Schemas.schemas[model.name];
    this.user = user;
  }

  async _getTargetKey(name, association) {
    const primaryKey = this.body[name];

    let targetKey = primaryKey;
    if (typeof primaryKey !== 'undefined' && association.targetKey !== 'id') {
      const record = await associationRecord.get(association.target, primaryKey);
      targetKey = record[association.targetKey];
    }
    return targetKey;
  }

  async _makePromisesBeforeSave(record, [name, association]) {
    if (association.associationType === 'BelongsTo') {
      const setterName = `set${_.upperFirst(name)}`;
      const targetKey = await this._getTargetKey(name, association);
      const primaryKeyIsAForeignKey = isPrimaryKeyAForeignKey(association);
      if (primaryKeyIsAForeignKey) {
        record[association.source.primaryKeyAttribute] = this.body[name];
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
      return record[setterName](this.body[name]);
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
    const recordCreated = this.model.build(this.body);

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
    new PrimaryKeysManager(this.model).annotateRecords([record]);

    // return makeResourceGetter()
    return new ResourceGetter(
      this.model,
      { ...this.params, recordId: record[this.schema.idField] },
      this.user,
    ).perform();
  }
}

module.exports = ResourceCreator;
