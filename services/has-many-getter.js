'use strict';
var _ = require('lodash');
var P = require('bluebird');

function HasManyGetter(model, association, opts, params) {

  function getFieldNamesRequested() {
    if (!params.fields || !params.fields[association.name]) { return null; }
    // NOTICE: Force the primaryKey retrieval to store the records properly in
    //         the client.
    var primaryKeyArray = [_.keys(association.primaryKeys)[0]];

    return _.union(primaryKeyArray, params.fields[association.name].split(','));
  }

  function getIncludes() {
    var includes = [];
    var fieldNamesRequested = getFieldNamesRequested();

    _.values(association.associations).forEach(function (association) {
      // NOTICE: Add all includes only for requested associations
      if (!fieldNamesRequested ||
        (fieldNamesRequested.indexOf(association.as) !== -1)) {
        if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
          includes.push({
            model: association.target.unscoped(),
            as: association.associationAccessor
          });
        }
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

  function getRecords() {
    return model
      .findById(params.recordId)
      .then(function (record) {
        return record['get' + _.capitalize(params.associationName)]({
          scope: false,
          offset: getSkip(),
          limit: getLimit(),
          include: getIncludes(),
          order: getOrder()
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
