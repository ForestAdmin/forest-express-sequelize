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
  var fieldsSearched = [];

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

  this.getFieldsSearched = function () {
    return fieldsSearched;
  };

  this.perform = function () {
    if (!params.search) { return null; }

    if (hasSearchFields) {
      selectSearchFields();
    }

    var where = {};
    var or = [];

    function pushCondition(condition, fieldName) {
      or.push(condition);
      fieldsSearched.push(fieldName);
    }

    _.each(fields, function (field) {
      if (field.isVirtual) { return; } // NOTICE: Ignore Smart Fields.
      if (field.integration) { return; } // NOTICE: Ignore integration fields.
      if (field.reference) { return; } // NOTICE: Handle belongsTo search below.

      var condition = {};
      var columnName;

      if (field.field === schema.idField) {
        var primaryKeyType = model.primaryKeys[schema.idField].type;

        if (primaryKeyType instanceof DataTypes.INTEGER) {
          var value = parseInt(params.search, 10) || 0;
          if (value) {
            condition[field.field] = value;
            pushCondition(condition, field.field);
          }
        } else if (primaryKeyType instanceof DataTypes.STRING) {
          columnName = field.columnName || field.field;
          condition = opts.sequelize.where(
            lowerIfNecessary(opts.sequelize.col(schema.name + '.' + columnName)),
            ' LIKE ',
            lowerIfNecessary('%' + params.search + '%')
          );
          pushCondition(condition, columnName);
        } else if (primaryKeyType instanceof DataTypes.UUID &&
          params.search.match(REGEX_UUID)) {
          condition[field.field] = params.search;
          pushCondition(condition, field.field);
        }
      } else if (field.type === 'Enum') {
        var enumValueFound;
        var searchValue = params.search.toLowerCase();

        _.each(field.enums, function (enumValue) {
          if (enumValue.toLowerCase() === searchValue) {
            enumValueFound = enumValue;
            return false;
          }
        });

        if (enumValueFound) {
          condition[field.field] = enumValueFound;
          pushCondition(condition, field.field);
        }
      } else if (field.type === 'String') {
        if (model.attributes[field.field] &&
          model.attributes[field.field].type instanceof DataTypes.UUID) {
          if (params.search.match(REGEX_UUID)) {
            condition[field.field] = params.search;
            pushCondition(condition, field.field);
          }
        } else {
          columnName = field.columnName || field.field;

          condition = opts.sequelize.where(
            lowerIfNecessary(opts.sequelize.col(schema.name + '.' + columnName)),
            ' LIKE ',
            lowerIfNecessary('%' + params.search + '%')
          );
          pushCondition(condition, columnName);
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

              var condition = {};
              var columnName = field.columnName || field.field;
              var column = opts.sequelize.col(association.as + '.' +
                columnName);

              if (field.field === schemaAssociation.idField) {
                if (field.type === 'Number') {
                  var value = parseInt(params.search, 10) || 0;
                  if (value) {
                    condition = opts.sequelize.where(column, ' = ',
                      parseInt(params.search, 10) || 0);
                  }
                } else if (params.search.match(REGEX_UUID)) {
                  condition = opts.sequelize.where(column, ' = ', params.search);
                }
              } else if (field.type === 'String') {
                if (modelAssociation.attributes[field.field] &&
                  modelAssociation.attributes[field.field].type instanceof
                  DataTypes.UUID) {
                  if (params.search.match(REGEX_UUID)) {
                    condition = opts.sequelize.where(column, '=', params.search);
                  }
                } else {
                  condition = opts.sequelize.where(
                    lowerIfNecessary(column), ' LIKE ',
                    lowerIfNecessary('%' + params.search + '%'));
                }
              }
              or.push(condition);
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
