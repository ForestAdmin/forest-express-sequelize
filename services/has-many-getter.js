'use strict';
var _ = require('lodash');
var P = require('bluebird');

function HasManyGetter(model, association, opts, params) {
  function getIncludes() {
    var includes = [];

    _.values(association.associations).forEach(function (association) {
      if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
        includes.push({
          model: association.target,
          as: association.associationAccessor
        });
      }
    });

    return includes;
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
          offset: getSkip(),
          limit: getLimit(),
          include: getIncludes(),
          order: getOrder()
        });
      })
      .then(function (records) {
        return P.map(records, function (record) {
          return record.toJSON();
        });
      });
  }

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    if (hasPagination()) {
      return parseInt(params.page.size) || 5;
    } else {
      return 5;
    }
  }

  function getSkip() {
    if (hasPagination()) {
      return (parseInt(params.page.number) - 1) * getLimit();
    } else {
      return 0;
    }
  }

  function getOrder() {
    var sort = [];
    if (params.sort) {
      var order = 'ASC';

      if (params.sort[0] === '-') {
        params.sort = params.sort.substring(1);
        order = 'DESC';
      }

      sort.push([params.sort, order]);
    }

    return sort;
  }

  this.perform = function () {
    return P.all([count(), getRecords()]);
  };
}

module.exports = HasManyGetter;
