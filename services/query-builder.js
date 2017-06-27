'use strict';
var _ = require('lodash');
var Database = require('../utils/database');

function QueryBuilder(model, opts, params) {

  var fieldNamesRequested = (function() {
    if (!params.fields || !params.fields[model.name]) { return null; }

    // NOTICE: Populate the necessary associations for filters
    var associationsForQuery = [];
    _.each(params.filter, function (values, key) {
      if (key.indexOf(':') !== -1) {
        var association = key.split(':')[0];
        associationsForQuery.push(association);
      }
    });

    if (params.sort && params.sort.indexOf('.') !== -1) {
      associationsForQuery.push(params.sort.split('.')[0]);
    }

    // NOTICE: Force the primaryKey retrieval to store the records properly in
    //         the client.
    var primaryKeyArray = [_.keys(model.primaryKeys)[0]];

    return _.union(primaryKeyArray, params.fields[model.name].split(','),
      associationsForQuery);
  })();

  this.getWhere = function (segmentWhere, searchParams, filterParams) {
    var where = { $and: [] };

    if (params.search) {
      where.$and.push(searchParams);
    }

    if (params.filter) {
      where.$and.push(filterParams);
    }

    if (segmentWhere) {
      where.$and.push(segmentWhere);
    }

    return where;
  };

  this.hasPagination = function () {
    return params.page && params.page.number;
  };

  this.getLimit = function () {
    if (this.hasPagination()) {
      return parseInt(params.page.size) || 10;
    } else {
      return 10;
    }
  };

  this.getSkip = function () {
    if (this.hasPagination()) {
      return (parseInt(params.page.number) - 1) * this.getLimit();
    } else {
      return 0;
    }
  };

  this.getIncludes = function () {
    var includes = [];
    _.values(model.associations).forEach(function (association) {
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
  };

  this.getOrder = function () {
    if (params.sort) {
      var idField = _.keys(model.primaryKeys)[0];

      if (Database.isMSSQL(opts) && params.sort.indexOf(idField) >= 0) {
        return null;
      }

      var order = 'ASC';

      if (params.sort[0] === '-') {
        params.sort = params.sort.substring(1);
        order = 'DESC';
      }

      if (params.sort.indexOf('.') !== -1) {
        // NOTICE: Sort on the belongsTo displayed field
        return [[opts.sequelize.col(params.sort), order]];
      } else {
        return [[params.sort, order]];
      }
    }

    return null;
  };
}

module.exports = QueryBuilder;
