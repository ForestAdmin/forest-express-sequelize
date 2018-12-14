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
    return _.values(modelForIncludes.associations)
      .filter(function (association) {
        return (
          (!fieldNamesRequested ||
            fieldNamesRequested.includes(association.as)) &&
          ['HasOne', 'BelongsTo'].includes(association.associationType) &&
          // Don't include models that are already included by the segment scope
          (modelForIncludes._scope.include || []).every(function (include) {
            return include.model !== association.target
          })
        );
      })
      .map(function (association) {
        return {
          model: association.target.unscoped(),
          as: association.associationAccessor
        };
      });
  };

  this.getOrder = function (aliasName) {
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
      } else if (aliasName) {
        return [[opts.sequelize.col(`${aliasName}.${params.sort}`), order]];
      } else {
        return [[params.sort, order]];
      }
    }

    return null;
  };
}

module.exports = QueryBuilder;
