/* global describe, it */

import { expect } from 'chai';
import moment from 'moment';
import Sequelize from 'sequelize';
import ConditionsParser from '../../src/services/conditions-parser';
import Operators from '../../src/utils/operators';
import { NoMatchingOperatorError } from '../../src/services/errors';

describe('Services > ConditionsParser', () => {
  const sequelizeOptions = {
    sequelize: Sequelize,
  };
  const timezone = 'Europe/Paris';
  const OPERATORS = new Operators(sequelizeOptions);
  const defaultConditionsParser = new ConditionsParser(null, timezone, sequelizeOptions);

  const getExpectedCondition = (field, conditions) => {
    const result = {};
    const tmp = {};
    conditions.forEach((condition) => {
      tmp[condition.operator] = condition.value;
    });
    result[field] = tmp;
    return result;
  };

  const defaultCondition = {
    field: 'name',
    operator: 'starts_with',
    value: 'toto',
  };
  const defaultExpectedCondition = getExpectedCondition('name', [{ operator: OPERATORS.LIKE, value: 'toto%' }]);

  const defaultCondition2 = {
    field: 'id',
    operator: 'greater_than',
    value: 3,
  };
  const defaultExpectedCondition2 = getExpectedCondition('id', [{ operator: OPERATORS.GT, value: 3 }]);

  const defaultDateCondition = {
    field: 'createdAt',
    operator: 'previous_week',
  };
  const defaultExpectedDateCondition = getExpectedCondition('createdAt', [
    { operator: OPERATORS.GTE, value: moment().subtract(7, 'd').format('YYYY-MM-DD') },
    { operator: OPERATORS.LTE, value: moment().format('YYYY-MM-DD') },
  ]);

  describe('formatOperator function', () => {
    it('should return the appropriate sequelize operator', () => {
      expect(defaultConditionsParser.formatOperator('starts_with')).equal(OPERATORS.LIKE);
      expect(defaultConditionsParser.formatOperator('ends_with')).equal(OPERATORS.LIKE);
      expect(defaultConditionsParser.formatOperator('contains')).equal(OPERATORS.LIKE);
      expect(defaultConditionsParser.formatOperator('not')).equal(OPERATORS.NOT);
      expect(defaultConditionsParser.formatOperator('greater_than')).equal(OPERATORS.GT);
      expect(defaultConditionsParser.formatOperator('less_than')).equal(OPERATORS.LT);
      expect(defaultConditionsParser.formatOperator('not_contains')).equal(OPERATORS.NOT_LIKE);
      expect(defaultConditionsParser.formatOperator('not_equal')).equal(OPERATORS.NE);
      expect(defaultConditionsParser.formatOperator('present')).equal(OPERATORS.NE);
      expect(defaultConditionsParser.formatOperator('equal')).equal(OPERATORS.EQ);
      expect(defaultConditionsParser.formatOperator('blank')).equal(OPERATORS.EQ);
    });

    it('should raise an error on unknown operator', () => {
      expect(defaultConditionsParser.formatOperator.bind('random')).to.throw(NoMatchingOperatorError);
    });
  });

  describe('formatValue function', () => {
    const values = [5, 'toto', null];

    values.forEach((value) => {
      it(`should return the appropriate value (${typeof value})`, () => {
        expect(defaultConditionsParser.formatValue('starts_with', value)).equal(`${value}%`);
        expect(defaultConditionsParser.formatValue('ends_with', value)).equal(`%${value}`);
        expect(defaultConditionsParser.formatValue('contains', value)).equal(`%${value}%`);
        expect(defaultConditionsParser.formatValue('not', value)).equal(value);
        expect(defaultConditionsParser.formatValue('greater_than', value)).equal(value);
        expect(defaultConditionsParser.formatValue('less_than', value)).equal(value);
        expect(defaultConditionsParser.formatValue('not_contains', value)).equal(`%${value}%`);
        expect(defaultConditionsParser.formatValue('not_equal', value)).equal(value);
        expect(defaultConditionsParser.formatValue('present', value)).equal(null);
        expect(defaultConditionsParser.formatValue('equal', value)).equal(value);
        expect(defaultConditionsParser.formatValue('blank', value)).equal(null);
      });

      it('should raise an error on unknown operator', () => {
        expect(defaultConditionsParser.formatValue.bind('random', value)).to.throw(NoMatchingOperatorError);
      });
    });
  });


  describe('formatAggregatorOperator function', () => {
    it('should return the appropriate sequelize operator', () => {
      expect(defaultConditionsParser.formatAggregatorOperator('and')).equal(OPERATORS.AND);
      expect(defaultConditionsParser.formatAggregatorOperator('or')).equal(OPERATORS.OR);
    });

    it('should raise an error on unknown operator', () => {
      expect(defaultConditionsParser.formatAggregatorOperator.bind('random')).to.throw(NoMatchingOperatorError);
    });
  });

  describe('formatField function', () => {
    it('should format default field correctly', () => {
      expect(defaultConditionsParser.formatField('myField')).equal('myField');
    });

    it('should format nested fields correctly', () => {
      expect(defaultConditionsParser.formatField('my:field')).equal('$my.field$');
    });
  });

  describe('formatCondition function', () => {
    it('should handle basic condition correctly', () => {
      expect(defaultConditionsParser.formatCondition(defaultCondition))
        .to.deep.equal(defaultExpectedCondition);
    });

    it('should handle time/date condition correctly', () => {
      expect(defaultConditionsParser.formatCondition(defaultDateCondition))
        .to.deep.equal(defaultExpectedDateCondition);
    });
  });

  describe('formatAggregation function', () => {
    it('should format correctly when simple condition', () => {
      expect(defaultConditionsParser.formatAggregation(defaultCondition))
        .to.deep.equal(defaultExpectedCondition);
    });

    it('should format correctly with \'and\' as aggregator', () => {
      const node = {
        aggregator: 'and',
        conditions: [defaultCondition, defaultDateCondition],
      };
      const expectedFormatedAggregation = {};
      expectedFormatedAggregation[OPERATORS.AND] = [
        defaultExpectedCondition, defaultExpectedDateCondition];

      expect(defaultConditionsParser.formatAggregation(node))
        .to.deep.equal(expectedFormatedAggregation);
    });

    it('should format correctly with \'or\' as aggregator', () => {
      const node = {
        aggregator: 'or',
        conditions: [defaultCondition, defaultDateCondition],
      };
      const expectedFormatedAggregation = {};
      expectedFormatedAggregation[OPERATORS.OR] = [
        defaultExpectedCondition, defaultExpectedDateCondition];

      expect(defaultConditionsParser.formatAggregation(node))
        .to.deep.equal(expectedFormatedAggregation);
    });

    it('should format correctly with \'and\' as nested aggregators', () => {
      const nestedNode = {
        aggregator: 'or',
        conditions: [defaultCondition, defaultCondition2],
      };
      const node = {
        aggregator: 'and',
        conditions: [defaultDateCondition, nestedNode],
      };
      const expectedFormatedAggregation = {};
      const expectedNestedAggregation = {};
      expectedNestedAggregation[OPERATORS.OR] = [
        defaultExpectedCondition,
        defaultExpectedCondition2,
      ];
      expectedFormatedAggregation[OPERATORS.AND] = [
        defaultExpectedDateCondition,
        expectedNestedAggregation,
      ];

      expect(defaultConditionsParser.formatAggregation(node))
        .to.deep.equal(expectedFormatedAggregation);
    });
  });

  describe('perform function', () => {
    it('should be null when nothing is provided', () => {
      expect(defaultConditionsParser.perform()).to.equal(null);
    });
  });

  describe('getPreviousIntervalCondition function', () => {
    describe('working scenarii', () => {
      it('\'and\' aggregator + flat conditions + 1 previous interval, ', () => {
        const aggregator = JSON.stringify({
          aggregator: 'and',
          conditions: [defaultCondition, defaultCondition2, defaultDateCondition],
        });
        const conditionsParser = new ConditionsParser(aggregator, timezone, sequelizeOptions);

        expect(conditionsParser.getPreviousIntervalCondition()).to.deep.equal(defaultDateCondition);
      });

      it('no aggregator + flat conditions + 1 previous interval, ', () => {
        const aggregator = JSON.stringify(defaultDateCondition);
        const conditionsParser = new ConditionsParser(aggregator, timezone, sequelizeOptions);

        expect(conditionsParser.getPreviousIntervalCondition()).to.deep.equal(defaultDateCondition);
      });
    });

    describe('not working scenarii', () => {
      it('\'and\' aggregator + flat conditions + 2 previous interval, ', () => {
        const aggregator = JSON.stringify({
          aggregator: 'and',
          conditions: [defaultCondition, defaultDateCondition, defaultDateCondition],
        });
        const conditionsParser = new ConditionsParser(aggregator, timezone, sequelizeOptions);

        expect(conditionsParser.getPreviousIntervalCondition()).to.equal(null);
      });

      it('\'or\' aggregator + flat conditions + 1 previous interval, ', () => {
        const aggregator = JSON.stringify({
          aggregator: 'or',
          conditions: [defaultCondition, defaultCondition2, defaultDateCondition],
        });
        const conditionsParser = new ConditionsParser(aggregator, timezone, sequelizeOptions);

        expect(conditionsParser.getPreviousIntervalCondition()).to.equal(null);
      });

      it('\'and\' aggregator + flat conditions + 0 previous interval, ', () => {
        const aggregator = JSON.stringify({
          aggregator: 'and',
          conditions: [defaultCondition, defaultCondition2],
        });
        const conditionsParser = new ConditionsParser(aggregator, timezone, sequelizeOptions);

        expect(conditionsParser.getPreviousIntervalCondition()).to.equal(null);
      });

      it('\'and\' aggregator + nested conditions + 1 previous interval, ', () => {
        const aggregator = JSON.stringify({
          aggregator: 'and',
          conditions: [{ aggregator: 'or', conditions: [defaultCondition, defaultCondition2] }, defaultDateCondition],
        });
        const conditionsParser = new ConditionsParser(aggregator, timezone, sequelizeOptions);

        expect(conditionsParser.getPreviousIntervalCondition()).to.equal(null);
      });

      it('no aggregator + flat conditions + 0 previous interval, ', () => {
        const aggregator = JSON.stringify(defaultCondition);
        const conditionsParser = new ConditionsParser(aggregator, timezone, sequelizeOptions);

        expect(conditionsParser.getPreviousIntervalCondition()).to.equal(null);
      });
    });
  });
});
