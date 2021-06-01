import Interface, { scopeManager } from 'forest-express';
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
  const user = { renderingId: 1 };

  describe('_buildQueryOptions', () => {
    const options = { tableAlias: 'users' };
    const model = {
      name: 'cars',
      unscoped: () => model,
      sequelize: sequelizePostgres.connection,
      primaryKeys: { id: {} },
    };
    const association = {
      name: 'users',
      rawAttributes: [{ field: 'name', type: 'String' }],
      sequelize: sequelizePostgres.connection,
      unscoped: () => association,
      associations: { },
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
        const spy = jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue(null);

        const hasManyGetter = new HasManyGetter(model, association, lianaOptions, baseParams, user);
        const queryOptions = await hasManyGetter._buildQueryOptions(options);

        expect(queryOptions.where).toStrictEqual({ id: 1 });
        spy.mockRestore();
      });
    });

    describe('with filters in params', () => {
      it('should build a where condition containing the provided filters formatted', async () => {
        expect.assertions(1);
        const spy = jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue(null);

        const params = {
          ...baseParams,
          filters: '{ "field": "id", "operator": "greater_than", "value": 1 }',
        };
        const hasManyGetter = new HasManyGetter(model, association, lianaOptions, params, user);
        const queryOptions = await hasManyGetter._buildQueryOptions(options);

        expect(queryOptions.where).toStrictEqual({
          id: 1,
          '$users.id$': { [GT]: 1 },
        });
        spy.mockRestore();
      });
    });

    describe('with search in params', () => {
      it('should build a where condition containing the provided search', async () => {
        expect.assertions(1);
        const spy = jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue(null);

        const params = { ...baseParams, search: 'test' };
        const hasManyGetter = new HasManyGetter(model, association, lianaOptions, params, user);
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
        spy.mockRestore();
      });
    });

    describe('with filters and search in params', () => {
      it('should build a where condition containing the provided filters and search', async () => {
        expect.assertions(1);
        const spy = jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue(null);

        const params = {
          ...baseParams,
          filters: '{ "field": "id", "operator": "greater_than", "value": 1 }',
          search: 'test',
        };
        const hasManyGetter = new HasManyGetter(model, association, lianaOptions, params, user);
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
        spy.mockRestore();
      });
    });
  });
});
