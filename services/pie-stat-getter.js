'use strict';
/* jshint sub: true */
var _ = require('lodash');
var P = require('bluebird');
var moment = require('moment');
var OperatorValueParser = require('./operator-value-parser');
var Interface = require('forest-express');

function PieStatGetter(model, params, opts) {
  var schema = Interface.Schemas.schemas[model.name];
  var associationSplit,associationCollection, associationField,
      associationSchema, field;

  if (params['group_by_field'].indexOf(':') === -1) {
    field = _.findWhere(schema.fields, { field: params['group_by_field'] });
  } else {
    associationSplit = params['group_by_field'].split(':');
    associationCollection = associationSplit[0];
    associationField = associationSplit[1];
    associationSchema = Interface.Schemas.schemas[associationCollection];
    field = _.findWhere(associationSchema.fields, { field: associationField });
  }

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

  function getFilters() {
    var where = {};
    var conditions = [];

    if (params.filters) {
      params.filters.forEach(function (filter) {
        var field = filter.field;
        if (field.indexOf(':') !== -1) {
          var fieldSplited = field.split(':');
          var associationTableName = Interface.Schemas.schemas[fieldSplited[0]].name;
          field = '$' + associationTableName + '.' + fieldSplited[1] + '$';
        }

        var condition = {};
        condition[field] = new OperatorValueParser().perform(model,
          filter.field, filter.value, params.timezone);
        conditions.push(condition);
      });
    }

    if (params.filterType) { where['$' + params.filterType] = conditions; }
    return where;
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
    var groupByField;

    if (params['group_by_field'].indexOf(':') === -1) {
      groupByField = schema.name + '.' + params['group_by_field'];
    } else {
      groupByField = params['group_by_field'].replace(':', '.');
    }
    return [opts.sequelize.col(groupByField), 'piestatkey_'];
  }

  function formatResults (records) {
    return P.map(records, function (record) {
      var key;

      if (field.type === 'Date') {
        key = moment(record.piestatkey_).format('DD/MM/YYYY HH:mm:ss');
      } else if (field.type === 'Dateonly') {
        var offsetServer = moment().utcOffset() / 60;
        var dateonly = moment.utc(record.piestatkey_).add(offsetServer, 'h');
        key = dateonly.format('DD/MM/YYYY');
      } else {
        key = String(record.piestatkey_);
      }

      return {
        key: key,
        value: record.piestatvalue_
      };
    });
  }

  this.perform = function () {
    return model.unscoped().findAll({
      attributes: [
        getGroupBy(),
        [
          opts.sequelize.fn(getAggregate(),
          opts.sequelize.col(getAggregateField())),
          'piestatvalue_'
        ]
      ],
      include: getIncludes(),
      where: getFilters(),
      group: ['piestatkey_'],
      order: 'piestatvalue_ DESC',
      raw: true
    })
    .then(formatResults)
    .then(function (records) {
      return { value: records };
    });
  };
}

module.exports = PieStatGetter;
