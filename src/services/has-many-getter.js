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
  var searchBuilder = new SearchBuilder(association, opts, params, fieldNamesRequested);
  var where = searchBuilder.perform(params.associationName);
  var include = queryBuilder.getIncludes(association, fieldNamesRequested);

  function findQuery(queryOptions) {
    if (!queryOptions) { queryOptions = {}; }

    return model.findById(params.recordId, {
      order: queryOptions.order,
      subQuery: false,
      offset: queryOptions.offset,
      limit: queryOptions.limit,
      include: [{
        model: association,
        as: params.associationName,
        scope: false,
        required: false,
        where,
        include,
      }],
    }).then(function (record) {
      return record[params.associationName];
    });
  }

  function getCount() {
    return model.count({
      where: { [primaryKeyModel]: params.recordId },
      include: [{
        model: association,
        as: params.associationName,
        where,
        required: true,
        scope: false,
      }],
    });
  }

  function getRecords() {
    var queryOptions = {
      order: queryBuilder.getOrder(params.associationName),
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
