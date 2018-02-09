'use strict';
var _ = require('lodash');
var Operators = require('../utils/operators');
var Interface = require('forest-express');
var Database = require('../utils/database');

var REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function SearchBuilder(model, opts, params, fieldNamesRequested) {
  var schema = Interface.Schemas.schemas[model.name];
  var DataTypes = opts.sequelize;
  var fields = _.clone(schema.fields);
  var associations = _.clone(model.associations);
  var hasSearchFields = schema.searchFields && _.isArray(schema.searchFields);
  var searchAssociationFields;
  var OPERATORS = new Operators(opts);

  function lowerIfNecessary(entry) {
    // NOTICE: MSSQL search is natively case insensitive, do not use the "lower" function for
    //         performance optimization.
    if (Database.isMSSQL(opts)) { return entry; }
    return opts.sequelize.fn('lower', entry);
  }

  function selectSearchFields() {
    var searchFields = _.clone(schema.searchFields);
    searchAssociationFields = _.remove(searchFields, function (field) {
      return field.indexOf('.') !== -1;
    });

    _.remove(fields, function (field) {
      return !_.includes(schema.searchFields, field.field);
    });

    var searchAssociationNames = _.map(searchAssociationFields,
      function (association) { return association.split('.')[0]; });
    associations = _.pick(associations, searchAssociationNames);

    // NOTICE: Compute warnings to help developers to configure the
    //         searchFields.
    var fieldsSimpleNotFound = _.xor(searchFields,
      _.map(fields, function (field) { return field.field; }));
    var fieldsAssociationNotFound = _.xor(
      _.map(searchAssociationFields, function (association) {
        return association.split('.')[0];
      }), _.keys(associations));

    if (fieldsSimpleNotFound.length) {
      Interface.logger.warn('Cannot find the fields [' + fieldsSimpleNotFound +
        '] while searching records in model ' + model.name + '.');
    }

    if (fieldsAssociationNotFound.length) {
      Interface.logger.warn('Cannot find the associations [' +
        fieldsAssociationNotFound + '] while searching records in model ' +
        model.name + '.');
    }
  }

  this.perform = function () {
    if (!params.search) { return null; }

    if (hasSearchFields) {
      selectSearchFields();
    }

    var where = {};
    var or = [];

    _.each(fields, function (field) {
      if (field.isVirtual) { return; } // NOTICE: Ignore Smart Fields.
      if (field.integration) { return; } // NOTICE: Ignore integration fields.
      if (field.reference) { return; } // NOTICE: Handle belongsTo search below.

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
            lowerIfNecessary(opts.sequelize.col(schema.name + '.' + columnName)),
            ' LIKE ',
            lowerIfNecessary('%' + params.search + '%')
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
            lowerIfNecessary(opts.sequelize.col(schema.name + '.' + columnName)),
            ' LIKE ',
            lowerIfNecessary('%' + params.search + '%')
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

            var modelAssociation = association.target;
            var schemaAssociation = Interface.Schemas
              .schemas[modelAssociation.name];
            var fieldsAssociation = schemaAssociation.fields;

            _.each(fieldsAssociation, function(field) {
              if (field.isVirtual) { return; } // NOTICE: Ignore Smart Fields.
              if (field.integration) { return; } // NOTICE: Ignore integration fields.
              if (field.reference) { return; } // NOTICE: Ignore associations.
              if (field.isSearchable === false) { return; }

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
                if (modelAssociation.attributes[field.field] &&
                  modelAssociation.attributes[field.field].type instanceof
                  DataTypes.UUID) {
                  if (params.search.match(REGEX_UUID)) {
                    q = opts.sequelize.where(column, '=', params.search);
                  }
                } else {
                  q = opts.sequelize.where(
                    lowerIfNecessary(column), ' LIKE ',
                    lowerIfNecessary('%' + params.search + '%'));
                }
              }
              or.push(q);
            });
          }
        }
      });
    }

    if (or.length) { where[OPERATORS.OR] = or; }
    return where;
  };
}

module.exports = SearchBuilder;
