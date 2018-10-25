'use strict';
var _ = require('lodash');
var Database = require('../utils/database');

function QueryBuilder(model, opts, params) {
  function hasPagination() {
    return params.page && params.page.number;
  }

  this.getSkip = function () {
    if (hasPagination()) {
      return (parseInt(params.page.number) - 1) * this.getLimit();
    } else {
      return 0;
    }
  };

  this.getLimit = function () {
    if (hasPagination()) {
      return parseInt(params.page.size) || 10;
    } else {
      return 10;
    }
  };

  this.getIncludes = function (modelForIncludes, fieldNamesRequested) {
    var includes = [];
    _.values(modelForIncludes.associations).forEach(function (association) {
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
      var order = 'ASC';

      if (params.sort[0] === '-') {
        params.sort = params.sort.substring(1);
        order = 'DESC';
      }

      // NOTICE: Sequelize version previous to 4.4.2 generate a bad MSSQL query
      //         if users sort the collection on the primary key, so we prevent
      //         that.
      var idField = _.keys(model.primaryKeys)[0];
      if (Database.isMSSQL(opts) && _.includes([idField, '-' + idField],
        params.sort)) {
        var sequelizeVersion = opts.sequelize.version;
        if (sequelizeVersion !== '4.4.2-forest') {
          return null;
        }
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
