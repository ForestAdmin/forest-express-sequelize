const _ = require('lodash');
const P = require('bluebird');
const Interface = require('forest-express');
const { ErrorHTTP422 } = require('./errors');
const ResourceGetter = require('./resource-getter');
const CompositeKeysManager = require('./composite-keys-manager');

function ResourceCreator(model, params) {
  const schema = Interface.Schemas.schemas[model.name];

  this.perform = function perform() {
    const promises = [];
    const recordCreated = model.build(params);

    if (model.associations) {
      _.forOwn(model.associations, (association, name) => {
        if (association.associationType === 'BelongsTo') {
          promises.push(recordCreated[`set${_.upperFirst(name)}`](params[name], { save: false }));
        }
      });
    }

    return P.all(promises)
      .then(() => recordCreated.validate()
        .catch((error) => {
          throw new ErrorHTTP422(error.message);
        }))
      .then(() => recordCreated.save())
      .then((record) => {
        const promisesAfterSave = [];

        // NOTICE: Many to many associations have to be set after the record creation in order to
        //         have an id.
        if (model.associations) {
          _.forOwn(model.associations, (association, name) => {
            if (association.associationType === 'HasOne') {
              promisesAfterSave.push(record[`set${_.upperFirst(name)}`](params[name]));
            } else if (['BelongsToMany', 'HasMany'].indexOf(association.associationType) > -1) {
              promisesAfterSave.push(record[`add${_.upperFirst(name)}`](params[name]));
            }
          });
        }

        return P.all(promisesAfterSave)
          .thenReturn(record);
      })
      .then((record) => {
        if (schema.isCompositePrimary) {
          record.forestCompositePrimary = new CompositeKeysManager(model, schema, record)
            .createCompositePrimary();
        }
        return new ResourceGetter(model, {
          recordId: record[schema.idField],
        }).perform();
      });
  };
}

module.exports = ResourceCreator;
