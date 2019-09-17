/* global describe, it */
import { expect } from 'chai';
import moment from 'moment';
import Sequelize from 'sequelize';
import FiltersParser from '../../src/services/filters-parser';
import Operators from '../../src/utils/operators';
import { NoMatchingOperatorError } from '../../src/services/errors';

describe('Services > FiltersParser', () => {
  const sequelizeOptions = {
    sequelize: Sequelize,
  };
  const timezone = 'Europe/Paris';
  const OPERATORS = new Operators(sequelizeOptions);
  const defaultFiltersParser = new FiltersParser(timezone, sequelizeOptions);

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

  describe('formatOperatorValue function', () => {
    const values = [5, 'toto', null];

    values.forEach((value) => {
      it(`should return the appropriate value (${typeof value})`, () => {
        expect(defaultFiltersParser.formatOperatorValue('starts_with', value)).deep.equal({ [OPERATORS.LIKE]: `${value}%` });
        expect(defaultFiltersParser.formatOperatorValue('ends_with', value)).deep.equal({ [OPERATORS.LIKE]: `%${value}` });
        expect(defaultFiltersParser.formatOperatorValue('contains', value)).deep.equal({ [OPERATORS.LIKE]: `%${value}%` });
        expect(defaultFiltersParser.formatOperatorValue('not', value)).deep.equal({ [OPERATORS.NOT]: value });
        expect(defaultFiltersParser.formatOperatorValue('greater_than', value)).deep.equal({ [OPERATORS.GT]: value });
        expect(defaultFiltersParser.formatOperatorValue('less_than', value)).deep.equal({ [OPERATORS.LT]: value });
        expect(defaultFiltersParser.formatOperatorValue('before', value)).deep.equal({ [OPERATORS.LT]: value });
        expect(defaultFiltersParser.formatOperatorValue('after', value)).deep.equal({ [OPERATORS.GT]: value });
        expect(defaultFiltersParser.formatOperatorValue('not_contains', value)).deep.equal({ [OPERATORS.NOT_LIKE]: `%${value}%` });
        expect(defaultFiltersParser.formatOperatorValue('not_equal', value)).deep.equal({ [OPERATORS.NE]: value });
        expect(defaultFiltersParser.formatOperatorValue('present', value)).deep.equal({ [OPERATORS.NE]: null });
        expect(defaultFiltersParser.formatOperatorValue('equal', value)).deep.equal({ [OPERATORS.EQ]: value });
        expect(defaultFiltersParser.formatOperatorValue('blank', value)).deep.equal({ [OPERATORS.EQ]: null });
      });

      it('should raise an error on unknown operator', () => {
        expect(defaultFiltersParser.formatOperatorValue.bind('random', value)).to.throw(NoMatchingOperatorError);
      });
    });
  });

  describe('formatAggregatorOperator function', () => {
    it('should return the appropriate sequelize operator', () => {
      expect(defaultFiltersParser.formatAggregatorOperator('and')).equal(OPERATORS.AND);
      expect(defaultFiltersParser.formatAggregatorOperator('or')).equal(OPERATORS.OR);
    });

    it('should raise an error on unknown operator', () => {
      expect(defaultFiltersParser.formatAggregatorOperator.bind('random')).to.throw(NoMatchingOperatorError);
    });
  });

  describe('formatField function', () => {
    it('should format default field correctly', () => {
      expect(defaultFiltersParser.formatField('myField')).equal('myField');
    });

    it('should format nested fields correctly', () => {
      expect(defaultFiltersParser.formatField('myCollection:myField')).equal('$myCollection.myField$');
    });
  });

  describe('formatCondition function', () => {
    it('should handle basic condition correctly', () => {
      expect(defaultFiltersParser.formatCondition(defaultCondition))
        .to.deep.equal(defaultExpectedCondition);
    });

    it('should handle time/date condition correctly', () => {
      expect(defaultFiltersParser.formatCondition(defaultDateCondition))
        .to.deep.equal(defaultExpectedDateCondition);
    });

    it('should throw an error on empty condition', () => {
      expect(() => defaultFiltersParser.formatCondition()).to.throw(Error);
      expect(() => defaultFiltersParser.formatCondition({})).to.throw(Error);
    });
  });

  describe('formatAggregation function', () => {
    it('should format correctly with \'and\' as aggregator', () => {
      const expectedFormatedAggregation = {
        [OPERATORS.AND]: [defaultExpectedCondition, defaultExpectedDateCondition],
      };

      expect(defaultFiltersParser.formatAggregation('and', [
        defaultExpectedCondition,
        defaultExpectedDateCondition,
      ])).to.deep.equal(expectedFormatedAggregation);
    });

    it('should format correctly with \'or\' as aggregator', () => {
      const expectedFormatedAggregation = {
        [OPERATORS.OR]: [defaultExpectedCondition, defaultExpectedDateCondition],
      };

      expect(defaultFiltersParser.formatAggregation('or', [
        defaultExpectedCondition,
        defaultExpectedDateCondition,
      ])).to.deep.equal(expectedFormatedAggregation);
    });

    it('should format correctly with \'and\' as nested aggregators', () => {
      const expectedNestedAggregation = {
        [OPERATORS.AND]: [
          defaultExpectedCondition,
          defaultExpectedCondition2,
        ],
      };
      const expectedFormatedAggregation = {
        [OPERATORS.OR]: [
          defaultExpectedDateCondition,
          expectedNestedAggregation,
        ],
      };

      expect(defaultFiltersParser.formatAggregation('or', [
        defaultExpectedDateCondition,
        expectedNestedAggregation,
      ]))
        .to.deep.equal(expectedFormatedAggregation);
    });

    it('should throw an error on empty condition', () => {
      expect(() => defaultFiltersParser.formatAggregation()).to.throw(Error);
      expect(() => defaultFiltersParser.formatAggregation({})).to.throw(Error);
    });
  });

  describe('perform function', () => {
    describe('with nothing provided', () => {
      it('should be null', () => {
        expect(defaultFiltersParser.perform()).to.equal(null);
      });
    });

    describe('with a filter on a reference', () => {
      const filters = '{ "field": "car:brandName", "operator": "starts_with", "value": "Ferrari" }';
      const filtersParser = new FiltersParser(
        timezone,
        sequelizeOptions,
      );

      it('should not be null', () => {
        expect(filtersParser.perform(filters))
          .to.deep.equal({ '$car.brandName$': { [OPERATORS.LIKE]: 'Ferrari%' } });
      });
    });
  });

  describe('getPreviousIntervalCondition function', () => {
    describe('working scenarii', () => {
      describe('with \'and\' aggregator + flat conditions + 1 previous interval', () => {
        const aggregator = JSON.stringify({
          aggregator: 'and',
          conditions: [defaultCondition, defaultCondition2, defaultDateCondition],
        });
        const filtersParser = new FiltersParser(timezone, sequelizeOptions);

        it('should generate the right condition', () => {
          expect(filtersParser.getPreviousIntervalCondition(aggregator))
            .to.deep.equal(defaultDateCondition);
        });
      });

      describe('with no aggregator + flat conditions + 1 previous interval', () => {
        const aggregator = JSON.stringify(defaultDateCondition);
        const filtersParser = new FiltersParser(timezone, sequelizeOptions);

        it('should generate the right condition', () => {
          expect(filtersParser.getPreviousIntervalCondition(aggregator))
            .to.deep.equal(defaultDateCondition);
        });
      });
    });

    describe('not working scenarii', () => {
      describe('with \'and\' aggregator + flat conditions + 2 previous intervals', () => {
        const aggregator = JSON.stringify({
          aggregator: 'and',
          conditions: [defaultCondition, defaultDateCondition, defaultDateCondition],
        });
        const filtersParser = new FiltersParser(timezone, sequelizeOptions);

        it('should not generate conditions', () => {
          expect(filtersParser.getPreviousIntervalCondition(aggregator)).to.equal(null);
        });
      });

      describe('with \'or\' aggregator + flat conditions + 1 previous interval', () => {
        const aggregator = JSON.stringify({
          aggregator: 'or',
          conditions: [defaultCondition, defaultCondition2, defaultDateCondition],
        });
        const filtersParser = new FiltersParser(timezone, sequelizeOptions);

        it('should not generate conditions', () => {
          expect(filtersParser.getPreviousIntervalCondition(aggregator)).to.equal(null);
        });
      });

      describe('with \'and\' aggregator + flat conditions + 0 previous interval', () => {
        const aggregator = JSON.stringify({
          aggregator: 'and',
          conditions: [defaultCondition, defaultCondition2],
        });
        const filtersParser = new FiltersParser(timezone, sequelizeOptions);

        it('should not generate conditions', () => {
          expect(filtersParser.getPreviousIntervalCondition(aggregator)).to.equal(null);
        });
      });

      describe('with \'and\' aggregator + nested conditions + 1 previous interval', () => {
        const aggregator = JSON.stringify({
          aggregator: 'and',
          conditions: [{ aggregator: 'or', conditions: [defaultCondition, defaultCondition2] }, defaultDateCondition],
        });
        const filtersParser = new FiltersParser(timezone, sequelizeOptions);

        expect(filtersParser.getPreviousIntervalCondition(aggregator)).to.equal(null);
      });

      describe('with no aggregator + flat conditions + 0 previous interval', () => {
        const aggregator = JSON.stringify(defaultCondition);
        const filtersParser = new FiltersParser(timezone, sequelizeOptions);

        it('should not generate conditions', () => {
          expect(filtersParser.getPreviousIntervalCondition(aggregator)).to.equal(null);
        });
      });
    });
  });
});
