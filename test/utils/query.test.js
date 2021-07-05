const { Sequelize } = require('sequelize');
const { getReferenceField, mergeWhere } = require('../../src/utils/query');

const operators = { AND: '$and' };

describe('utils > query', () => {
  describe('getReferenceField', () => {
    it('should return a valid reference when the field name is camelCased', () => {
      expect.assertions(1);

      const modelSchema = {
        fields: [{ field: 'car', reference: 'car.id' }],
      };
      const schemas = {
        driver: modelSchema,
        car: { fields: [{ field: 'brandName', columnName: 'brand_name' }] },
      };

      const field = getReferenceField(schemas, modelSchema, 'car', 'brandName');
      expect(field).toStrictEqual('car.brand_name');
    });
  });

  describe('mergeWhere', () => {
    it('should work if only one simple condition is passed', () => {
      expect.assertions(1);

      const condition = mergeWhere(operators, { id: 1 });
      expect(condition).toStrictEqual({ id: 1 });
    });

    it('should work if only one unmergeable condition is passed', () => {
      expect.assertions(1);

      const condition = mergeWhere(operators, Sequelize.literal('FALSE'));
      expect(condition).toStrictEqual(Sequelize.literal('FALSE'));
    });

    it('should merge conditions where different keys are used', () => {
      expect.assertions(1);

      const condition = mergeWhere(operators, { id: 1 }, { name: 'John' });
      expect(condition).toStrictEqual({
        id: 1,
        name: 'John',
      });
    });

    it('should not merge conditions where the same keys are used', () => {
      expect.assertions(1);

      const condition = mergeWhere(operators, { id: 1 }, { id: 2 });
      expect(condition).toStrictEqual({
        $and: [
          { id: 1 },
          { id: 2 },
        ],
      });
    });

    it('should not merge conditions which are not plain objects', () => {
      expect.assertions(1);

      const condition = mergeWhere(operators, { id: 1 }, Sequelize.literal('FALSE'));
      expect(condition).toStrictEqual({
        $and: [
          { id: 1 },
          Sequelize.literal('FALSE'),
        ],
      });
    });
  });
});
