'use strict';
var _ = require('lodash');
var P = require('bluebird');
var QueryBuilder = require('./query-builder');
var HandleSearchParam = require('./handle-search');

function HasManyGetter(model, association, opts, params) {
  var queryBuilder = new QueryBuilder(model, opts, params);

  function getFieldNamesRequested() {
    if (!params.fields || !params.fields[association.name]) { return null; }
    // NOTICE: Force the primaryKey retrieval to store the records properly in
    //         the client.
    var primaryKeyArray = [_.keys(association.primaryKeys)[0]];

    return _.union(primaryKeyArray, params.fields[association.name].split(','));
  }

  function count() {
    return model.findById(params.recordId)
      .then(function (record) {
        return record['get' + _.capitalize(params.associationName)]();
      })
      .then(function (records) {
        return records.length;
      });
  }

  function getRecords() {

    var where = new HandleSearchParam(association, opts, params,
      getFieldNamesRequested()).perform();

    return model
      .findById(params.recordId)
      .then(function (record) {
        return record['get' + _.capitalize(params.associationName)]({
          scope: false,
          where: where,
          include: queryBuilder.getIncludes(
            association, getFieldNamesRequested()),
          order: queryBuilder.getOrder(),
          offset: queryBuilder.getSkip(),
          limit: queryBuilder.getLimit()
        });
      })
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
