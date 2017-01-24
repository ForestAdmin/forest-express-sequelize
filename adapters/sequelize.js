'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Interface = require('forest-express');

module.exports = function (model, opts) {
  var fields = [];
  var DataTypes = opts.sequelize.Sequelize;

  function getTypeFor(column) {
    if (column.type instanceof DataTypes.STRING ||
      column.type instanceof DataTypes.TEXT ||
      column.type instanceof DataTypes.UUID) {
      return 'String';
    } else if (column.type instanceof DataTypes.ENUM) {
      return 'Enum';
    } else if (column.type instanceof DataTypes.BOOLEAN) {
      return 'Boolean';
    } else if (column.type instanceof DataTypes.DATE) {
      return 'Date';
    } else if (column.type instanceof DataTypes.INTEGER ||
      column.type instanceof DataTypes.FLOAT ||
      column.type instanceof DataTypes['DOUBLE PRECISION'] ||
      column.type instanceof DataTypes.DECIMAL) {
      return 'Number';
    } else if (column.type instanceof DataTypes.JSONB ||
      column.type instanceof DataTypes.JSON) {
      return 'Json';
    } else if (column.type instanceof DataTypes.TIME) {
      return 'Time';
    } else if (column.type.type) {
      return [getTypeFor({ type: column.type.type })];
    }
  }

  function getTypeForAssociation(association) {
    var attribute = association.target.attributes[association.targetKey];
    var type = attribute ? getTypeFor(attribute) : 'Number';

    switch (association.associationType) {
      case 'BelongsTo':
      case 'HasOne':
        return type;
      case 'HasMany':
      case 'BelongsToMany':
        return [type];
    }
  }

  function getSchemaForColumn(column) {
    var schema = {
      field: column.fieldName,
      type: getTypeFor(column),
      // NOTICE: Necessary only for fields with different field and database
      //         column names
      columnName: column.field
    };

    if (schema.type === 'Enum') {
      schema.enums = column.values;
    }

    return schema;
  }

  function getSchemaForAssociation(association) {
    var schema = {
      field: association.associationAccessor,
      type: getTypeForAssociation(association),
      reference: association.target.name + '.' + association.foreignKey,
      inverseOf: null
    };

    return schema;
  }

  var columns = P
    .each(_.values(model.attributes), function (column) {
      try {
        if (column.references) { return; }

        var schema = getSchemaForColumn(column);
        fields.push(schema);
      } catch (error) {
        Interface.logger.error('Cannot fetch properly column ' + column.field +
          ' of model ' + model.name + ':\n' + error);
      }
    });

  var associations = P
    .each(_.values(model.associations), function (association) {
      try {
        var schema = getSchemaForAssociation(association);
        fields.push(schema);
      } catch (error) {
        Interface.logger.error('Cannot fetch properly association ' +
          association.associationAccessor + ' of model ' + model.name + ':\n' +
          error);
      }
    });

  return P.all([columns, associations])
    .then(function () {
      return {
        name: model.name,
        idField: _.keys(model.primaryKeys)[0],
        fields: fields
      };
    });
};
