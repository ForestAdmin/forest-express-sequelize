import moment from 'moment';
import Sequelize from 'sequelize';
import FiltersParser from '../../src/services/filters-parser';
import Operators from '../../src/utils/operators';
import { NoMatchingOperatorError } from '../../src/services/errors';

describe('services > filters-parser', () => {
  const schema = {
    fields: [],
  };
  const sequelizeOptions = {
    sequelize: Sequelize,
  };
  const timezone = 'Europe/Paris';
  const OPERATORS = new Operators(sequelizeOptions);
  const defaultFiltersParser = new FiltersParser(schema, timezone, sequelizeOptions);

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
    { operator: OPERATORS.GTE, value: moment().subtract(1, 'week').startOf('isoweek').toDate() },
    { operator: OPERATORS.LTE, value: moment().subtract(1, 'week').endOf('isoweek').toDate() },
  ]);

  describe('formatOperatorValue function', () => {
    const values = [5, 'toto', null];

    values.forEach((value) => {
      it(`should return the appropriate value (${typeof value})`, () => {
        expect.assertions(14);
        expect(defaultFiltersParser.formatOperatorValue('starts_with', value)).toStrictEqual({ [OPERATORS.LIKE]: `${value}%` });
        expect(defaultFiltersParser.formatOperatorValue('ends_with', value)).toStrictEqual({ [OPERATORS.LIKE]: `%${value}` });
        expect(defaultFiltersParser.formatOperatorValue('contains', value)).toStrictEqual({ [OPERATORS.LIKE]: `%${value}%` });
        expect(defaultFiltersParser.formatOperatorValue('not', value)).toStrictEqual({ [OPERATORS.NOT]: value });
        expect(defaultFiltersParser.formatOperatorValue('greater_than', value)).toStrictEqual({ [OPERATORS.GT]: value });
        expect(defaultFiltersParser.formatOperatorValue('less_than', value)).toStrictEqual({ [OPERATORS.LT]: value });
        expect(defaultFiltersParser.formatOperatorValue('before', value)).toStrictEqual({ [OPERATORS.LT]: value });
        expect(defaultFiltersParser.formatOperatorValue('after', value)).toStrictEqual({ [OPERATORS.GT]: value });
        expect(defaultFiltersParser.formatOperatorValue('not_contains', value)).toStrictEqual({ [OPERATORS.NOT_LIKE]: `%${value}%` });
        expect(defaultFiltersParser.formatOperatorValue('not_equal', value)).toStrictEqual({ [OPERATORS.NE]: value });
        expect(defaultFiltersParser.formatOperatorValue('present', value)).toStrictEqual({ [OPERATORS.NE]: null });
        expect(defaultFiltersParser.formatOperatorValue('equal', value)).toStrictEqual({ [OPERATORS.EQ]: value });
        expect(defaultFiltersParser.formatOperatorValue('blank', value)).toStrictEqual({ [OPERATORS.EQ]: null });
        expect(defaultFiltersParser.formatOperatorValue('blank', value, true)).toStrictEqual({
          [OPERATORS.OR]: [{
            [OPERATORS.EQ]: null,
          }, {
            [OPERATORS.EQ]: '',
          }],
        });
      });

      it('should raise an error on unknown operator', () => {
        expect.assertions(1);
        expect(defaultFiltersParser.formatOperatorValue.bind('random', value)).toThrow(NoMatchingOperatorError);
      });
    });
  });

  describe('formatAggregatorOperator function', () => {
    it('should return the appropriate sequelize operator', () => {
      expect.assertions(2);
      expect(defaultFiltersParser.formatAggregatorOperator('and')).toStrictEqual(OPERATORS.AND);
      expect(defaultFiltersParser.formatAggregatorOperator('or')).toStrictEqual(OPERATORS.OR);
    });

    it('should raise an error on unknown operator', () => {
      expect.assertions(1);
      expect(defaultFiltersParser.formatAggregatorOperator.bind('random')).toThrow(NoMatchingOperatorError);
    });
  });

  describe('formatField function', () => {
    it('should format default field correctly', () => {
      expect.assertions(1);
      expect(defaultFiltersParser.formatField('myField')).toStrictEqual('myField');
    });

    it('should format nested fields correctly', () => {
      expect.assertions(1);
      expect(defaultFiltersParser.formatField('myCollection:myField')).toStrictEqual('$myCollection.myField$');
    });
  });

  describe('formatCondition function', () => {
    it('should handle basic condition correctly', async () => {
      expect.assertions(1);
      expect(await defaultFiltersParser.formatCondition(defaultCondition))
        .toStrictEqual(defaultExpectedCondition);
    });

    it('should handle time/date condition correctly', async () => {
      expect.assertions(1);
      expect(await defaultFiltersParser.formatCondition(defaultDateCondition))
        .toStrictEqual(defaultExpectedDateCondition);
    });

    it('should throw an error on empty condition', async () => {
      expect.assertions(2);
      await expect(defaultFiltersParser.formatCondition()).rejects.toThrow(Error);
      await expect(defaultFiltersParser.formatCondition({})).rejects.toThrow(Error);
    });
  });

  describe('formatAggregation function', () => {
    it('should format correctly with \'and\' as aggregator', async () => {
      expect.assertions(1);
      const expectedFormatedAggregation = {
        [OPERATORS.AND]: [defaultExpectedCondition, defaultExpectedDateCondition],
      };

      expect(await defaultFiltersParser.formatAggregation('and', [
        defaultExpectedCondition,
        defaultExpectedDateCondition,
      ])).toStrictEqual(expectedFormatedAggregation);
    });

    it('should format correctly with \'or\' as aggregator', async () => {
      expect.assertions(1);
      const expectedFormatedAggregation = {
        [OPERATORS.OR]: [defaultExpectedCondition, defaultExpectedDateCondition],
      };

      expect(await defaultFiltersParser.formatAggregation('or', [
        defaultExpectedCondition,
        defaultExpectedDateCondition,
      ])).toStrictEqual(expectedFormatedAggregation);
    });

    it('should format correctly with \'and\' as nested aggregators', async () => {
      expect.assertions(1);
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

      expect(await defaultFiltersParser.formatAggregation('or', [
        defaultExpectedDateCondition,
        expectedNestedAggregation,
      ])).toStrictEqual(expectedFormatedAggregation);
    });

    it('should throw an error on empty condition', async () => {
      expect.assertions(2);
      await expect(defaultFiltersParser.formatAggregation()).rejects.toThrow(Error);
      await expect(defaultFiltersParser.formatAggregation({})).rejects.toThrow(Error);
    });
  });

  describe('perform function', () => {
    describe('with nothing provided', () => {
      it('should be null', async () => {
        expect.assertions(1);
        expect(await defaultFiltersParser.perform()).toBeNull();
      });
    });

    describe('with a filter on a reference', () => {
      const schemaWithFields = {
        fields: [{ field: 'car', reference: 'car.id' }],
      };
      const filters = '{ "field": "car:brandName", "operator": "starts_with", "value": "Ferrari" }';
      const filtersParser = new FiltersParser(schemaWithFields, timezone, sequelizeOptions);

      it('should not be null', async () => {
        expect.assertions(1);
        expect(await filtersParser.perform(filters))
          .toStrictEqual({ '$car.brandName$': { [OPERATORS.LIKE]: 'Ferrari%' } });
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
        const filtersParser = new FiltersParser(schema, timezone, sequelizeOptions);

        it('should generate the right condition', () => {
          expect.assertions(1);
          expect(filtersParser.getPreviousIntervalCondition(aggregator))
            .toStrictEqual(defaultDateCondition);
        });
      });

      describe('with no aggregator + flat conditions + 1 previous interval', () => {
        const aggregator = JSON.stringify(defaultDateCondition);
        const filtersParser = new FiltersParser(schema, timezone, sequelizeOptions);

        it('should generate the right condition', () => {
          expect.assertions(1);
          expect(filtersParser.getPreviousIntervalCondition(aggregator))
            .toStrictEqual(defaultDateCondition);
        });
      });
    });

    describe('not working scenarii', () => {
      describe('with \'and\' aggregator + flat conditions + 2 previous intervals', () => {
        const aggregator = JSON.stringify({
          aggregator: 'and',
          conditions: [defaultCondition, defaultDateCondition, defaultDateCondition],
        });
        const filtersParser = new FiltersParser(schema, timezone, sequelizeOptions);

        it('should not generate conditions', () => {
          expect.assertions(1);
          expect(filtersParser.getPreviousIntervalCondition(aggregator)).toBeNull();
        });
      });

      describe('with \'or\' aggregator + flat conditions + 1 previous interval', () => {
        const aggregator = JSON.stringify({
          aggregator: 'or',
          conditions: [defaultCondition, defaultCondition2, defaultDateCondition],
        });
        const filtersParser = new FiltersParser(schema, timezone, sequelizeOptions);

        it('should not generate conditions', () => {
          expect.assertions(1);
          expect(filtersParser.getPreviousIntervalCondition(aggregator)).toBeNull();
        });
      });

      describe('with \'and\' aggregator + flat conditions + 0 previous interval', () => {
        const aggregator = JSON.stringify({
          aggregator: 'and',
          conditions: [defaultCondition, defaultCondition2],
        });
        const filtersParser = new FiltersParser(schema, timezone, sequelizeOptions);

        it('should not generate conditions', () => {
          expect.assertions(1);
          expect(filtersParser.getPreviousIntervalCondition(aggregator)).toBeNull();
        });
      });

      describe('with \'and\' aggregator + nested conditions + 1 previous interval', () => {
        const aggregator = JSON.stringify({
          aggregator: 'and',
          conditions: [{ aggregator: 'or', conditions: [defaultCondition, defaultCondition2] }, defaultDateCondition],
        });
        const filtersParser = new FiltersParser(schema, timezone, sequelizeOptions);

        it('should not generate conditions', () => {
          expect.assertions(1);
          expect(filtersParser.getPreviousIntervalCondition(aggregator)).toBeNull();
        });
      });

      describe('with no aggregator + flat conditions + 0 previous interval', () => {
        const aggregator = JSON.stringify(defaultCondition);
        const filtersParser = new FiltersParser(schema, timezone, sequelizeOptions);

        it('should not generate conditions', () => {
          expect.assertions(1);
          expect(filtersParser.getPreviousIntervalCondition(aggregator)).toBeNull();
        });
      });
    });
  });
});
