const _ = require('lodash');
const P = require('bluebird');
const Interface = require('forest-express');
const ApimapFieldBuilder = require('../services/apimap-field-builder');
const ApimapFieldTypeDetector = require('../services/apimap-field-type-detector');

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

  function getSchemaForAssociation(association) {
    const schema = {
      field: association.associationAccessor,
      type: getTypeForAssociation(association),
      relationship: association.associationType,
      // TODO: For BelongsTo associations, the reference does not seem to be
      //       correct; the target name is correct, but not the second part.
      reference: `${association.target.name}.${association.foreignKey}`,
      inverseOf: null,
    };

    // NOTICE: Detect potential foreign keys that should be excluded, if a
    //         constraints property is set for example.
    if (association.associationType === 'BelongsTo') {
      fieldNamesToExclude.push(association.identifierField);
    }

    return schema;
  }

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

      _.remove(fields, field =>
        _.includes(fieldNamesToExclude, field.columnName) && !field.primaryKey);

      return {
        name: model.name,
        idField,
        primaryKeys,
        isCompositePrimary,
        fields,
      };
    });
};
