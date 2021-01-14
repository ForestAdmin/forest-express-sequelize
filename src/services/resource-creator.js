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

class ResourceCreator {
  constructor(model, params) {
    this.model = model;
    this.params = params;
    this.schema = Interface.Schemas.schemas[model.name];
  }

  async getPromisesBeforeSave(recordCreated) {
    const { associations } = this.model;
    const promises = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const [name, association] of Object.entries(associations)) {
      if (association.associationType === 'BelongsTo') {
        promises.push(recordCreated[`set${_.upperFirst(name)}`](this.params[name],
          { save: false }));
      }
    }

    return promises;
  }

  async getPromisesAfterSave(record) {
    const { associations } = this.model;
    const promises = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const [name, association] of Object.entries(associations)) {
      const setter = getSetter(association.associationType, name);
      if (setter) {
        promises.push(record[setter](this.params[name]));
      }
    }

    return promises;
  }

  async getPromises(record, type) {
    const { associations } = this.model;
    let promises = [];

    if (associations) {
      if (type === 'before') {
        promises = await this.getPromisesBeforeSave(record);
      } else if (type === 'after') {
        promises = await this.getPromisesAfterSave(record);
      }
    }

    return promises;
  }

  async perform() {
    const recordCreated = this.model.build(this.params);

    const promisesBeforeSave = await this.getPromises(recordCreated, 'before');
    await P.all(promisesBeforeSave);

    try {
      await recordCreated.validate();
    } catch (error) {
      throw new ErrorHTTP422(error.message);
    }
    const record = await recordCreated.save();

    // NOTICE: Many to many associations have to be set after the record creation in order to
    //         have an id.
    const promisesAfterSave = await this.getPromises(record, 'after');
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
