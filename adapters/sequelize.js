'use strict';
var _ = require('lodash');
var P = require('bluebird');

module.exports = function (model, opts) {
  var fields = [];
  var DataTypes = opts.sequelize.Sequelize;

  function getTypeFor(column) {
    if (column.type instanceof DataTypes.STRING ||
      column.type instanceof DataTypes.TEXT) {
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
    } else if (column.type instanceof DataTypes.JSONB) {
      return 'Json';
    } else if (column.type.type) {
      return [getTypeFor({ type: column.type.type })];
    }
  }

  function getTypeForAssociation(association) {
    switch (association.associationType) {
      case 'BelongsTo':
      case 'HasOne':
        return 'Number';
      case 'HasMany':
      case 'BelongsToMany':
        return ['Number'];
    }
  }

  function getSchemaForColumn(column) {
    var schema = {
      field: column.fieldName,
      type: getTypeFor(column)
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
      reference: association.target.name + '.id',
      inverseOf: null
    };

    return schema;
  }

  var columns = P
    .each(_.values(model.attributes), function (column) {
      if (column.references) { return; }

      var schema = getSchemaForColumn(column);
      fields.push(schema);
    });

  var associations = P
    .each(_.values(model.associations), function (association) {
      var schema = getSchemaForAssociation(association);
      fields.push(schema);
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

