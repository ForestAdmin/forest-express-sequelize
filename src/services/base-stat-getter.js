'use strict';
var _ = require('lodash');
var Operators = require('../utils/operators');
var Interface = require('forest-express');
var OperatorValueParser = require('./operator-value-parser');

function BaseStatGetter(model, params, options) {
  this.model = model;
  this.params = params;

  var OPERATORS = new Operators(options);

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

          if (associationSchema) {
            var associationField = _.find(associationSchema.fields,
              function (field) { return field.field === fieldSplited[1]; });
            field = '$' + associationSchema.name + '.' + associationField.columnName + '$';
          } else {
            // NOTICE: If the associationSchema is not found, try to set the field with the "raw"
            //         filter field value.
            field = '$' + field.replace(':', '.') + '$';
          }
        }

        var condition = {};
        condition[field] = new OperatorValueParser(options).perform(model,
          filter.field, filter.value, params.timezone);
        conditions.push(condition);
      });
    }

    if (params.filterType) {
      where[OPERATORS[params.filterType.toUpperCase()]] = conditions;
    }
    return where;
  };
}

module.exports = BaseStatGetter;
