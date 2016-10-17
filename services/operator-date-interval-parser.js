'use strict';
var moment = require('moment');

function OperatorDateIntervalParser(value) {
  // NOTICE: Manage retrocompatibility
  // TODO: Remove once new filter protocol is live
  if (value && value[0] !== '$') {
    value = value.substring(1);
  }

  var PERIODS = {
    yesterday: { duration: 1, period: 'days' }, // TODO: Remove once new filter protocol is live
    lastWeek: { duration: 1, period: 'weeks' }, // TODO: Remove once new filter protocol is live
    last2Weeks: { duration: 2, period: 'weeks' }, // TODO: Remove once new filter protocol is live
    lastMonth: { duration: 1, period: 'months' }, // TODO: Remove once new filter protocol is live
    last3Months: { duration: 3, period: 'months' }, // TODO: Remove once new filter protocol is live
    lastYear: { duration: 1, period: 'years' }, // TODO: Remove once new filter protocol is live
    $yesterday: { duration: 1, period: 'days' },
    $previousWeek: { duration: 1, period: 'weeks' },
    $previousMonth: { duration: 1, period: 'months' },
    $previousQuarter: { duration: 1, period: 'quarters' },
    $previousYear: { duration: 1, period: 'years' },
    $weekToDate: { duration: 1, period: 'weeks', toDate: true },
    $monthToDate: { duration: 1, period: 'months', toDate: true },
    $quarterToDate: { duration: 1, period: 'quarters', toDate: true },
    $yearToDate: { duration: 1, period: 'years', toDate: true }
  };

  var PERIODS_FROM_NOW = 'fromNow'; // TODO: Remove once new filter protocol is live
  var PERIODS_PAST = '$past';
  var PERIODS_FUTURE = '$future';
  var PERIODS_TODAY_DEPRECATED = 'today'; // TODO: Remove once new filter protocol is live
  var PERIODS_TODAY = '$today';
  var PERIODS_LAST_X_DAYS = /^last(\d+)days$/; // TODO: Remove once new filter protocol is live
  var PERIODS_PREVIOUS_X_DAYS = /^\$previous(\d+)Days$/;
  var PERIODS_X_DAYS_TO_DATE = /^\$(\d+)DaysToDate$/;

  var PERIODS_VALUES = {
    days: 'day',
    weeks: 'isoWeek',
    months: 'month',
    quarters: 'quarter',
    years: 'year'
  };

  this.isIntervalDateValue = function () {
    if (PERIODS[value]) { return true; }

    // TODO: Remove once new filter protocol is live
    if ([PERIODS_FROM_NOW, PERIODS_TODAY_DEPRECATED].indexOf(value) !== -1) {
      return true;
    }

    if ([PERIODS_PAST, PERIODS_FUTURE, PERIODS_TODAY].indexOf(value) !== -1) {
      return true;
    }

    // TODO: Remove once new filter protocol is live
    var match = value.match(PERIODS_LAST_X_DAYS);
    if (match && match[1]) { return true; }

    match = value.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) { return true; }

    match = value.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) { return true; }

    return false;
  };

  this.hasPreviousInterval = function () {
    if (PERIODS[value]) { return true; }

    // TODO: Remove once new filter protocol is live
    if (value === PERIODS_TODAY_DEPRECATED) { return true; }

    if (value === PERIODS_TODAY) { return true; }

    // TODO: Remove once new filter protocol is live
    var match = value.match(PERIODS_LAST_X_DAYS);
    if (match && match[1]) { return true; }

    match = value.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) { return true; }

    match = value.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) { return true; }

    return false;
  };

  this.getIntervalDateFilter = function () {
    if (!this.isIntervalDateValue()) { return; }

    // TODO: Remove once new filter protocol is live
    if (value === PERIODS_FROM_NOW) {
      return { $gte: moment().toDate() };
    }

    if (value === PERIODS_PAST) {
      return { $lte: moment().toDate() };
    }

    if (value === PERIODS_FUTURE) {
      return { $gte: moment().toDate() };
    }

    // TODO: Remove once new filter protocol is live
    if (value === PERIODS_TODAY_DEPRECATED) {
      return {
        $gte: moment().startOf('day').toDate(),
        $lte: moment().endOf('day').toDate()
      };
    }

    if (value === PERIODS_TODAY) {
      return {
        $gte: moment().startOf('day').toDate(),
        $lte: moment().endOf('day').toDate()
      };
    }

    // TODO: Remove once new filter protocol is live
    var match = value.match(PERIODS_LAST_X_DAYS);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1], 'days').startOf('day').toDate(),
        $lte: moment().subtract(1, 'days').endOf('day').toDate()
      };
    }

    match = value.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1], 'days').startOf('day').toDate(),
        $lte: moment().subtract(1, 'days').endOf('day').toDate()
      };
    }

    match = value.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1] - 1, 'days').startOf('day').toDate(),
        $lte: moment().toDate()
      };
    }

    var duration = PERIODS[value].duration;
    var period = PERIODS[value].period;
    var periodValue = PERIODS_VALUES[period];
    var toDate = PERIODS[value].toDate;

    if (toDate) {
      return {
        $gte: moment().startOf(periodValue).toDate(),
        $lte: moment().toDate()
      };
    } else {
      return {
        $gte: moment().subtract(duration, period).startOf(periodValue).toDate(),
        $lte: moment().subtract(1, period).endOf(periodValue).toDate()
      };
    }
  };

  this.getIntervalDateFilterForPreviousInterval = function () {
    if (!this.hasPreviousInterval()) { return; }

    // TODO: Remove once new filter protocol is live
    if (value === PERIODS_TODAY_DEPRECATED) {
      return {
        $gte: moment().subtract(1, 'days').startOf('day').toDate(),
        $lte: moment().subtract(1, 'days').endOf('day').toDate()
      };
    }

    if (value === PERIODS_TODAY) {
      return {
        $gte: moment().subtract(1, 'days').startOf('day').toDate(),
        $lte: moment().subtract(1, 'days').endOf('day').toDate()
      };
    }

    // TODO: Remove once new filter protocol is live
    var match = value.match(PERIODS_LAST_X_DAYS);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1] * 2, 'days').startOf('day').toDate(),
        $lte: moment().subtract(parseInt(match[1], 10) + 1, 'days')
                .endOf('day').toDate()
      };
    }

    match = value.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1] * 2, 'days').startOf('day').toDate(),
        $lte: moment().subtract(parseInt(match[1], 10) + 1, 'days')
                .endOf('day').toDate()
      };
    }

    match = value.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) {
      return {
        $gte: moment().subtract((match[1] * 2) - 1, 'days').startOf('day').toDate(),
        $lte: moment().subtract(match[1], 'days').toDate()
      };
    }

    var duration = PERIODS[value].duration;
    var period = PERIODS[value].period;
    var periodValue = PERIODS_VALUES[period];
    var toDate = PERIODS[value].toDate;

    if (toDate) {
      return {
        $gte: moment().subtract(duration, period).startOf(periodValue).toDate(),
        $lte: moment().subtract(duration, period).toDate()
      };
    } else {
      return {
        $gte: moment().subtract(duration * 2, period).startOf(periodValue).toDate(),
        $lte: moment().subtract(1 + duration, period).endOf(periodValue).toDate()
      };
    }
  };
}

module.exports = OperatorDateIntervalParser;
