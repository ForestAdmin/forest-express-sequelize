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

const DATE_OPERATORS = DATE_OPERATORS_HAVING_PREVIOUS_INTERVAL + [
  'past',
  'future',
  'before_x_hours_ago',
  'after_x_hours_ago',
];

function OperatorDateIntervalParser(timezone, options) {
  const offsetClient = parseInt(moment().tz(timezone).format('Z'), 10);
  const offsetServer = moment().utcOffset() / 60;

  this.offsetHours = offsetServer - offsetClient;
  this.OPERATORS = new Operators(options);

  this.toDateWithTimezone = customMoment => customMoment.add(this.offsetHours, 'h').toDate();

  this.isDateIntervalOperator = operator => DATE_OPERATORS.includes(operator);

  this.hasPreviousDateInterval = operator => DATE_OPERATORS_HAVING_PREVIOUS_INTERVAL
    .includes(operator);

  this.getDateIntervalFilter = (operator, value) => {
    const condition = {};

    switch (operator) {
      case 'today':
        condition[this.OPERATORS.GTE] = this.toDateWithTimezone(moment().startOf('day'));
        condition[this.OPERATORS.LTE] = this.toDateWithTimezone(moment().endOf('day'));
        break;
      case 'past':
        condition[this.OPERATORS.LTE] = moment().toDate();
        break;
      case 'future':
        condition[this.OPERATORS.GTE] = moment().toDate();
        break;
      case 'yesterday':
      case 'previous_week':
      case 'previous_month':
      case 'previous_quarter':
      case 'previous_year':
        condition[this.OPERATORS.GTE] = this.toDateWithTimezone(moment()
          .subtract(1, PERIODS[operator]).startOf(PERIODS_VALUES[PERIODS[operator]]));
        condition[this.OPERATORS.LTE] = this.toDateWithTimezone(moment()
          .subtract(1, PERIODS[operator]).endOf(PERIODS_VALUES[PERIODS[operator]]));
        break;
      case 'previous_week_to_date':
      case 'previous_month_to_date':
      case 'previous_quarter_to_date':
      case 'previous_year_to_date':
        condition[this.OPERATORS.GTE] = this.toDateWithTimezone(moment()
          .startOf(PERIODS_VALUES[PERIODS[operator]]));
        condition[this.OPERATORS.LTE] = moment().toDate();
        break;
      case 'previous_x_days':
        condition[this.OPERATORS.GTE] = this.toDateWithTimezone(moment()
          .subtract(value, 'days').startOf('day'));
        condition[this.OPERATORS.LTE] = this.toDateWithTimezone(moment()
          .subtract(1, 'days').endOf('day'));
        break;
      case 'previous_x_days_to_date':
        condition[this.OPERATORS.GTE] = this.toDateWithTimezone(moment()
          .subtract(value - 1, 'days').startOf('day'));
        condition[this.OPERATORS.LTE] = moment().toDate();
        break;
      case 'before_x_hours_ago':
        condition[this.OPERATORS.LTE] = this.toDateWithTimezone(moment().subtract(value, 'hours'));
        break;
      case 'after_x_hours_ago':
        condition[this.OPERATORS.GTE] = this.toDateWithTimezone(moment().subtract(value, 'hours'));
        break;
      default:
        throw new NoMatchingOperatorError();
    }
    return condition;
  };

  this.getPreviousDateIntervalFilter = (operator, value) => {
    const condition = {};

    switch (operator) {
      case 'today':
        condition[this.OPERATORS.GTE] = this.toDateWithTimezone(moment()
          .subtract(1, 'days').startOf('day'));
        condition[this.OPERATORS.LTE] = this.toDateWithTimezone(moment()
          .subtract(1, 'days').endOf('day'));
        break;
      case 'previous_x_days':
        condition[this.OPERATORS.GTE] = this.toDateWithTimezone(moment()
          .subtract(value * 2, 'days').startOf('day'));
        condition[this.OPERATORS.LTE] = this.toDateWithTimezone(moment()
          .subtract(value + 1, 'days').endOf('day'));
        break;
      case 'previous_x_days_to_date':
        condition[this.OPERATORS.GTE] = this.toDateWithTimezone(moment()
          .subtract((value * 2) - 1, 'days').startOf('day'));
        condition[this.OPERATORS.LTE] = this.toDateWithTimezone(moment()
          .subtract(value, 'days'));
        break;
      case 'yesterday':
      case 'previous_week':
      case 'previous_month':
      case 'previous_quarter':
      case 'previous_year':
        condition[this.OPERATORS.GTE] = this.toDateWithTimezone(moment()
          .subtract(2, PERIODS[operator]).startOf(PERIODS_VALUES[PERIODS[operator]]));
        condition[this.OPERATORS.LTE] = this.toDateWithTimezone(moment()
          .subtract(2, PERIODS[operator]).endOf(PERIODS_VALUES[PERIODS[operator]]));
        break;
      case 'previous_week_to_date':
      case 'previous_month_to_date':
      case 'previous_quarter_to_date':
      case 'previous_year_to_date':
        condition[this.OPERATORS.GTE] = this.toDateWithTimezone(moment()
          .subtract(1, PERIODS[operator]).startOf(PERIODS_VALUES[PERIODS[operator]]));
        condition[this.OPERATORS.LTE] = this.toDateWithTimezone(moment()
          .subtract(1, PERIODS[operator]));
        break;
      default:
        throw new NoMatchingOperatorError();
    }
    return condition;
  };
}

module.exports = OperatorDateIntervalParser;
