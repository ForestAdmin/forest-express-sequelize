const { getReferenceField } = require('../../src/utils/query');

describe('utils > query', () => {
  describe('#getReferenceField', () => {
    describe('with a reference field with unconventional name', () => {
      it('should return a valid reference field value', () => {
        expect.assertions(1);
        const modelSchema = {
          fields: [{ field: 'car', reference: 'car.id' }],
        };
        const schemas = {
          driver: modelSchema,
          car: {
            fields: [{ field: 'brandName', columnName: 'brand_name' }],
          },
        };
        expect(getReferenceField(schemas, modelSchema, 'car', 'brandName')).toStrictEqual('car.brand_name');
      });
    });
  });
});
