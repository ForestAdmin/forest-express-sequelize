'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Interface = require('forest-express');
var QueryBuilder = require('./query-builder');
var SearchBuilder = require('./search-builder');
var CompositeKeysManager = require('./composite-keys-manager');

function HasManyGetter(model, association, opts, params) {
  var queryBuilder = new QueryBuilder(model, opts, params);
  var schema = Interface.Schemas.schemas[association.name];
  var primaryKeyModel = _.keys(model.primaryKeys)[0];

  function getFieldNamesRequested() {
    if (!params.fields || !params.fields[association.name]) { return null; }
    // NOTICE: Force the primaryKey retrieval to store the records properly in
    //         the client.
    var primaryKeyArray = [_.keys(association.primaryKeys)[0]];

    return _.union(primaryKeyArray, params.fields[association.name].split(','));
  }

  var fieldNamesRequested = getFieldNamesRequested();
  var searchBuilder = new SearchBuilder(association, opts, params,
    fieldNamesRequested);
  var where = searchBuilder.perform();
  var include = queryBuilder.getIncludes(association, fieldNamesRequested);

  function findQuery(queryOptions) {
    if (!queryOptions) { queryOptions = {}; }
    queryOptions.scope = false;
    queryOptions.where = where;
    queryOptions.include = include;

    return model.findById(params.recordId)
      .then(function (record) {
        return record['get' +
          _.upperFirst(params.associationName)](queryOptions);
      });
  }

  function getCount() {
    var associationType;
    var whereAssociation = where || {};
    var foreignKey;

    // NOTICE: Detect the association type and foreign key.
    _.values(model.associations).forEach(function (modelAssociation) {
      if (['HasMany', 'BelongsToMany'].indexOf(modelAssociation.associationType) > -1) {
        if (modelAssociation.target.name === association.name) {
          foreignKey = modelAssociation.foreignKey;
          associationType = modelAssociation.associationType;
        }
      }
    });

    // NOTICE: Set the specific count condition for HasMany relationships.
    if (associationType === 'HasMany') {
      _.values(association.associations).forEach(function (modelAssociation) {
        if (modelAssociation.associationType === 'BelongsTo' &&
          modelAssociation.foreignKey === foreignKey) {
          whereAssociation[modelAssociation.foreignKey] = params.recordId;
        }
      });
    }

    var countConditions = {
      scope: false,
      where: whereAssociation,
    };

    // NOTICE: Set the specific count condition for BelongsToMany relationships.
    if (associationType === 'BelongsToMany') {
      var whereForParent = {};
      whereForParent[primaryKeyModel] = params.recordId;
      countConditions.include = [{ model: model, where: whereForParent }];
    }

    return association.count(countConditions);
  }

  function getRecords() {
    var queryOptions = {
      order: queryBuilder.getOrder(),
      offset: queryBuilder.getSkip(),
      limit: queryBuilder.getLimit()
    };

    return findQuery(queryOptions)
      .then(function (records) {
        return P.map(records, function (record) {
          if (schema.isCompositePrimary) {
            record.forestCompositePrimary =
              new CompositeKeysManager(association, schema, record)
                .createCompositePrimary();
          }

          return record;
        });
      });
  }

  this.perform = function () {
    return getRecords()
      .then(function (records) {
        var fieldsSearched = null;

        if (params.search) {
          fieldsSearched = searchBuilder.getFieldsSearched();
        }

        return [records, fieldsSearched];
      });
  };

  this.count = getCount;
}

module.exports = HasManyGetter;
