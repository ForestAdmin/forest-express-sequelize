const _ = require('lodash');
const P = require('bluebird');
const Interface = require('forest-express');
const ApimapFieldBuilder = require('../services/apimap-field-builder');
const ApimapFieldTypeDetector = require('../services/apimap-field-type-detector');
const isPrimaryKeyAForeignKey = require('../utils/is-primary-key-a-foreign-key');

module.exports = (model, opts) => {
  const fields = [];
  const fieldNamesToExclude = [];

  function getTypeForAssociation(association) {
    const attribute = association.target.rawAttributes[association.targetKey];
    const type = attribute ? new ApimapFieldTypeDetector(attribute, opts).perform() : 'Number';

    switch (association.associationType) {
      case 'BelongsTo':
      case 'HasOne':
        return type;
      case 'HasMany':
      case 'BelongsToMany':
        return [type];
      default:
        return null;
    }
  }

  function getInverseOf(association) {
    // Notice: get inverse relation field
    // return null if not found
    const remoteAssociation = Object.values(association.target.associations)
      .find((a) => {
        const { identifierField, foreignIdentifierField } = association;
        const field = association.associationType === 'BelongsToMany' ? foreignIdentifierField : identifierField;

        return a.identifierField === field && association.source.name === a.target.name;
      });
    if (remoteAssociation) {
      return remoteAssociation.associationAccessor;
    }
    return null;
  }

  function getSchemaForAssociation(association) {
    const schema = {
      field: association.associationAccessor,
      type: getTypeForAssociation(association),
      relationship: association.associationType,
      reference: `${association.target.name}.${association.target.primaryKeyField}`,
      inverseOf: getInverseOf(association),
    };

    // NOTICE: Detect potential foreign keys that should be excluded, if a
    //         constraints property is set for example.
    if (association.associationType === 'BelongsTo') {
      fieldNamesToExclude.push(association.identifierField);
    }

    return schema;
  }

  // FIXME: In `model.rawAttributes`, TEXT default values loose their inclosing quotes.
  //        eg: "'quoted string'" => "quoted string"
  const columns = P
    .each(_.values(model.rawAttributes), (column) => {
      try {
        if (column.references && !column.primaryKey) { return; }

        const schema = new ApimapFieldBuilder(model, column, opts).perform();

        if (schema.type) {
          fields.push(schema);
        }
      } catch (error) {
        Interface.logger.error(`Cannot fetch properly column ${column.field} of model ${model.name}`, error);
      }
    });

  const associations = P
    .each(_.values(model.associations), (association) => {
      try {
        const schema = getSchemaForAssociation(association);
        fields.push(schema);
      } catch (error) {
        Interface.logger.error(`Cannot fetch properly association ${association.associationAccessor} of model ${model.name}`, error);
      }
    });

  return P.all([columns, associations])
    .then(() => {
      let isCompositePrimary = false;
      const primaryKeys = _.keys(model.primaryKeys);
      let idField = primaryKeys[0];

      if (_.keys(model.primaryKeys).length > 1) {
        isCompositePrimary = true;
        idField = 'forestCompositePrimary';
      }

      Object.entries(model.associations).forEach(([, association]) => {
        const primaryKeyIsAForeignKey = isPrimaryKeyAForeignKey(association);
        if (primaryKeyIsAForeignKey) {
          const FieldWithForeignKey = fields.find((field) => field.reference === `${association.target.name}.${association.target.primaryKeyField}`);
          if (FieldWithForeignKey) {
            FieldWithForeignKey.foreignAndPrimaryKey = true;
          }
        }
      });

      _.remove(fields, (field) =>
        _.includes(fieldNamesToExclude, field.columnName) && !field.isPrimaryKey);

      return {
        name: model.name,
        idField,
        primaryKeys,
        isCompositePrimary,
        fields,
      };
    });
};
