import Sequelize from 'sequelize';
import Interface from 'forest-express';
import QueryOptions from '../../src/services/query-options';

describe('services > query-options', () => {
  describe('order', () => {
    const buildModelMock = (dialect) => {
      // Sequelize is created here without connection to a database
      const sequelize = new Sequelize({ dialect });

      const modelActor = sequelize.define('actor', {});
      const modelMovie = sequelize.define('movie', {});

      modelActor.belongsTo(modelMovie);

      Interface.Schemas = { schemas: { actor: { idField: 'id' } } };

      return modelActor;
    };

    describe('with mssql', () => {
      const model = buildModelMock('mssql');

      it('should return null if the sorting params is the primarykey', async () => {
        expect.assertions(1);
        const options = new QueryOptions(model);
        await options.sort('id');
        expect(options.sequelizeOptions.order).toBeUndefined();
      });
    });

    ['mysql', 'postgres'].forEach((dialect) => {
      describe(`with ${dialect}`, () => {
        const model = buildModelMock(dialect);

        it('should return null if there is no sort param', async () => {
          expect.assertions(1);
          const options = new QueryOptions(model);
          await options.sort();
          expect(options.sequelizeOptions.order).toBeUndefined();
        });

        it('should set order ASC by default', async () => {
          expect.assertions(1);
          const options = new QueryOptions(model);
          await options.sort('id');
          expect(options.sequelizeOptions.order).toStrictEqual([['id', 'ASC']]);
        });

        it('should set order DESC if there is a minus sign', async () => {
          expect.assertions(1);
          const options = new QueryOptions(model);
          await options.sort('-id');
          expect(options.sequelizeOptions.order).toStrictEqual([['id', 'DESC']]);
        });
      });
    });
  });
});
