'use strict';
var _ = require('lodash');
var OperatorValueParser = require('./operator-value-parser');
var Interface = require('forest-express');

function ResourcesGetter(model, opts, params) {
  var schema = Interface.Schemas.schemas[model.name];

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

  function getRecordsFromResult(result) {
    return result.map(function (r) {
      r = r.toJSON();

      // Ensure the Serializer set the relationship links on has many
      // relationships by setting them to an empty array.
      _.values(model.associations).forEach(function (association) {
        if (['HasMany', 'BelongsToMany'].indexOf(association.associationType) > -1) {
          r[association.associationAccessor] = [];
        }
      });

      return r;
    });
  }

  function getRecords() {
    return model
      .findAll({
        include: getIncludes(),
        limit: getLimit(),
        offset: getSkip(),
        where: getWhere(),
        order: getOrder()
      })
      .then((result) => getRecordsFromResult(result));
  }

  function getCount() {
    return model
      .count({
        include: getIncludes(),
        where: getWhere()
      });
  }

  function handleSearchParam() {
    var where = {};
    var or = [];

    _.each(schema.fields, function (field) {
      // Ignore Smart field.
      if (field.isVirtual) { return; }

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
    var and = [];

    _.each(params.filter, function (value, key) {
      var q = {};

      if (key.indexOf(':') !== -1) {
        key = '$' + key.replace(':', '.') + '$';
      }

      q[key] = new OperatorValueParser().perform(model, key, value);
      and.push(q);
    });

    where.$and = and;
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

  this.perform = function () {
    return getRecords()
      .then((records) => {
        return getCount()
          .then((count) => [count, records]);
      });
  };
}

module.exports = ResourcesGetter;
