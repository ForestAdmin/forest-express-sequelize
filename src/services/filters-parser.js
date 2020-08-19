import { BaseFiltersParser, BaseOperatorDateParser, Schemas } from 'forest-express';
import Operators from '../utils/operators';
import { NoMatchingOperatorError } from './errors';

const { getReferenceSchema, getReferenceField } = require('../utils/query');

function FiltersParser(modelSchema, timezone, options) {
  this.OPERATORS = new Operators(options);
  this.operatorDateParser = new BaseOperatorDateParser({ operators: this.OPERATORS, timezone });

  this.perform = async (filtersString) =>
    BaseFiltersParser.perform(filtersString, this.formatAggregation, this.formatCondition);

  this.formatAggregation = async (aggregator, formatedConditions) => {
    const aggregatorOperator = this.formatAggregatorOperator(aggregator);
    return { [aggregatorOperator]: formatedConditions };
  };

  this.formatCondition = async (condition) => {
    const formatedField = this.formatField(condition.field);

    if (this.operatorDateParser.isDateOperator(condition.operator)) {
      return {
        [formatedField]: this.operatorDateParser
          .getDateFilter(condition.operator, condition.value),
      };
    }

    const isTextField = this.isTextField(condition.field);
    return {
      [formatedField]: this.formatOperatorValue(condition.operator, condition.value, isTextField),
    };
  };

  this.formatAggregatorOperator = (aggregatorOperator) => {
    switch (aggregatorOperator) {
      case 'and':
        return this.OPERATORS.AND;
      case 'or':
        return this.OPERATORS.OR;
      default:
        throw new NoMatchingOperatorError();
    }
  };

  this.formatOperator = (operator) => {
    switch (operator) {
      case 'not':
        return this.OPERATORS.NOT;
      case 'greater_than':
      case 'after':
        return this.OPERATORS.GT;
      case 'less_than':
      case 'before':
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
      case 'in':
        return this.OPERATORS.IN;
      default:
        throw new NoMatchingOperatorError();
    }
  };

  this.formatValue = (operator, value) => {
    switch (operator) {
      case 'not':
      case 'greater_than':
      case 'less_than':
      case 'not_equal':
      case 'equal':
      case 'before':
      case 'after':
      case 'in':
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
        throw new NoMatchingOperatorError();
    }
  };

  this.formatOperatorValue = (operator, value, isTextField = false) => {
    switch (operator) {
      case 'not':
        return { [this.OPERATORS.NOT]: value };
      case 'greater_than':
      case 'after':
        return { [this.OPERATORS.GT]: value };
      case 'less_than':
      case 'before':
        return { [this.OPERATORS.LT]: value };
      case 'contains':
        return { [this.OPERATORS.LIKE]: `%${value}%` };
      case 'starts_with':
        return { [this.OPERATORS.LIKE]: `${value}%` };
      case 'ends_with':
        return { [this.OPERATORS.LIKE]: `%${value}` };
      case 'not_contains':
        return { [this.OPERATORS.NOT_LIKE]: `%${value}%` };
      case 'present':
        return { [this.OPERATORS.NE]: null };
      case 'not_equal':
        return { [this.OPERATORS.NE]: value };
      case 'in':
        return { [this.OPERATORS.IN]: value };
      case 'blank':
        return isTextField ? {
          [this.OPERATORS.OR]: [{
            [this.OPERATORS.EQ]: null,
          }, {
            [this.OPERATORS.EQ]: '',
          }],
        } : { [this.OPERATORS.EQ]: null };
      case 'equal':
        return { [this.OPERATORS.EQ]: value };
      default:
        throw new NoMatchingOperatorError();
    }
  };

  this.formatField = (field) => {
    if (field.includes(':')) {
      const [associationName, fieldName] = field.split(':');
      return `$${getReferenceField(Schemas.schemas, modelSchema, associationName, fieldName)}$`;
    }
    return field;
  };

  this.isTextField = (field) => {
    if (field.includes(':')) {
      const [associationName, fieldName] = field.split(':');
      const associationSchema = getReferenceSchema(
        Schemas.schemas, modelSchema, associationName, fieldName,
      );
      if (associationSchema) {
        return this.getFieldTypeFromSchema(associationSchema, field) === 'String';
      }
      return false;
    }
    return this.getFieldTypeFromSchema(modelSchema, field) === 'String';
  };

  this.getFieldTypeFromSchema = (schema, fieldName) => {
    const fieldFound = schema.fields.find((field) => field.field === fieldName);
    return fieldFound && fieldFound.type;
  };

  // NOTICE: Look for a previous interval condition matching the following:
  //         - If the filter is a simple condition at the root the check is done right away.
  //         - There can't be a previous interval condition if the aggregator is 'or' (no meaning).
  //         - The condition's operator has to be elligible for a previous interval.
  //         - There can't be two previous interval condition.
  this.getPreviousIntervalCondition = (filtersString) => {
    const filters = BaseFiltersParser.parseFiltersString(filtersString);
    let currentPreviousInterval = null;

    // NOTICE: Leaf condition at root
    if (filters && !filters.aggregator) {
      if (this.operatorDateParser.hasPreviousDateInterval(filters.operator)) {
        return filters;
      }
      return null;
    }

    // NOTICE: No previous interval condition when 'or' aggregator
    if (filters.aggregator === 'and') {
      for (let i = 0; i < filters.conditions.length; i += 1) {
        const condition = filters.conditions[i];

        // NOTICE: Nested filters
        if (condition.aggregator) {
          return null;
        }

        if (this.operatorDateParser.hasPreviousDateInterval(condition.operator)) {
          // NOTICE: There can't be two previousInterval.
          if (currentPreviousInterval) {
            return null;
          }
          currentPreviousInterval = condition;
        }
      }
    }

    return currentPreviousInterval;
  };

  this.getAssociations = async (filtersString) => BaseFiltersParser.getAssociations(filtersString);
}

module.exports = FiltersParser;
