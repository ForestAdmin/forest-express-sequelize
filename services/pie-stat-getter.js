'use strict';
var _ = require('lodash');
var P = require('bluebird');
var OperatorValueParser = require('./operator-value-parser');
var Interface = require('forest-express');

// jshint sub: true
function PieStatGetter(model, params, opts) {
  var schema = Interface.Schemas.schemas[model.name];

  function getAggregate() {
    return params.aggregate.toLowerCase();
  }

  function getAggregateField() {
    var fieldName = params['aggregate_field'] || schema.idField;
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
        condition[field] = new OperatorValueParser(opts).perform(model,
          filter.field, filter.value);
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
          model: association.target,
          as: association.associationAccessor,
          attributes: []
        });
      }
    });

    return includes;
  }

  function getGroupBy() {
    var groupByField = params['group_by_field'].replace(':', '.');
    return [opts.sequelize.col(groupByField), 'key'];
  }

  function formatResults (records) {
    return P.map(records, function (record) {
      return {
        key: String(record.key),
        value: record.value
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
          'value'
        ]
      ],
      include: getIncludes(),
      where: getFilters(),
      group: ['key'],
      order: 'value DESC',
      raw: true
    })
    .then(formatResults)
    .then(function (records) {
      return { value: records };
    });
  };
}

module.exports = PieStatGetter;
