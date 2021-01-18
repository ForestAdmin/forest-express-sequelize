const _ = require('lodash');
const P = require('bluebird');
const Interface = require('forest-express');
const { ErrorHTTP422 } = require('./errors');
const ResourceGetter = require('./resource-getter');
const CompositeKeysManager = require('./composite-keys-manager');

const getSetter = (associationType, name) => {
  let setter;
  if (associationType === 'HasOne') {
    setter = `set${_.upperFirst(name)}`;
  } else if (['BelongsToMany', 'HasMany'].includes(associationType)) {
    setter = `add${_.upperFirst(name)}`;
  }
  return setter;
};

const getPromisesBeforeSave = (record, name) => (promises, [associationName, association]) => {
  if (association.associationType === 'BelongsTo') {
    promises.push(record[`set${_.upperFirst(associationName)}`](name, { save: false }));
  }
  return promises;
};

const getPromisesAfterSave = (record, name) => (promises, [associationName, association]) => {
  const setter = getSetter(association.associationType, associationName);
  if (setter) {
    promises.push(record[setter](name));
  }
  return promises;
};

class ResourceCreator {
  constructor(model, params) {
    this.model = model;
    this.params = params;
    this.schema = Interface.Schemas.schemas[model.name];
  }

  async getPromises(record, callback) {
    const { associations } = this.model;

    if (associations) {
      const { name } = this.params;
      return Object.entries(associations).reduce(callback(record, name), []);
    }

    return [];
  }

  async perform() {
    const recordCreated = this.model.build(this.params);

    const promisesBeforeSave = await this.getPromises(recordCreated, getPromisesBeforeSave);
    await P.all(promisesBeforeSave);

    try {
      await recordCreated.validate();
    } catch (error) {
      throw new ErrorHTTP422(error.message);
    }
    const record = await recordCreated.save();

    // NOTICE: Many to many associations have to be set after the record creation in order to
    //         have an id.
    const promisesAfterSave = await this.getPromises(record, getPromisesAfterSave);
    await P.all(promisesAfterSave);

    if (this.schema.isCompositePrimary) {
      record.forestCompositePrimary = new CompositeKeysManager(this.model, this.schema, record)
        .createCompositePrimary();
    }
    return new ResourceGetter(this.model, {
      recordId: record[this.schema.idField],
    }).perform();
  }
}

module.exports = ResourceCreator;
