'use strict';
var moment = require('moment');

function OperatorDateIntervalParser(value, timezone) {
  var PERIODS = {
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

  var PERIODS_PAST = '$past';
  var PERIODS_FUTURE = '$future';
  var PERIODS_TODAY = '$today';
  var PERIODS_PREVIOUS_X_DAYS = /^\$previous(\d+)Days$/;
  var PERIODS_X_DAYS_TO_DATE = /^\$(\d+)DaysToDate$/;
  var PERIODS_X_HOURS_BEFORE = /^\$(\d+)HoursBefore$/;

  var PERIODS_VALUES = {
    days: 'day',
    weeks: 'isoWeek',
    months: 'month',
    quarters: 'quarter',
    years: 'year'
  };

  var offsetClient = parseInt(timezone, 10);
  var offsetServer = moment().utcOffset() / 60;
  var offsetHours = offsetServer - offsetClient;

  this.isIntervalDateValue = function () {
    if (PERIODS[value]) { return true; }

    if ([PERIODS_PAST, PERIODS_FUTURE, PERIODS_TODAY].indexOf(value) !== -1) {
      return true;
    }

    var match = value.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) { return true; }

    match = value.match(PERIODS_X_HOURS_BEFORE);
    if (match && match[1]) { return true; }

    match = value.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) { return true; }

    return false;
  };

  this.hasPreviousInterval = function () {
    if (PERIODS[value]) { return true; }

    if (value === PERIODS_TODAY) { return true; }

    var match = value.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) { return true; }

    match = value.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) { return true; }

    return false;
  };

  this.getIntervalDateFilter = function () {
    if (!this.isIntervalDateValue()) { return; }

    if (value === PERIODS_PAST) {
      return { $lte: moment().toDate() };
    }

    if (value === PERIODS_FUTURE) {
      return { $gte: moment().toDate() };
    }

    if (value === PERIODS_TODAY) {
      return {
        $gte: moment().startOf('day').add(offsetHours, 'h').toDate(),
        $lte: moment().endOf('day').add(offsetHours, 'h').toDate()
      };
    }

    var match = value.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1], 'days').startOf('day')
                .add(offsetHours, 'h').toDate(),
        $lte: moment().subtract(1, 'days').endOf('day').add(offsetHours, 'h')
                .toDate()
      };
    }

    match = value.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1] - 1, 'days').startOf('day')
                .add(offsetHours, 'h').toDate(),
        $lte: moment().toDate()
      };
    }

    match = value.match(PERIODS_X_HOURS_BEFORE);
    if (match && match[1]) {
      return {
        $lte: moment().subtract(match[1], 'hours').add(offsetHours, 'h').toDate()
      };
    }

    var duration = PERIODS[value].duration;
    var period = PERIODS[value].period;
    var periodValue = PERIODS_VALUES[period];
    var toDate = PERIODS[value].toDate;

    if (toDate) {
      return {
        $gte: moment().startOf(periodValue).add(offsetHours, 'h').toDate(),
        $lte: moment().toDate()
      };
    } else {
      return {
        $gte: moment().subtract(duration, period).startOf(periodValue)
                .add(offsetHours, 'h').toDate(),
        $lte: moment().subtract(1, period).endOf(periodValue)
                .add(offsetHours, 'h').toDate()
      };
    }
  };

  this.getIntervalDateFilterForPreviousInterval = function () {
    if (!this.hasPreviousInterval()) { return; }

    if (value === PERIODS_TODAY) {
      return {
        $gte: moment().subtract(1, 'days').startOf('day')
                .add(offsetHours, 'h').toDate(),
        $lte: moment().subtract(1, 'days').endOf('day')
                .add(offsetHours, 'h').toDate()
      };
    }

    var match = value.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1] * 2, 'days').startOf('day')
                .add(offsetHours, 'h').toDate(),
        $lte: moment().subtract(parseInt(match[1], 10) + 1, 'days')
                .endOf('day').add(offsetHours, 'h').toDate()
      };
    }

    match = value.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) {
      return {
        $gte: moment().subtract((match[1] * 2) - 1, 'days').startOf('day')
                .add(offsetHours, 'h').toDate(),
        $lte: moment().subtract(match[1], 'days').add(offsetHours, 'h').toDate()
      };
    }

    var duration = PERIODS[value].duration;
    var period = PERIODS[value].period;
    var periodValue = PERIODS_VALUES[period];
    var toDate = PERIODS[value].toDate;

    if (toDate) {
      return {
        $gte: moment().subtract(duration, period).startOf(periodValue)
                .add(offsetHours, 'h').toDate(),
        $lte: moment().subtract(duration, period)
                .add(offsetHours, 'h').toDate()
      };
    } else {
      return {
        $gte: moment().subtract(duration * 2, period).startOf(periodValue)
                .add(offsetHours, 'h').toDate(),
        $lte: moment().subtract(1 + duration, period).endOf(periodValue)
                .add(offsetHours, 'h').toDate()
      };
    }
  };
}

module.exports = OperatorDateIntervalParser;
