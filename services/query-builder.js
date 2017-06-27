'use strict';
var _ = require('lodash');
var Database = require('../utils/database');

function QueryBuilder(model, opts, params) {
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

  this.getIncludes = function (fieldNamesRequested) {
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
