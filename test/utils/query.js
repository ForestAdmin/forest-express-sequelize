/* global describe, it */
import { expect } from 'chai';
import { getReferenceField } from '../../src/utils/query';

describe('Utils > Query', () => {
  describe('#getReferenceField', () => {
    describe('with a reference field with unconventional name', () => {
      it('should return a valid reference field value', () => {
        const modelSchema = {
          fields: [{ field: 'car', reference: 'car.id' }],
        };
        const schemas = {
          driver: modelSchema,
          car: {
            fields: [{ field: 'brandName', columnName: 'brand_name' }],
          },
        };
        expect(getReferenceField(schemas, modelSchema, 'car', 'brandName')).equal('car.brand_name');
      });
    });
  });
});
