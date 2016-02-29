'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Inflector = require('inflected');

module.exports = function (model, opts) {
  var fields = [];
  var DataTypes = opts.sequelize.Sequelize;

  function getTypeFor(column) {
    if (column.type instanceof DataTypes.STRING) {
      return 'String';
    } else if (column.type instanceof DataTypes.BOOLEAN) {
      return 'Boolean';
    } else if (column.type instanceof DataTypes.DATE) {
      return 'Date';
    } else if (column.type instanceof DataTypes.INTEGER ||
      column.type instanceof DataTypes.FLOAT ||
      column.type instanceof DataTypes['DOUBLE PRECISION']) {
      return 'Number';
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

  function getInverseOf(association) {
    return association.source.options.name.pluralize;
  }

  function getSchemaForColumn(column) {
    var schema = { field: column.fieldName, type: getTypeFor(column) };
    return schema;
  }

  function getSchemaForAssociation(association) {
    var schema = {
      field: association.associationAccessor,
      type: getTypeForAssociation(association),
      reference: association.target.options.name.plural + '.id',
      inverseOf: getInverseOf(association)
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
        name: Inflector.pluralize(Inflector.underscore(model.name)),
        fields: fields
      };
    });
};

