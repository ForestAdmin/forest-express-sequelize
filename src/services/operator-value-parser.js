import _ from 'lodash';
import { Schemas } from 'forest-express';
import Operators from '../utils/operators';
import OperatorDateIntervalParser from './operator-date-interval-parser';

class OperatorValueParser {
  constructor(options) {
    this.OPERATORS = new Operators(options);
    this.options = options;
  }

  perform(model, fieldName, value, timezone) {
    const operatorDateIntervalParser = new OperatorDateIntervalParser(
      value,
      timezone,
      this.options,
    );
    // NOTICE: Handle boolean for MySQL database
    let modelName;
    let field;
    let fieldSplit;
    let valueBoolean;
    let fieldBoolean = false;

    if (fieldName.indexOf(':') === -1) {
      modelName = model.name;
    } else {
      fieldSplit = fieldName.split(':');
      modelName = fieldSplit[0];
      fieldName = fieldSplit[1];
    }

    const schema = Schemas.schemas[modelName];
    if (schema) {
      field = _.find(schema.fields, currentField => currentField.field === fieldName);
      if (field && field.type === 'Boolean') {
        fieldBoolean = true;
        if (value.indexOf('true') > -1) {
          valueBoolean = true;
        } else if (value.indexOf('false') > -1) {
          valueBoolean = false;
        }
      }
    }

    const condition = {};
    if (value[0] === '!' && value[1] !== '*') {
      value = value.substring(1);
      if (fieldBoolean) {
        condition[this.OPERATORS.NOT] = _.isUndefined(valueBoolean) ? null :
          valueBoolean;
      } else {
        condition[this.OPERATORS.NE] = value;
      }
    } else if (value[0] === '>') {
      condition[this.OPERATORS.GT] = value.substring(1);
    } else if (value[0] === '<') {
      condition[this.OPERATORS.LT] = value.substring(1);
    } else if (value[0] === '*' && value[value.length - 1] === '*') {
      condition[this.OPERATORS.LIKE] = `%${value.substring(1, value.length - 1)}%`;
    } else if (value[0] === '!' && value[1] === '*' &&
      value[value.length - 1] === '*') {
      // TODO : Include null values
      // return { $or: { $notLike: '%' + value + '%', $eq: null } };
      condition[this.OPERATORS.NOT_LIKE] = `%${value.substring(2, value.length - 1)}%`;
    } else if (value[0] === '*') {
      condition[this.OPERATORS.LIKE] = `%${value.substring(1)}`;
    } else if (value[value.length - 1] === '*') {
      condition[this.OPERATORS.LIKE] = `${value.substring(0, value.length - 1)}%`;
    } else if (value === '$present') {
      condition[this.OPERATORS.NE] = null;
    } else if (value === '$blank') {
      condition[this.OPERATORS.EQ] = null;
    } else if (operatorDateIntervalParser.isIntervalDateValue()) {
      return operatorDateIntervalParser.getIntervalDateFilter();
    } else if (fieldBoolean) {
      condition[this.OPERATORS.EQ] = _.isUndefined(valueBoolean) ? null : valueBoolean;
    } else {
      condition[this.OPERATORS.EQ] = value;
    }
    return condition;
  }
}

export default OperatorValueParser;
