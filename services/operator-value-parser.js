'use strict';
var OperatorDateIntervalParser = require('./operator-date-interval-parser');

function OperatorValueParser() {
  this.perform = function (model, fieldName, value) {
    var operatorDateIntervalParser = new OperatorDateIntervalParser(value.substring(1));

    if (value[0] === '!') {
      value = value.substring(1);
      return { $ne: value };
    } else if (value[0] === '>') {
      value = value.substring(1);

      if (operatorDateIntervalParser.isIntervalDateValue()) {
        return operatorDateIntervalParser.getIntervalDateFilter();
      } else {
        return { $gt: value };
      }
    } else if (value[0] === '<') {
      value = value.substring(1);

      if (operatorDateIntervalParser.isIntervalDateValue()) {
        return operatorDateIntervalParser.getIntervalDateFilter();
      } else {
        return { $lt: value };
      }
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
    } else {
      return value;
    }

    return;
  };
}

module.exports = OperatorValueParser;
