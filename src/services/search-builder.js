const _ = require('lodash');
const Operators = require('../utils/operators');
const Interface = require('forest-express');
const Database = require('../utils/database');

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function SearchBuilder(model, opts, params, fieldNamesRequested) {
  const schema = Interface.Schemas.schemas[model.name];
  const DataTypes = opts.sequelize;
  const fields = _.clone(schema.fields);
  let associations = _.clone(model.associations);
  const hasSearchFields = schema.searchFields && _.isArray(schema.searchFields);
  let searchAssociationFields;
  const OPERATORS = new Operators(opts);
  const fieldsSearched = [];
  let hasExtendedConditions = false;

  function lowerIfNecessary(entry) {
    // NOTICE: MSSQL search is natively case insensitive, do not use the "lower" function for
    //         performance optimization.
    if (Database.isMSSQL(opts)) { return entry; }
    return opts.sequelize.fn('lower', entry);
  }

  function selectSearchFields() {
    const searchFields = _.clone(schema.searchFields);
    searchAssociationFields = _.remove(searchFields, field => field.indexOf('.') !== -1);

    _.remove(fields, field => !_.includes(schema.searchFields, field.field));

    const searchAssociationNames = _.map(searchAssociationFields, association =>
      association.split('.')[0]);
    associations = _.pick(associations, searchAssociationNames);

    // NOTICE: Compute warnings to help developers to configure the
    //         searchFields.
    const fieldsSimpleNotFound = _.xor(
      searchFields,
      _.map(fields, field => field.field),
    );
    const fieldsAssociationNotFound = _.xor(
      _.map(searchAssociationFields, association => association.split('.')[0]),
      _.keys(associations),
    );

    if (fieldsSimpleNotFound.length) {
      Interface.logger.warn(`Cannot find the fields [${fieldsSimpleNotFound}] while searching records in model ${model.name}.`);
    }

    if (fieldsAssociationNotFound.length) {
      Interface.logger.warn(`Cannot find the associations [${fieldsAssociationNotFound}] while searching records in model ${model.name}.`);
    }
  }

  this.getFieldsSearched = () => fieldsSearched;

  this.hasExtendedSearchConditions = () => hasExtendedConditions;

  this.perform = (associationName) => {
    if (!params.search) { return null; }

    if (hasSearchFields) {
      selectSearchFields();
    }

    const aliasName = associationName || schema.name;
    const where = {};
    const or = [];

    function pushCondition(condition, fieldName) {
      or.push(condition);
      fieldsSearched.push(fieldName);
    }

    _.each(fields, (field) => {
      if (field.isVirtual) { return; } // NOTICE: Ignore Smart Fields.
      if (field.integration) { return; } // NOTICE: Ignore integration fields.
      if (field.reference) { return; } // NOTICE: Handle belongsTo search below.

      let condition = {};
      let columnName;

      if (field.field === schema.idField) {
        const primaryKeyType = model.primaryKeys[schema.idField].type;

        if (primaryKeyType instanceof DataTypes.INTEGER) {
          const value = parseInt(params.search, 10) || 0;
          if (value) {
            condition[field.field] = value;
            pushCondition(condition, field.field);
          }
        } else if (primaryKeyType instanceof DataTypes.STRING) {
          columnName = field.columnName || field.field;
          condition = opts.sequelize.where(
            lowerIfNecessary(opts.sequelize.col(`${aliasName}.${columnName}`)),
            ' LIKE ',
            lowerIfNecessary(`%${params.search}%`),
          );
          pushCondition(condition, columnName);
        } else if (primaryKeyType instanceof DataTypes.UUID &&
          params.search.match(REGEX_UUID)) {
          condition[field.field] = params.search;
          pushCondition(condition, field.field);
        }
      } else if (field.type === 'Enum') {
        let enumValueFound;
        const searchValue = params.search.toLowerCase();

        _.each(field.enums, (enumValue) => {
          if (enumValue.toLowerCase() === searchValue) {
            enumValueFound = enumValue;
          }
        });

        if (enumValueFound) {
          condition[field.field] = enumValueFound;
          pushCondition(condition, field.field);
        }
      } else if (field.type === 'String') {
        if (model.rawAttributes[field.field] &&
          model.rawAttributes[field.field].type instanceof DataTypes.UUID) {
          if (params.search.match(REGEX_UUID)) {
            condition[field.field] = params.search;
            pushCondition(condition, field.field);
          }
        } else {
          columnName = field.columnName || field.field;

          condition = opts.sequelize.where(
            lowerIfNecessary(opts.sequelize.col(`${aliasName}.${columnName}`)),
            ' LIKE ',
            lowerIfNecessary(`%${params.search}%`),
          );
          pushCondition(condition, columnName);
        }
      }
    });

    // NOTICE: Handle search on displayed belongsTo
    if (parseInt(params.searchExtended, 10)) {
      _.each(associations, (association) => {
        if (!fieldNamesRequested ||
          (fieldNamesRequested.indexOf(association.as) !== -1)) {
          if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
            const modelAssociation = association.target;
            const schemaAssociation = Interface.Schemas.schemas[modelAssociation.name];
            const fieldsAssociation = schemaAssociation.fields;

            _.each(fieldsAssociation, (field) => {
              if (field.isVirtual) { return; } // NOTICE: Ignore Smart Fields.
              if (field.integration) { return; } // NOTICE: Ignore integration fields.
              if (field.reference) { return; } // NOTICE: Ignore associations.
              if (field.isSearchable === false) { return; }

              if (hasSearchFields
                && !_.includes(searchAssociationFields, `${association.as}.${field.field}`)) {
                return;
              }

              let condition = {};
              const columnName = field.columnName || field.field;
              const column = opts.sequelize.col(`${association.as}.${columnName}`);

              if (field.field === schemaAssociation.idField) {
                if (field.type === 'Number') {
                  const value = parseInt(params.search, 10) || 0;
                  if (value) {
                    condition = opts.sequelize.where(
                      column,
                      ' = ',
                      parseInt(params.search, 10) || 0,
                    );
                    hasExtendedConditions = true;
                  }
                } else if (params.search.match(REGEX_UUID)) {
                  condition = opts.sequelize.where(column, ' = ', params.search);
                  hasExtendedConditions = true;
                }
              } else if (field.type === 'String') {
                if (modelAssociation.rawAttributes[field.field] &&
                  modelAssociation.rawAttributes[field.field].type instanceof
                  DataTypes.UUID) {
                  if (params.search.match(REGEX_UUID)) {
                    condition = opts.sequelize.where(column, '=', params.search);
                    hasExtendedConditions = true;
                  }
                } else {
                  condition = opts.sequelize.where(
                    lowerIfNecessary(column), ' LIKE ',
                    lowerIfNecessary(`%${params.search}%`),
                  );
                  hasExtendedConditions = true;
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
