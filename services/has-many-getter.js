'use strict';
var _ = require('lodash');
var P = require('bluebird');
var QueryBuilderService = require('./query-builder');

function HasManyGetter(model, association, opts, params) {
  var QueryBuilder = new QueryBuilderService(model, opts, params);

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
    return model
      .findById(params.recordId)
      .then(function (record) {
        return record['get' + _.capitalize(params.associationName)]({
          scope: false,
          include: QueryBuilder.getIncludes(getFieldNamesRequested()),
          order: QueryBuilder.getOrder(),
          offset: QueryBuilder.getSkip(),
          limit: QueryBuilder.getLimit()
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
