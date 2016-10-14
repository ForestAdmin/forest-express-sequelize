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

  var PERIODS_FROM_NOW = 'fromNow';
  var PERIODS_TODAY = 'today';
  var PERIODS_LAST_X_DAYS = /^last(\d+)days$/;

  var PERIODS_VALUES = {
    days: 'day',
    weeks: 'isoWeek',
    months: 'month',
    years: 'year'
  };

  this.isIntervalDateValue = function () {
    if (PERIODS[value]) { return true; }

    if ([PERIODS_FROM_NOW, PERIODS_TODAY].indexOf(value) !== -1) {
      return true;
    }

    var match = value.match(PERIODS_LAST_X_DAYS);
    if (match && match[1]) { return true; }

    return false;
  };

  this.hasPreviousInterval = function () {
    if (PERIODS[value]) { return true; }

    if (value === PERIODS_TODAY) { return true; }

    var match = value.match(PERIODS_LAST_X_DAYS);
    if (match && match[1]) { return true; }

    return false;
  };

  this.getIntervalDateFilter = function () {
    if (!this.isIntervalDateValue()) { return; }

    if (value === PERIODS_FROM_NOW) {
      return { $gte: moment().toDate() };
    }

    if (value === PERIODS_TODAY) {
      return {
        $gte: moment().startOf('day').toDate(),
        $lte: moment().endOf('day').toDate()
      };
    }

    var match = value.match(PERIODS_LAST_X_DAYS);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1], 'days').startOf('day').toDate(),
        $lte: moment().subtract(1, 'days').endOf('day').toDate()
      };
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
    if (!this.hasPreviousInterval()) { return; }

    if (value === PERIODS_TODAY) {
      return {
        $gte: moment().subtract(1, 'days').startOf('day').toDate(),
        $lte: moment().subtract(1, 'days').endOf('day').toDate()
      };
    }

    var match = value.match(PERIODS_LAST_X_DAYS);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1] * 2, 'days').startOf('day').toDate(),
        $lte: moment().subtract(match[1], 'days').endOf('day').toDate()
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
