'use strict';
var moment = require('moment');

function OperatorValueParser() {
  this.perform = function (model, fieldName, value) {
    var ret = null;

    function isIntervalDateValue(value) {
      return ['yesterday', 'lastWeek', 'last2Weeks', 'lastMonth',
        'last3Months', 'lastYear'].indexOf(value) > -1;
    }

    function getIntervalDateValue(value) {
      var from = null;
      var to = null;

      switch (value) {
        case 'yesterday':
          from = moment().subtract(1, 'days').startOf('day').toDate();
          to = moment().subtract(1, 'days').endOf('day').toDate();
          break;
        case 'lastWeek':
          from = moment().subtract(1, 'weeks').startOf('isoWeek').toDate();
          to = moment().subtract(1, 'weeks').endOf('isoWeek').toDate();
          break;
        case 'last2Weeks':
          from = moment().subtract(2, 'weeks').startOf('isoWeek').toDate();
          to = moment().subtract(1, 'weeks').endOf('isoWeek').toDate();
          break;
        case 'lastMonth':
          from = moment().subtract(1, 'months').startOf('month').toDate();
          to = moment().subtract(1, 'months').endOf('month').toDate();
          break;
        case 'last3Months':
          from = moment().subtract(3, 'months').startOf('month').toDate();
          to = moment().subtract(1, 'months').endOf('month').toDate();
          break;
        case 'lastYear':
          from = moment().subtract(1, 'years').startOf('year').toDate();
          to = moment().subtract(1, 'years').endOf('year').toDate();
          break;
      }

      return { $gte: from, $lte: to };
    }

    if (value[0] === '!') {
      value = value.substring(1);
      ret = { $ne: value };
    } else if (value[0] === '>') {
      value = value.substring(1);

      if (isIntervalDateValue(value)) {
        ret = getIntervalDateValue(value);
      } else {
        ret = { $gt: value };
      }
    } else if (value[0] === '<') {
      value = value.substring(1);

      if (isIntervalDateValue(value)) {
        ret = getIntervalDateValue(value);
      } else {
        ret = { $lt: value };
      }
    } else if (value[0] === '*' && value[value.length - 1] === '*') {
      value = value.substring(1, value.length - 1);
      ret = { $like: '%' + value + '%' };
    } else if (value[0] === '*') {
      value = value.substring(1);
      ret = { $like: '%' + value };
    } else if (value[value.length - 1] === '*') {
      value = value.substring(1);
      ret = { $like: value + '%' };
    } else if (value === '$present') {
      ret = { $ne: null };
    } else if (value === '$blank') {
      ret = null;
    } else {
      ret = value;
    }

    return ret;
  };
}

module.exports = OperatorValueParser;
