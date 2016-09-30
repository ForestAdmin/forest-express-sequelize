'use strict';
var _ = require('lodash');
var OperatorValueParser = require('./operator-value-parser');
var Interface = require('forest-express');

function ResourcesGetter(model, opts, params) {
  var schema = Interface.Schemas.schemas[model.name];

  function handleSearchParam() {
    var where = {};
    var or = [];

    _.each(schema.fields, function (field) {
      // Ignore Smart field.
      if (field.isVirtual) { return; }

      // Ignore integration field.
      if (field.integration) { return; }

      var q = {};

      if (field.field === schema.idField) {
        if (field.type === 'Number') {
          q[field.field] = parseInt(params.search, 10) || 0;
        } else {
          q[field.field] = params.search;
        }
      } else if (field.type === 'Enum') {
        var enumSearch = _.capitalize(params.search.toLowerCase());

        if (field.enums.indexOf(enumSearch) > -1) {
          q[field.field] = enumSearch;
        }
      } else if (field.type === 'String') {
        q = opts.sequelize.where(
          opts.sequelize.fn('lower', opts.sequelize.col(schema.name + '.' +
            field.field)),
          ' LIKE ',
          opts.sequelize.fn('lower', '%' + params.search + '%')
        );
      }

      or.push(q);
    });

    _.each(model.associations, function (association) {
      if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
        let fieldsAssociation = Interface.Schemas
          .schemas[association.target.name].fields;
        _.each(fieldsAssociation, function(field) {
          if (field.integration || field.isSearchable === false) { return; }

          var q = {};
          if (field.type === 'String') {
            q = opts.sequelize.where(
              opts.sequelize.fn('lower', opts.sequelize.col(
                association.associationAccessor + '.' + field.field)),
              ' LIKE ',
              opts.sequelize.fn('lower', '%' + params.search + '%')
            );
            or.push(q);
          }
        });
      }
    });

    where.$or = or;
    return where;
  }

  function handleFilterParams() {
    var where = {};
    var conditions = [];

    _.each(params.filter, function (value, key) {
      if (key.indexOf(':') !== -1) {
        key = '$' + key.replace(':', '.') + '$';
      }

      value.split(',').forEach(function (v) {
        var q = {};
        q[key] = new OperatorValueParser().perform(model, key, v);
        conditions.push(q);
      });
    });

    if (params.filterType) { where['$' + params.filterType] = conditions; }

    return where;
  }

  function getWhere() {
    var where = {};

    if (params.search) {
      where = _.extend(where, handleSearchParam());
    }

    if (params.filter) {
      where = _.extend(where, handleFilterParams());
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
      if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
        includes.push({
          model: association.target,
          as: association.associationAccessor
        });
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


      return [[params.sort, order]];
    }

    return [];
  }

  function getRecords() {
    return model
      .findAll({
        include: getIncludes(),
        limit: getLimit(),
        offset: getSkip(),
        where: getWhere(),
        order: getOrder()
      });
  }

  function getCount() {
    return model
      .count({
        include: getIncludes(),
        where: getWhere()
      });
  }

  this.perform = function () {
    return getRecords()
      .then((records) => {
        return getCount()
          .then((count) => [count, records]);
      });
  };
}

module.exports = ResourcesGetter;
