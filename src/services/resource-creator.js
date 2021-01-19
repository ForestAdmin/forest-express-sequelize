const _ = require('lodash');
const P = require('bluebird');
const Interface = require('forest-express');
const { ErrorHTTP422 } = require('./errors');
const ResourceGetter = require('./resource-getter');
const CompositeKeysManager = require('./composite-keys-manager');

class ResourceCreator {
  constructor(model, params) {
    this.model = model;
    this.params = params;
    this.schema = Interface.Schemas.schemas[model.name];
  }

  _makePromisesBeforeSave(record) {
    return (promises, [name, association]) => {
      if (association.associationType === 'BelongsTo') {
        const setterName = `set${_.upperFirst(name)}`;
        const promise = record[setterName](this.params[name], { save: false });
        promises.push(promise);
      }
      return promises;
    };
  }

  _makePromisesAfterSave(record) {
    return (promises, [name, association]) => {
      let setterName;
      if (association.associationType === 'HasOne') {
        setterName = `set${_.upperFirst(name)}`;
      } else if (['BelongsToMany', 'HasMany'].includes(association.associationType)) {
        setterName = `add${_.upperFirst(name)}`;
      }
      if (setterName) {
        const promise = record[setterName](this.params[name]);
        promises.push(promise);
      }
      return promises;
    };
  }

  async _handleSave(record, callback) {
    const { associations } = this.model;
    if (associations) {
      callback = callback.bind(this);
      const promisesBeforeSave = Object.entries(associations).reduce(callback(record), []);
      await P.all(promisesBeforeSave);
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
