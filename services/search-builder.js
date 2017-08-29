'use strict';
var _ = require('lodash');
var Interface = require('forest-express');

var REGEX_UUID = '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i';

function SearchBuilder(model, opts, params, fieldNamesRequested) {
  var schema = Interface.Schemas.schemas[model.name];
  var DataTypes = opts.sequelize.Sequelize;
  var fields = _.clone(schema.fields);
  var associations = _.clone(model.associations);
  var hasSearchFields = schema.searchFields && _.isArray(schema.searchFields);
  var searchAssociationFields;

  this.perform = function () {
    if (!params.search) { return null; }
    var where = {};
    var or = [];

    _.each(fields, function (field) {
      // NOTICE: Ignore Smart field.
      if (field.isVirtual) { return; }

      // NOTICE: Ignore integration field.
      if (field.integration) { return; }

      // NOTICE: Handle belongsTo search below.
      if (field.reference) { return; }

      var q = {};
      var columnName;

      if (field.field === schema.idField) {
        var primaryKeyType = model.primaryKeys[schema.idField].type;

        if (primaryKeyType instanceof DataTypes.INTEGER) {
          var value = parseInt(params.search, 10) || 0;
          if (value) {
            q[field.field] = value;
            or.push(q);
          }
        } else if (primaryKeyType instanceof DataTypes.STRING) {
          columnName = field.columnName || field.field;
          q = opts.sequelize.where(
            opts.sequelize.fn('lower', opts.sequelize.col(
              schema.name + '.' + columnName)),
            ' LIKE ',
            opts.sequelize.fn('lower', '%' + params.search + '%')
          );
          or.push(q);
        } else if (primaryKeyType instanceof DataTypes.UUID &&
          params.search.match(REGEX_UUID)) {
          q[field.field] = params.search;
          or.push(q);
        }
      } else if (field.type === 'Enum') {
        var enumSearch = _.capitalize(params.search.toLowerCase());

        if (field.enums.indexOf(enumSearch) > -1) {
          q[field.field] = enumSearch;
          or.push(q);
        }
      } else if (field.type === 'String') {
        if (model.attributes[field.field] &&
          model.attributes[field.field].type instanceof DataTypes.UUID) {
          if (params.search.match(REGEX_UUID)) {
            q[field.field] = params.search;
            or.push(q);
          }
        } else {
          columnName = field.columnName || field.field;

          q = opts.sequelize.where(
            opts.sequelize.fn('lower', opts.sequelize.col(schema.name +
              '.' + columnName)),
            ' LIKE ',
            opts.sequelize.fn('lower', '%' + params.search + '%')
          );
          or.push(q);
        }
      }
    });

    // NOTICE: Handle search on displayed belongsTo
    if (parseInt(params.searchExtended)) {
      _.each(associations, function (association) {
        if (!fieldNamesRequested ||
          (fieldNamesRequested.indexOf(association.as) !== -1)) {
          if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {

            var schemaAssociation = Interface.Schemas
              .schemas[association.target.name];
            var fieldsAssociation = schemaAssociation.fields;

            _.each(fieldsAssociation, function(field) {
              if (field.reference || field.integration ||
                field.isSearchable === false) { return; }

              if (hasSearchFields && !_.includes(searchAssociationFields,
                association.as + '.' + field.field)) {
                return;
              }

              var q = {};
              var columnName = field.columnName || field.field;
              var column = opts.sequelize.col(association.as + '.' +
                columnName);

              if (field.field === schemaAssociation.idField) {
                if (field.type === 'Number') {
                  var value = parseInt(params.search, 10) || 0;
                  if (value) {
                    q = opts.sequelize.where(column, ' = ',
                      parseInt(params.search, 10) || 0);
                  }
                } else if (params.search.match(REGEX_UUID)) {
                  q = opts.sequelize.where(column, ' = ', params.search);
                }
              } else if (field.type === 'String') {
                q = opts.sequelize.where(
                  opts.sequelize.fn('lower', column), ' LIKE ',
                  opts.sequelize.fn('lower', '%' + params.search + '%')
                );
              }
              or.push(q);
            });
          }
        }
      });
    }

    if (or.length) { where.$or = or; }
    return where;
  };
}

module.exports = SearchBuilder;
