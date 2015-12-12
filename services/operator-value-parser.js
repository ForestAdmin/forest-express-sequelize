'use strict';
var moment = require('moment');

function OperatorValueParser() {
  this.perform = function (model, fieldName, value) {
    var ret = null;

    function getValue() {
      switch (value) {
        case 'yesterday':
          return moment().subtract(1, 'days').toDate();
        case 'lastWeek':
          return moment().subtract(1, 'weeks').toDate();
        case 'last2Weeks':
          return moment().subtract(2, 'weeks').toDate();
        case 'lastMonth':
          return moment().subtract(1, 'months').toDate();
        case 'last3Months':
          return moment().subtract(3, 'months').toDate();
        case 'lastYear':
          return moment().subtract(1, 'years').toDate();
        default:
          return value;
      }
    }

    if (value[0] === '!') {
      value = value.substring(1);
      ret = { $ne: getValue() };
    } else if (value[0] === '>') {
      value = value.substring(1);
      ret = { $gt: getValue() };
    } else if (value[0] === '<') {
      value = value.substring(1);
      ret = { $lt: getValue() };
    } else if (value[0] === '*' && value[value.length - 1] === '*') {
      value = value.substring(1, value.length - 1);
      ret = { $like: '%' + getValue() + '%' };
    } else if (value[0] === '*') {
      value = value.substring(1);
      ret = { $like: '%' + getValue() };
    } else if (value[value.length - 1] === '*') {
      value = value.substring(1);
      ret = { $like: getValue() + '%' };
    } else if (value === '$present') {
      ret = { $ne: null };
    } else if (value === '$blank') {
      ret = null;
    } else {
      ret = getValue();
    }

    return ret;
  };
}

module.exports = OperatorValueParser;
