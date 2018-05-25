'use strict';
/* jshint sub: true */
var _ = require('lodash');
var P = require('bluebird');
var moment = require('moment');
var orm = require('../utils/orm');
var BaseStatGetter = require('./base-stat-getter');
var Database = require('../utils/database');
var Interface = require('forest-express');

// NOTICE: These aliases are not camelcased to prevent issues with Sequelize.
var ALIAS_GROUP_BY = 'forest_alias_groupby';
var ALIAS_AGGREGATE = 'forest_alias_aggregate';

function PieStatGetter(model, params, opts) {
  BaseStatGetter.call(this, model, params, opts);

  var needsDateOnlyFormating = orm.isVersionLessThan4(opts.sequelize);

  var schema = Interface.Schemas.schemas[model.name];
  var associationSplit,associationCollection, associationField,
      associationSchema, field;

  if (params['group_by_field'].indexOf(':') === -1) {
    field = _.find(schema.fields, function (field) {
      return field.field === params['group_by_field'];
    });
  } else {
    associationSplit = params['group_by_field'].split(':');
    associationCollection = associationSplit[0];
    associationField = associationSplit[1];
    associationSchema = Interface.Schemas.schemas[associationCollection];
    field = _.find(associationSchema.fields, function (field) {
      return field.field === associationField;
    });
  }

  function getGroupByField() {
    if (params['group_by_field'].indexOf(':') === -1) {
      return schema.name + '.' + params['group_by_field'];
    } else {
      return params['group_by_field'].replace(':', '.');
    }
  }

  var groupByField = getGroupByField();

  function getAggregate() {
    return params.aggregate.toLowerCase();
  }

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName
    //         cannot be '*'.
    var fieldName = params['aggregate_field'] || schema.primaryKeys[0] ||
      schema.fields[0].field;
    return schema.name + '.' + fieldName;
  }

  function getIncludes() {
    var includes = [];
    _.values(model.associations).forEach(function (association) {
      if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
        includes.push({
          model: association.target.unscoped(),
          as: association.associationAccessor,
          attributes: []
        });
      }
    });

    return includes;
  }

  function getGroupBy() {
    return Database.isMSSQL(opts) ? [opts.sequelize.col(groupByField)] :
      [ALIAS_GROUP_BY];
  }

  function formatResults (records) {
    return P.map(records, function (record) {
      var key;

      if (field.type === 'Date') {
        key = moment(record[ALIAS_GROUP_BY]).format('DD/MM/YYYY HH:mm:ss');
      } else if (field.type === 'Dateonly' && needsDateOnlyFormating) {
        var offsetServer = moment().utcOffset() / 60;
        var dateonly = moment.utc(record[ALIAS_GROUP_BY])
          .add(offsetServer, 'h');
        key = dateonly.format('DD/MM/YYYY');
      } else {
        key = String(record[ALIAS_GROUP_BY]);
      }

      return {
        key: key,
        value: record[ALIAS_AGGREGATE]
      };
    });
  }

  this.perform = function () {
    return model.unscoped().findAll({
      attributes: [
        [
          opts.sequelize.col(groupByField),
          ALIAS_GROUP_BY
        ],
        [
          opts.sequelize.fn(getAggregate(),
          opts.sequelize.col(getAggregateField())),
          ALIAS_AGGREGATE
        ]
      ],
      include: getIncludes(),
      where: this.getFilters(),
      group: getGroupBy(),
      order: [[opts.sequelize.literal(ALIAS_AGGREGATE), 'DESC']],
      raw: true
    })
    .then(formatResults)
    .then(function (records) {
      return { value: records };
    });
  };
}

module.exports = PieStatGetter;
