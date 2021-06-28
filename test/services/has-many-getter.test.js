import Interface from 'forest-express';
import Sequelize from 'sequelize';
import HasManyGetter from '../../src/services/has-many-getter';
import Operators from '../../src/utils/operators';
import { sequelizePostgres } from '../databases';

describe('services > HasManyGetter', () => {
  const lianaOptions = {
    sequelize: Sequelize,
    Sequelize,
    connections: { sequelize: sequelizePostgres.createConnection() },
  };
  const { OR, GT } = Operators.getInstance(lianaOptions);
  const timezone = 'Europe/Paris';
  const baseParams = { timezone, associationName: 'users', recordId: 1 };

  describe('_buildQueryOptions', () => {
    const options = { tableAlias: 'users' };
    const UserModel = {
      name: 'users',
      rawAttributes: [{ field: 'name', type: 'String' }],
      sequelize: sequelizePostgres.connection,
      unscoped: () => UserModel,
      associations: { },
    };
    const CarModel = {
      name: 'cars',
      unscoped: () => CarModel,
      sequelize: sequelizePostgres.connection,
      primaryKeys: { id: {} },
      associations: { users: { target: UserModel } },
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

        const hasManyGetter = new HasManyGetter(CarModel, UserModel, lianaOptions, baseParams);
        const queryOptions = await hasManyGetter._buildQueryOptions(options);

        expect(queryOptions.where).toStrictEqual({ id: 1 });
      });
    });

    describe('with filters in params', () => {
      it('should build a where condition containing the provided filters formatted', async () => {
        expect.assertions(1);

        const params = {
          ...baseParams,
          filters: '{ "field": "id", "operator": "greater_than", "value": 1 }',
        };
        const hasManyGetter = new HasManyGetter(CarModel, UserModel, lianaOptions, params);
        const queryOptions = await hasManyGetter._buildQueryOptions(options);

        expect(queryOptions.where).toStrictEqual({
          id: 1,
          '$users.id$': { [GT]: 1 },
        });
      });
    });

    describe('with search in params', () => {
      it('should build a where condition containing the provided search', async () => {
        expect.assertions(1);

        const params = { ...baseParams, search: 'test' };
        const hasManyGetter = new HasManyGetter(CarModel, UserModel, lianaOptions, params);
        const queryOptions = await hasManyGetter._buildQueryOptions(options);

        expect(queryOptions.where).toStrictEqual({
          id: 1,
          [OR]: expect.arrayContaining([
            expect.objectContaining({
              attribute: { args: [{ col: 'users.name' }], fn: 'lower' },
              comparator: ' LIKE ',
              logic: { args: ['%test%'], fn: 'lower' },
            }),
          ]),
        });
      });
    });

    describe('with filters and search in params', () => {
      it('should build a where condition containing the provided filters and search', async () => {
        expect.assertions(1);

        const params = {
          ...baseParams,
          filters: '{ "field": "id", "operator": "greater_than", "value": 1 }',
          search: 'test',
        };
        const hasManyGetter = new HasManyGetter(CarModel, UserModel, lianaOptions, params);
        const queryOptions = await hasManyGetter._buildQueryOptions(options);

        expect(queryOptions.where).toStrictEqual({
          id: 1,
          '$users.id$': { [GT]: 1 },
          [OR]: expect.arrayContaining([
            expect.objectContaining({
              attribute: { args: [{ col: 'users.name' }], fn: 'lower' },
              comparator: ' LIKE ',
              logic: { args: ['%test%'], fn: 'lower' },
            }),
          ]),
        });
      });
    });
  });
});
