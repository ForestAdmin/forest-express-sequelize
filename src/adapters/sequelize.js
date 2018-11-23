'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Interface = require('forest-express');
var ApimapFieldBuilder = require('../services/apimap-field-builder');
var ApimapFieldTypeDetector = require('../services/apimap-field-type-detector');

module.exports = function (model, opts) {
  var fields = [];
  var fieldNamesToExclude = [];

  function getTypeForAssociation(association) {
    var attribute = association.target.attributes[association.targetKey];
    var type = attribute ? new ApimapFieldTypeDetector(attribute, opts).perform() : 'Number';

    switch (association.associationType) {
      case 'BelongsTo':
      case 'HasOne':
        return type;
      case 'HasMany':
      case 'BelongsToMany':
        return [type];
    }
  }

  function getSchemaForAssociation(association) {
    var schema = {
      field: association.associationAccessor,
      type: getTypeForAssociation(association),
      relationship: association.associationType,
      // TODO: For BelongsTo associations, the reference does not seem to be
      //       correct; the target name is correct, but not the second part.
      reference: association.target.name + '.' + association.foreignKey,
      inverseOf: null
    };

    // NOTICE: Detect potential foreign keys that should be excluded, if a
    //         constraints property is set for example.
    if (association.associationType === 'BelongsTo') {
      fieldNamesToExclude.push(association.identifierField);
    }

    return schema;
  }

  var columns = P
    .each(_.values(model.attributes), function (column) {
      try {
        if (column.references && !column.primaryKey) { return; }

        var schema = new ApimapFieldBuilder(model, column, opts).perform();

        if (schema.type) {
          fields.push(schema);
        }
      } catch (error) {
        Interface.logger.error('Cannot fetch properly column ' + column.field +
          ' of model ' + model.name, error);
      }
    });

  var associations = P
    .each(_.values(model.associations), function (association) {
      try {
        var schema = getSchemaForAssociation(association);
        fields.push(schema);
      } catch (error) {
        Interface.logger.error('Cannot fetch properly association ' +
          association.associationAccessor + ' of model ' + model.name, error);
      }
    });

  return P.all([columns, associations])
    .then(function () {
      var isCompositePrimary = false;
      var primaryKeys = _.keys(model.primaryKeys);
      var idField = primaryKeys[0];

      if (_.keys(model.primaryKeys).length > 1) {
        isCompositePrimary = true;
        idField = 'forestCompositePrimary';
      }

      _.remove(fields, function (field) {
        return _.includes(fieldNamesToExclude, field.columnName) &&
          !field.primaryKey;
      });

      return {
        name: model.name,
        idField: idField,
        primaryKeys: primaryKeys,
        isCompositePrimary: isCompositePrimary,
        fields: fields
      };
    });
};
