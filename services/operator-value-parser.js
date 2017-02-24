'use strict';
var _ = require('lodash');
var OperatorDateIntervalParser = require('./operator-date-interval-parser');
var Interface = require('forest-express');

function OperatorValueParser() {
  this.perform = function (model, fieldName, value, timezone) {
    var operatorDateIntervalParser = new OperatorDateIntervalParser(value, timezone);

    // NOTICE: Handle boolean for MySQL database
    var modelName, field, fieldSplit, valueBoolean;
    if (fieldName.indexOf(':') === -1) {
      modelName = model.name;
    } else {
      fieldSplit = fieldName.split(':');
      modelName = fieldSplit[0];
      fieldName = fieldSplit[1];
    }

    var schema = Interface.Schemas.schemas[modelName];
    if (schema) {
      field = _.findWhere(schema.fields, { field: fieldName });

      if (field && field.type === 'Boolean') {
        valueBoolean = value.indexOf('true') > -1 ? true : false;
      }
    }

    if (value[0] === '!') {
      value = value.substring(1);
      return { $ne: valueBoolean || value };
    } else if (value[0] === '>') {
      value = value.substring(1);
      return { $gt: value };
    } else if (value[0] === '<') {
      value = value.substring(1);
      return { $lt: value };
    } else if (value[0] === '*' && value[value.length - 1] === '*') {
      value = value.substring(1, value.length - 1);
      return { $like: '%' + value + '%' };
    } else if (value[0] === '*') {
      value = value.substring(1);
      return { $like: '%' + value };
    } else if (value[value.length - 1] === '*') {
      value = value.substring(0, value.length - 1);
      return { $like: value + '%' };
    } else if (value === '$present') {
      return { $ne: null };
    } else if (value === '$blank') {
      return null;
    } else if (operatorDateIntervalParser.isIntervalDateValue()) {
      return operatorDateIntervalParser.getIntervalDateFilter();
    } else {
      return valueBoolean || value;
    }

    return;
  };
}

module.exports = OperatorValueParser;
