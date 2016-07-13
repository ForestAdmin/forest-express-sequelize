'use strict';
var moment = require('moment');

function OperatorDateIntervalParser(value) {
  var PERIODS = {
    yesterday: { duration: 1, period: 'days' },
    lastWeek: { duration: 1, period: 'weeks' },
    last2Weeks: { duration: 2, period: 'weeks' },
    lastMonth: { duration: 1, period: 'months' },
    last3Months: { duration: 3, period: 'months' },
    lastYear: { duration: 1, period: 'years' }
  };

  var PERIODS_LAST_X_DAYS = /^last(\d+)days$/;

  var PERIODS_VALUES = {
    days: 'day',
    weeks: 'isoWeek',
    months: 'month',
    years: 'year'
  };

  this.isIntervalDateValue = function () {
    if (PERIODS[value]) { return true; }

    var match = value.match(PERIODS_LAST_X_DAYS);
    if (match && match[1]) { return true; }

    return false;
  };

  this.getIntervalDateFilter = function () {
    if (!this.isIntervalDateValue()) { return; }

    let match = value.match(PERIODS_LAST_X_DAYS);
    if (match && match[1]) {
      return { $gte: moment().subtract(match[1], 'days').toDate() };
    }

    var duration = PERIODS[value].duration;
    var period = PERIODS[value].period;
    var periodValue = PERIODS_VALUES[period];

    return {
      $gte: moment().subtract(duration, period).startOf(periodValue).toDate(),
      $lte: moment().subtract(1, period).endOf(periodValue).toDate()
    };
  };

  this.getIntervalDateFilterForPreviousInterval = function () {
    if (!this.isIntervalDateValue()) { return; }

    let match = value.match(PERIODS_LAST_X_DAYS);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1] * 2, 'days').toDate(),
        $lte: moment().subtract(match[1], 'days').toDate()
      };
    }

    var duration = PERIODS[value].duration;
    var period = PERIODS[value].period;
    var periodValue = PERIODS_VALUES[period];

    return {
      $gte: moment().subtract(duration * 2, period).startOf(periodValue).toDate(),
      $lte: moment().subtract(1 + duration, period).endOf(periodValue).toDate()
    };
  };
}

module.exports = OperatorDateIntervalParser;
