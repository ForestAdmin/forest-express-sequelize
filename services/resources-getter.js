'use strict';
var _ = require('lodash');
var P = require('bluebird');
var OperatorValueParser = require('./operator-value-parser');
var Interface = require('forest-express');

var REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ResourcesGetter(model, opts, params) {
  var schema = Interface.Schemas.schemas[model.name];
  var segment;

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

  function handleSearchParam() {
    var where = {};
    var or = [];

    _.each(schema.fields, function (field) {
      // NOTICE: Ignore Smart field.
      if (field.isVirtual) { return; }

      // NOTICE: Ignore integration field.
      if (field.integration) { return; }

      // NOTICE: Handle belongsTo search below.
      if (field.reference) { return; }

      var q = {};

      if (field.field === schema.idField) {
        if (field.type === 'Number') {
          q[field.field] = parseInt(params.search, 10) || 0;
        } else if (params.search.match(REGEX_UUID)) {
          q[field.field] = params.search;
        }
      } else if (field.type === 'Enum') {
        var enumSearch = _.capitalize(params.search.toLowerCase());

        if (field.enums.indexOf(enumSearch) > -1) {
          q[field.field] = enumSearch;
        }
      } else if (field.type === 'String') {
        var columnName = field.columnName || field.field;

        q = opts.sequelize.where(
          opts.sequelize.fn('lower', opts.sequelize.col(schema.name + '.' +
            columnName)),
          ' LIKE ',
          opts.sequelize.fn('lower', '%' + params.search + '%')
        );
      }

      or.push(q);
    });

    // NOTICE: Handle search on displayed belongsTo
    _.each(model.associations, function (association) {

      if (!fieldNamesRequested ||
        (fieldNamesRequested.indexOf(association.as) !== -1)) {
        if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {

          var schemaAssociation = Interface.Schemas
            .schemas[association.target.name];
          var fieldsAssociation = schemaAssociation.fields;

          _.each(fieldsAssociation, function(field) {
            if (field.reference || field.integration ||
              field.isSearchable === false) { return; }

            var q = {};
            var columnName = field.columnName || field.field;
            var column = opts.sequelize.col(association.as + '.' + columnName);

            if (field.field === schemaAssociation.idField) {
              if (field.type === 'Number') {
                q = opts.sequelize.where(column, ' = ',
                  parseInt(params.search, 10) || 0);
              } else if (params.search.match(REGEX_UUID)) {
                q = opts.sequelize.where(column, ' = ', params.search);
              }
            } else if (field.type === 'String') {
              q = opts.sequelize.where(
                opts.sequelize.fn('lower', column), ' LIKE ',
                opts.sequelize.fn('lower', '%' + params.search + '%')
              );
            }
            or.push(q);
          });
        }
      }
    });

    where.$or = or;
    return where;
  }

  function handleFilterParams() {
    var where = {};
    var conditions = [];

    _.each(params.filter, function (values, key) {
      if (key.indexOf(':') !== -1) {
        key = '$' + key.replace(':', '.') + '$';
      }
      values.split(',').forEach(function (value) {
        var condition = {};
        condition[key] = new OperatorValueParser().perform(model, key, value, params.timezone);
        conditions.push(condition);
      });
    });

    if (params.filterType) { where['$' + params.filterType] = conditions; }

    return where;
  }

  function getSelect() {
    if (!fieldNamesRequested) { return null; }

    var fieldsSchema = _.select(schema.fields, function (field) {
      return !field.reference && !field.isVirtual;
    });
    var fieldNamesSchema = _.map(fieldsSchema, 'field');

    return _.intersection(fieldNamesSchema, fieldNamesRequested);
  }

  function getWhere() {
    var where = { $and: [] };

    if (params.search) {
      where.$and.push(handleSearchParam());
    }

    if (params.filter) {
      where.$and.push(handleFilterParams());
    }

    if (segment && segment.where) {
      where.$and.push(segment.where);
    }

    return where;
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

  function getIncludes() {
    var includes = [];
    _.values(model.associations).forEach(function (association) {
      if (!fieldNamesRequested ||
        (fieldNamesRequested.indexOf(association.as) !== -1)) {
        if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
          includes.push({
            model: association.target,
            as: association.associationAccessor
          });
        }
      }
    });

    return includes;
  }

  function getOrder() {
    if (params.sort) {
      var order = 'ASC';

      if (params.sort[0] === '-') {
        params.sort = params.sort.substring(1);
        order = 'DESC';
      }

      if (params.sort.indexOf('.') !== -1) {
        // NOTICE: Sort on the belongsTo displayed field
        return [[opts.sequelize.literal(params.sort), order]];
      } else {
        return [[params.sort, order]];
      }
    }

    return [];
  }

  function getRecords() {
    var findAllOpts = {
      attributes: getSelect(),
      include: getIncludes(),
      limit: getLimit(),
      offset: getSkip(),
      where: getWhere(),
      order: getOrder()
    };

    if (params.search) {
      _.each(schema.fields, function (field) {
        if (field.search) {
          field.search(findAllOpts, params.search);
        }
      });
    }

    if (segment && segment.scope) {
      return model.scope(segment.scope).findAll(findAllOpts);
    } else {
      return model.unscoped().findAll(findAllOpts);
    }
  }

  function getCount() {
    var countOpts = {
      include: getIncludes(),
      where: getWhere()
    };

    if (params.search) {
      _.each(schema.fields, function (field) {
        if (field.search) {
          field.search(countOpts, params.search);
        }
      });
    }

    if (segment && segment.scope) {
      return model.scope(segment.scope).count(countOpts);
    } else {
      return model.unscoped().count(countOpts);
    }
  }

  function getSegment() {
    if (schema.segments && params.segment) {
      segment = _.find(schema.segments, function (segment) {
        return segment.name === params.segment;
      });
    }
  }

  function getSegmentCondition() {
    if (segment && segment.where && typeof segment.where === 'function') {
      return segment.where(params)
        .then(function (where) {
          segment.where = where;
          return;
        });
    } else {
      return new P(function (resolve) { return resolve(); });
    }
  }

  this.perform = function () {
    getSegment();

    return getSegmentCondition()
      .then(getRecords)
      .then(function (records) {
        return getCount()
          .then(function (count) {
            return [count, records];
          });
      });
  };
}

module.exports = ResourcesGetter;
