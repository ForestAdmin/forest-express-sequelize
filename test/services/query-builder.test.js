import Sequelize from 'sequelize';
import Interface from 'forest-express';
import QueryBuilder from '../../src/services/query-builder';

describe('services > query-builder', () => {
  describe('getIncludes', () => {
    ['HasOne', 'BelongsTo'].forEach((associationType) => {
      describe(`with a ${associationType} relationship`, () => {
        function setup() {
          const target = {
            primaryKeyAttributes: ['id'],
            tableAttributes: {
              id: { field: 'Uid', fieldName: 'uid' },
              name: { field: 'Name', fieldName: 'name' },
            },
            unscoped: () => ({ name: 'user' }),
          };

          const association = {
            associationType,
            as: 'user',
            associationAccessor: 'userAccessor',
            target,
            sourceKey: 'id',
          };

          const model = {
            name: 'address',
            associations: [association],
          };

          const sequelizeOptions = { sequelize: Sequelize };
          Interface.Schemas = { schemas: { actor: { idField: 'id' } } };

          const queryBuilder = new QueryBuilder(model, sequelizeOptions, {});

          return {
            association, model, target, queryBuilder,
          };
        }

        it('should exclude field names that do not exist on the table', async () => {
          expect.assertions(1);
          const { model, queryBuilder } = setup();

          const includes = queryBuilder.getIncludes(model, ['user.uid', 'user.name', 'user.id', 'user.badField']);

          expect(includes).toStrictEqual([{
            as: 'userAccessor',
            attributes: ['uid', 'name'],
            model: { name: 'user' },
          }]);
        });

        it('should always include the primary key even if not specified', () => {
          expect.assertions(1);
          const { model, queryBuilder } = setup();

          const includes = queryBuilder.getIncludes(model, ['user.name', 'user.id', 'user.badField']);

          expect(includes).toStrictEqual([{
            as: 'userAccessor',
            attributes: ['uid', 'name'],
            model: { name: 'user' },
          }]);
        });
      });
    });
  });
});
