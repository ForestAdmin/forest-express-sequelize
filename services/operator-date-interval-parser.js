'use strict';
var Operators = require('../utils/operators');
var moment = require('moment-timezone');

function OperatorDateIntervalParser(value, timezone, options) {
  var OPERATORS = new Operators(options);

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

  var offsetClient = parseInt(moment().tz(timezone).format('Z'), 10);
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

    var condition = {};
    if (value === PERIODS_PAST) {
      condition[OPERATORS.LTE] = moment().toDate();
      return condition;
    }

    if (value === PERIODS_FUTURE) {
      condition[OPERATORS.GTE] = moment().toDate();
      return condition;
    }

    if (value === PERIODS_TODAY) {
      condition[OPERATORS.GTE] = moment().startOf('day').add(offsetHours, 'h').toDate();
      condition[OPERATORS.LTE] = moment().endOf('day').add(offsetHours, 'h').toDate();
      return condition;
    }

    var match = value.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) {
      condition[OPERATORS.GTE] = moment().subtract(match[1], 'days').startOf('day')
        .add(offsetHours, 'h').toDate();
      condition[OPERATORS.LTE] = moment().subtract(1, 'days').endOf('day')
        .add(offsetHours, 'h').toDate();
      return condition;
    }

    match = value.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) {
      condition[OPERATORS.GTE] = moment().subtract(match[1] - 1, 'days').startOf('day')
        .add(offsetHours, 'h').toDate();
      condition[OPERATORS.LTE] = moment().toDate();
      return condition;
    }

    match = value.match(PERIODS_X_HOURS_BEFORE);
    if (match && match[1]) {
      condition[OPERATORS.LTE] = moment().subtract(match[1], 'hours')
        .add(offsetHours, 'h').toDate();
      return condition;
    }

    var duration = PERIODS[value].duration;
    var period = PERIODS[value].period;
    var periodValue = PERIODS_VALUES[period];
    var toDate = PERIODS[value].toDate;

    if (toDate) {
      condition[OPERATORS.GTE] = moment().startOf(periodValue).add(offsetHours, 'h').toDate();
      condition[OPERATORS.LTE] = moment().toDate();
      return condition;
    } else {
      condition[OPERATORS.GTE] = moment().subtract(duration, period)
        .startOf(periodValue).add(offsetHours, 'h').toDate();
      condition[OPERATORS.LTE] = moment().subtract(1, period)
        .endOf(periodValue).add(offsetHours, 'h').toDate();
      return condition;
    }
  };

  this.getIntervalDateFilterForPreviousInterval = function () {
    if (!this.hasPreviousInterval()) { return; }

    var condition = {};
    if (value === PERIODS_TODAY) {
      condition[OPERATORS.GTE] = moment().subtract(1, 'days').startOf('day')
        .add(offsetHours, 'h').toDate();
      condition[OPERATORS.LTE] = moment().subtract(1, 'days').endOf('day')
        .add(offsetHours, 'h').toDate();
      return condition;
    }

    var match = value.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) {
      condition[OPERATORS.GTE] = moment().subtract(match[1] * 2, 'days').startOf('day')
        .add(offsetHours, 'h').toDate();
      condition[OPERATORS.LTE] = moment().subtract(parseInt(match[1], 10) + 1, 'days')
        .endOf('day').add(offsetHours, 'h').toDate();
      return condition;
    }

    match = value.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) {
      condition[OPERATORS.GTE] = moment().subtract((match[1] * 2) - 1, 'days')
        .startOf('day').add(offsetHours, 'h').toDate();
      condition[OPERATORS.LTE] = moment().subtract(match[1], 'days')
        .add(offsetHours, 'h').toDate();
      return condition;
    }

    var duration = PERIODS[value].duration;
    var period = PERIODS[value].period;
    var periodValue = PERIODS_VALUES[period];
    var toDate = PERIODS[value].toDate;

    if (toDate) {
      condition[OPERATORS.GTE] = moment().subtract(duration, period)
        .startOf(periodValue).add(offsetHours, 'h').toDate();
      condition[OPERATORS.LTE] = moment().subtract(duration, period)
        .add(offsetHours, 'h').toDate();
      return condition;
    } else {
      condition[OPERATORS.GTE] = moment().subtract(duration * 2, period)
        .startOf(periodValue).add(offsetHours, 'h').toDate();
      condition[OPERATORS.LTE] = moment().subtract(1 + duration, period)
        .endOf(periodValue).add(offsetHours, 'h').toDate();
      return condition;
    }
  };
}

module.exports = OperatorDateIntervalParser;
