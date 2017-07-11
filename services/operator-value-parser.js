'use strict';
var _ = require('lodash');
var OperatorDateIntervalParser = require('./operator-date-interval-parser');
var Interface = require('forest-express');

function OperatorValueParser() {
  this.perform = function (model, fieldName, value, timezone) {
    var operatorDateIntervalParser = new OperatorDateIntervalParser(value,
      timezone);

    // NOTICE: Handle boolean for MySQL database
    var modelName, field, fieldSplit, valueBoolean;
    var fieldBoolean = false;
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
        fieldBoolean = true;
        if (value.indexOf('true') > -1) {
          valueBoolean = true;
        } else if (value.indexOf('false') > -1) {
          valueBoolean = false;
        }
      }
    }

    if (value[0] === '!' && value[1] !== '*') {
      value = value.substring(1);
      if (fieldBoolean) {
        return { $ne: _.isUndefined(valueBoolean) ? null : valueBoolean };
      } else {
        return { $ne: value };
      }
    } else if (value[0] === '>') {
      value = value.substring(1);
      return { $gt: value };
    } else if (value[0] === '<') {
      value = value.substring(1);
      return { $lt: value };
    } else if (value[0] === '*' && value[value.length - 1] === '*') {
      value = value.substring(1, value.length - 1);
      return { $like: '%' + value + '%' };
    } else if (value[0] === '!' && value[1] === '*' &&
      value[value.length - 1] === '*') {
      value = value.substring(2, value.length - 1);
      return { $notLike: '%' + value + '%' };
      // TODO : Include null values
      // return { $or: { $notLike: '%' + value + '%', $eq: null } };
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
      if (fieldBoolean) {
        return _.isUndefined(valueBoolean) ? { $eq: null } : valueBoolean;
      } else {
        return value;
      }
    }
  };
}

module.exports = OperatorValueParser;
