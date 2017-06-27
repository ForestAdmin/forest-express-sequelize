'use strict';
var _ = require('lodash');
var P = require('bluebird');
var QueryBuilderService = require('./query-builder');

function HasManyGetter(model, association, opts, params) {
  var QueryBuilder = new QueryBuilderService(model, opts, params);

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
          include: QueryBuilder.getIncludes(),
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
