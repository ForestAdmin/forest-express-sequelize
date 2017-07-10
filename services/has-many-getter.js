'use strict';
var _ = require('lodash');
var P = require('bluebird');
var QueryBuilder = require('./query-builder');
var SearchBuilder = require('./search-builder');

function HasManyGetter(model, association, opts, params) {
  var queryBuilder = new QueryBuilder(model, opts, params);

  function getFieldNamesRequested() {
    if (!params.fields || !params.fields[association.name]) { return null; }
    // NOTICE: Force the primaryKey retrieval to store the records properly in
    //         the client.
    var primaryKeyArray = [_.keys(association.primaryKeys)[0]];

    return _.union(primaryKeyArray, params.fields[association.name].split(','));
  }

  var fieldNamesRequested = getFieldNamesRequested();
  var where = new SearchBuilder(association, opts, params, fieldNamesRequested)
    .perform();
  var include = queryBuilder.getIncludes(association, fieldNamesRequested);

  function findQuery(queryOptions) {
    if (!queryOptions) { queryOptions = {}; }
    queryOptions.scope = false;
    queryOptions.where = where;
    queryOptions.include = include;

    return model.findById(params.recordId)
      .then(function (record) {
        return record['get' +
          _.capitalize(params.associationName)](queryOptions);
      });
  }

  function count() {
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
          return record.get({ plain: true });
        });
      });
  }

  this.perform = function () {
    return P.all([count(), getRecords()]);
  };
}

module.exports = HasManyGetter;
