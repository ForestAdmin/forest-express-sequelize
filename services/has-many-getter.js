'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Interface = require('forest-express');
var QueryBuilder = require('./query-builder');
var SearchBuilder = require('./search-builder');
var RecordsDecorator = require('../utils/records-decorator');
var CompositeKeysManager = require('./composite-keys-manager');

function HasManyGetter(model, association, opts, params) {
  var queryBuilder = new QueryBuilder(model, opts, params);
  var schema = Interface.Schemas.schemas[association.name];

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
        console.log('get' + _.upperFirst(params.associationName));
        return record['get' +
          _.upperFirst(params.associationName)](queryOptions);
      });
  }

  function getCount() {
    // TODO: Why not use a count that would generate a much more efficient SQL
    //       query.
    return findQuery()
      .then(function (records) {
        return records.length;
      });
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
          // NOTICE: Do not use "toJSON" method to prevent issues on models that
          //         override this method.
          var recordFormated = record.get({ plain: true });
          if (schema.isCompositePrimary) {
            recordFormated.forestCompositePrimary =
              new CompositeKeysManager(association, schema, record)
                .createCompositePrimary();
          }

          return recordFormated;
        });
      });
  }

  this.perform = function () {
    return P.all([getRecords(), getCount()])
      .then((results) => {
        var records = results[0];
        var count = results[1];
        var decorators = null;

        if (params.search) {
          var decoratorsSearch = RecordsDecorator.decorateForSearch(
            records,
            searchBuilder.getFieldsSearched(),
            params.search
          );
          if (!_.isEmpty(decoratorsSearch)) {
            decorators = decoratorsSearch;
          }
        }

        return [records, count, decorators];
      });
  };
}

module.exports = HasManyGetter;
