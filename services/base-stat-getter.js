'use strict';
var _ = require('lodash');
var Interface = require('forest-express');
var OperatorValueParser = require('./operator-value-parser');

function BaseStatGetter(model, params) {
  this.model = model;
  this.params = params;

  this.getFilters = function () {
    var where = {};
    var conditions = [];
    var model = this.model;
    var params = this.params;

    if (params.filters) {
      params.filters.forEach(function (filter) {
        var field = filter.field;
        if (field.indexOf(':') !== -1) {
          var fieldSplited = field.split(':');
          var associationSchema = Interface.Schemas.schemas[fieldSplited[0]];
          var associationField = _.findWhere(associationSchema.fields, {
            field: fieldSplited[1]
          });
          field = '$' + associationSchema.name + '.' + associationField.columnName + '$';
        }

        var condition = {};
        condition[field] = new OperatorValueParser().perform(model,
          filter.field, filter.value, params.timezone);
        conditions.push(condition);
      });
    }

    if (params.filterType) {
      where['$' + params.filterType] = conditions;
    }
    return where;
  };
}

module.exports = BaseStatGetter;
