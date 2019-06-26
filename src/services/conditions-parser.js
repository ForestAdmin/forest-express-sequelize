import Operators from '../utils/operators';
import OperatorDateIntervalParser from './operator-date-interval-parser';

export default class ConditionsParser {
  constructor(conditions, timezone, options) {
    this.OPERATORS = new Operators(options);
    this.operatorDateIntervalParser = new OperatorDateIntervalParser(timezone, options);
    this.formattedConditions = conditions ? JSON.parse(conditions) : null;
  }

  getPreviousInterval() {
    let currentPreviousInterval = null;

    // NOTICE: Leaf condition at root
    if (!this.formattedConditions.aggregator) {
      if (OperatorDateIntervalParser.hasPreviousDateInterval(this.formattedConditions.operator)) {
        return this.formattedConditions;
      }
      return null;
    }

    if (this.formattedConditions.aggregator === 'and') {
      for (let i = 0; i < this.formattedConditions.conditions.length; i += 1) {
        const condition = this.formattedConditions.conditions[i];

        // NOTICE: Nested conditions
        if (condition.aggregator) {
          return null;
        }

        if (OperatorDateIntervalParser.hasPreviousDateInterval(condition.operator)) {
          // NOTICE: There can't be two previousInterval.
          if (currentPreviousInterval) {
            return null;
          }
          currentPreviousInterval = condition;
        }
      }
    }

    return currentPreviousInterval;
  }

  perform() {
    if (!this.formattedConditions) return null;

    return this.formatAggregation(this.formattedConditions);
  }

  formatAggregation(node) {
    if (!node.aggregator) return this.formatCondition(node);

    const res = {};
    const formatedConditions = [];

    node.conditions.forEach(condition =>
      formatedConditions.push(this.formatAggregation(condition)));

    const aggregatorOperator = this.formatAggregatorOperator(node.aggregator);

    res[aggregatorOperator] = formatedConditions;
    return res;
  }

  formatCondition(condition) {
    const formatedCondition = {};
    let operatorAndValue = {};
    const formatedField = ConditionsParser.formatField(condition.field);

    if (OperatorDateIntervalParser.isDateIntervalOperator(condition.operator)) {
      operatorAndValue = this.operatorDateIntervalParser
        .getDateIntervalFilter(condition.operator, condition.value);
    } else {
      const formatedOperator = this.formatOperator(condition.operator);
      const formatedValue = ConditionsParser.formatValue(condition.operator, condition.value);
      operatorAndValue[formatedOperator] = formatedValue;
    }

    formatedCondition[formatedField] = operatorAndValue;

    return formatedCondition;
  }

  formatAggregatorOperator(aggregatorOperator) {
    switch (aggregatorOperator) {
      case 'and':
        return this.OPERATORS.AND;
      case 'or':
        return this.OPERATORS.OR;
      default:
        console.log('ERROR: No operator matching this aggregator');
        return null;
    }
  }

  formatOperator(operator) {
    switch (operator) {
      case 'not':
        return this.OPERATORS.NOT;
      case 'greater_than':
        return this.OPERATORS.GT;
      case 'less_than':
        return this.OPERATORS.LT;
      case 'contains':
      case 'starts_with':
      case 'ends_with':
        return this.OPERATORS.LIKE;
      case 'not_contains':
        return this.OPERATORS.NOT_LIKE;
      case 'present':
      case 'not_equal':
        return this.OPERATORS.NE;
      case 'blank':
      case 'equal':
        return this.OPERATORS.EQ;
      default:
        console.log('ERROR: No matching operator');
        return null;
    }
  }

  static formatValue(operator, value) {
    switch (operator) {
      case 'not':
      case 'greater_than':
      case 'less_than':
      case 'not_equal':
      case 'equal':
        return value;
      case 'contains':
      case 'not_contains':
        return `%${value}%`;
      case 'starts_with':
        return `${value}%`;
      case 'ends_with':
        return `%${value}`;
      case 'present':
      case 'blank':
        return null;
      default:
        console.log('ERROR: No matching operator');
        return null;
    }
  }

  static formatField(field) {
    return field.includes(':') ? `$${field.replace(':', '.')}$` : field;
  }
}
