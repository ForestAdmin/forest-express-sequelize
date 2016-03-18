'use strict';
var _ = require('lodash');
var P = require('bluebird');

function HasManyFinder(model, association, opts, params) {
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
          offset: getSkip(),
          limit: getLimit()
        });
      });
  }

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    if (hasPagination()) {
      return parseInt(params.page.size) || 10;
    } else {
      return 10;
    }
  }

  function getSkip() {
    if (hasPagination()) {
      return (parseInt(params.page.number) - 1) * getLimit();
    } else {
      return 0;
    }
  }

  this.perform = function () {
    return P.all([count(), getRecords()]);
  };
}

module.exports = HasManyFinder;
