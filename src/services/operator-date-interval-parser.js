import moment from 'moment-timezone';
import Operators from '../utils/operators';
import { NoMatchingOperatorError } from './errors';

const PERIODS = {
  yesterday: 'days',
  previous_week: 'weeks',
  previous_week_to_date: 'weeks',
  previous_month: 'months',
  previous_month_to_date: 'months',
  previous_quarter: 'quarters',
  previous_quarter_to_date: 'quarters',
  previous_year: 'years',
  previous_year_to_date: 'years',
};

const PERIODS_VALUES = {
  days: 'day',
  weeks: 'isoWeek',
  months: 'month',
  quarters: 'quarter',
  years: 'year',
};

const DATE_OPERATORS_HAVING_PREVIOUS_INTERVAL = [
  'today',
  'yesterday',
  'previous_week',
  'previous_month',
  'previous_quarter',
  'previous_year',
  'previous_week_to_date',
  'previous_month_to_date',
  'previous_quarter_to_date',
  'previous_year_to_date',
  'previous_x_days',
  'previous_x_days_to_date',
];

const DATE_OPERATORS = [
  ...DATE_OPERATORS_HAVING_PREVIOUS_INTERVAL,
  'past',
  'future',
  'before_x_hours_ago',
  'after_x_hours_ago',
];

function OperatorDateIntervalParser(timezone, options) {
  const offsetClient = Number.parseInt(moment().tz(timezone).format('Z'), 10);
  const offsetServer = moment().utcOffset() / 60;

  this.offsetHours = offsetServer - offsetClient;
  this.OPERATORS = new Operators(options);

  this.toDateWithTimezone = customMoment => customMoment.add(this.offsetHours, 'h').toDate();

  this.isDateIntervalOperator = operator => DATE_OPERATORS.includes(operator);

  this.hasPreviousDateInterval = operator => DATE_OPERATORS_HAVING_PREVIOUS_INTERVAL
    .includes(operator);

  this.getDateIntervalFilter = (operator, value) => {
    value = Number.parseInt(value, 10);

    switch (operator) {
      case 'today':
        return {
          [this.OPERATORS.GTE]: this.toDateWithTimezone(moment().startOf('day')),
          [this.OPERATORS.LTE]: this.toDateWithTimezone(moment().endOf('day')),
        };
      case 'past':
        return { [this.OPERATORS.LTE]: moment().toDate() };
      case 'future':
        return { [this.OPERATORS.GTE]: moment().toDate() };
      case 'yesterday':
      case 'previous_week':
      case 'previous_month':
      case 'previous_quarter':
      case 'previous_year': {
        const previousPeriod = moment().subtract(1, PERIODS[operator]);

        return {
          [this.OPERATORS.GTE]: this.toDateWithTimezone(previousPeriod
            .startOf(PERIODS_VALUES[PERIODS[operator]])),
          [this.OPERATORS.LTE]: this.toDateWithTimezone(previousPeriod
            .endOf(PERIODS_VALUES[PERIODS[operator]])),
        };
      }
      case 'previous_week_to_date':
      case 'previous_month_to_date':
      case 'previous_quarter_to_date':
      case 'previous_year_to_date':
        return {
          [this.OPERATORS.GTE]: this.toDateWithTimezone(moment()
            .startOf(PERIODS_VALUES[PERIODS[operator]])),
          [this.OPERATORS.LTE]: moment().toDate(),
        };
      case 'previous_x_days':
        return {
          [this.OPERATORS.GTE]: this.toDateWithTimezone(moment()
            .subtract(value, 'days').startOf('day')),
          [this.OPERATORS.LTE]: this.toDateWithTimezone(moment()
            .subtract(1, 'days').endOf('day')),
        };
      case 'previous_x_days_to_date':
        return {
          [this.OPERATORS.GTE]: this.toDateWithTimezone(moment()
            .subtract(value - 1, 'days').startOf('day')),
          [this.OPERATORS.LTE]: moment().toDate(),
        };
      case 'before_x_hours_ago':
        return {
          [this.OPERATORS.LTE]: this.toDateWithTimezone(moment().subtract(value, 'hours')),
        };
      case 'after_x_hours_ago':
        return {
          [this.OPERATORS.GTE]: this.toDateWithTimezone(moment().subtract(value, 'hours')),
        };
      default:
        throw new NoMatchingOperatorError();
    }
  };

  this.getPreviousDateIntervalFilter = (operator, value) => {
    value = Number.parseInt(value, 10);

    switch (operator) {
      case 'today': {
        const yesterday = moment().subtract(1, 'days');

        return {
          [this.OPERATORS.GTE]: this.toDateWithTimezone(yesterday.startOf('day')),
          [this.OPERATORS.LTE]: this.toDateWithTimezone(yesterday.endOf('day')),
        };
      }
      case 'previous_x_days':
        return {
          [this.OPERATORS.GTE]: this.toDateWithTimezone(moment()
            .subtract(value * 2, 'days').startOf('day')),
          [this.OPERATORS.LTE]: this.toDateWithTimezone(moment()
            .subtract(value + 1, 'days').endOf('day')),
        };
      case 'previous_x_days_to_date':
        return {
          [this.OPERATORS.GTE]: this.toDateWithTimezone(moment()
            .subtract((value * 2) - 1, 'days').startOf('day')),
          [this.OPERATORS.LTE]: this.toDateWithTimezone(moment()
            .subtract(value, 'days')),
        };
      case 'yesterday':
      case 'previous_week':
      case 'previous_month':
      case 'previous_quarter':
      case 'previous_year': {
        const penultimatePeriod = moment().subtract(2, PERIODS[operator]);

        return {
          [this.OPERATORS.GTE]: this.toDateWithTimezone(penultimatePeriod
            .startOf(PERIODS_VALUES[PERIODS[operator]])),
          [this.OPERATORS.LTE]: this.toDateWithTimezone(penultimatePeriod
            .endOf(PERIODS_VALUES[PERIODS[operator]])),
        };
      }
      case 'previous_week_to_date':
      case 'previous_month_to_date':
      case 'previous_quarter_to_date':
      case 'previous_year_to_date': {
        const previousPeriod = moment().subtract(1, PERIODS[operator]);

        return {
          [this.OPERATORS.GTE]: this.toDateWithTimezone(previousPeriod
            .startOf(PERIODS_VALUES[PERIODS[operator]])),
          [this.OPERATORS.LTE]: this.toDateWithTimezone(previousPeriod),
        };
      }
      default:
        throw new NoMatchingOperatorError();
    }
  };
}

module.exports = OperatorDateIntervalParser;
