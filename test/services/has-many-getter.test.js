import Sequelize from 'sequelize';
import Interface from 'forest-express';
import HasManyGetter from '../../src/services/has-many-getter';
import Operators from '../../src/utils/operators';
import { sequelizePostgres } from '../databases';

describe('services > HasManyGetter', () => {
  const sequelizeOptions = {
    sequelize: Sequelize,
    Sequelize,
    connections: { sequelize: sequelizePostgres.createConnection() },
  };
  const { AND, OR, GT } = Operators.getInstance(sequelizeOptions);
  const timezone = 'Europe/Paris';

  describe('buildWhereConditions', () => {
    const associationName = 'users';
    const model = { name: 'cars' };
    const association = {
      name: 'users',
      rawAttributes: [{ field: 'name', type: 'String' }],
      sequelize: Sequelize,
    };
    Interface.Schemas = {
      schemas: {
        users: { fields: [{ field: 'name', type: 'String', columnName: 'name' }] },
        cars: { fields: [{ field: 'type' }] },
      },
    };

    describe('with no filters and search in params', () => {
      it('should build an empty where condition', async () => {
        expect.assertions(1);

        const hasManyGetter = new HasManyGetter(model, association, sequelizeOptions, { timezone });
        const whereConditions = await hasManyGetter.buildWhereConditions({ });
        expect(whereConditions).toStrictEqual({ [AND]: [] });
      });
    });

    describe('with filters in params', () => {
      it('should build a where condition containing the provided filters formatted', async () => {
        expect.assertions(1);
        const filters = '{ "field": "id", "operator": "greater_than", "value": 1 }';

        const hasManyGetter = new HasManyGetter(
          model, association, sequelizeOptions, { filters, timezone },
        );
        const whereConditions = await hasManyGetter.buildWhereConditions({ filters });
        expect(whereConditions).toStrictEqual({ [AND]: [{ id: { [GT]: 1 } }] });
      });
    });

    describe('with search in params', () => {
      it('should build a where condition containing the provided search', async () => {
        expect.assertions(1);
        const search = 'test';

        const hasManyGetter = new HasManyGetter(
          model, association, sequelizeOptions, { search, timezone },
        );
        const whereConditions = await hasManyGetter
          .buildWhereConditions({ search, associationName });

        expect(whereConditions).toStrictEqual({
          [AND]: [{
            [OR]: expect.arrayContaining([
              expect.objectContaining({
                attribute: { args: [{ col: 'users.name' }], fn: 'lower' },
                comparator: ' LIKE ',
                logic: { args: ['%test%'], fn: 'lower' },
              }),
            ]),
          }],
        });
      });
    });

    describe('with filters and search in params', () => {
      it('should build a where condition containing the provided filters and search', async () => {
        expect.assertions(1);
        const filters = '{ "field": "id", "operator": "greater_than", "value": 1 }';
        const search = 'test';

        const hasManyGetter = new HasManyGetter(
          model, association, sequelizeOptions, { filters, search, timezone },
        );
        const whereConditions = await hasManyGetter
          .buildWhereConditions({ search, filters, associationName });
        expect(whereConditions).toStrictEqual({
          [AND]: [{
            [OR]: expect.arrayContaining([
              expect.objectContaining({
                attribute: { args: [{ col: 'users.name' }], fn: 'lower' },
                comparator: ' LIKE ',
                logic: { args: ['%test%'], fn: 'lower' },
              }),
            ]),
          }, {
            id: { [GT]: 1 },
          }],
        });
      });
    });
  });
});
