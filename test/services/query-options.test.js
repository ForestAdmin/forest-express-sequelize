import Sequelize from 'sequelize';
import Interface from 'forest-express';
import QueryOptions from '../../src/services/query-options';

describe('services > query-options', () => {
  const buildModelMock = (dialect) => {
    // Sequelize is created here without connection to a database
    const sequelize = new Sequelize({ dialect });

    const modelActor = sequelize.define('actor', {});
    const modelMovie = sequelize.define('movie', {});

    modelActor.belongsTo(modelMovie);

    Interface.Schemas = {
      schemas: {
        actor: {
          idField: 'id',
          fields: [{ field: 'smartField' }],
        },
      },
    };

    return modelActor;
  };

  describe('order', () => {
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

  describe('search', () => {
    const model = buildModelMock('postgres');

    describe('when search on smart field is async', () => {
      describe('when promise reject', () => {
        it('should display an error message', async () => {
          expect.assertions(1);

          const loggerErrorSpy = jest.spyOn(Interface.logger, 'error');

          const errorThrown = new Error('unexpected error');
          Interface.Schemas.schemas.actor.fields[0].search = async () =>
            Promise.reject(errorThrown);

          const options = new QueryOptions(model);
          await options.search('search string', null);
          expect(loggerErrorSpy).toHaveBeenCalledWith('Cannot search properly on Smart Field smartField', errorThrown);

          loggerErrorSpy.mockClear();
        });
      });

      it('should add the search query', async () => {
        expect.assertions(1);

        Interface.Schemas.schemas.actor.fields[0].search = async (query) => {
          await Promise.resolve();
          query.include = ['movie'];
        };

        const options = new QueryOptions(model);
        await options.search('search string', null);
        expect(options._customerIncludes).toStrictEqual(['movie']);
      });
    });

    describe('when search on smart field throw an error', () => {
      it('should display an error message', async () => {
        expect.assertions(1);

        const loggerErrorSpy = jest.spyOn(Interface.logger, 'error');

        const errorThrown = new Error('unexpected error');
        Interface.Schemas.schemas.actor.fields[0].search = () => { throw errorThrown; };

        const options = new QueryOptions(model);
        await options.search('search string', null);
        expect(loggerErrorSpy).toHaveBeenCalledWith('Cannot search properly on Smart Field smartField', errorThrown);

        loggerErrorSpy.mockClear();
      });
    });

    describe('when smartField return none array include', () => {
      it('should transform to include to array', async () => {
        expect.assertions(1);

        Interface.Schemas.schemas.actor.fields[0].search = (query) => { query.include = 'movie'; };

        const options = new QueryOptions(model);
        await options.search('search string', null);
        expect(options._customerIncludes).toStrictEqual(['movie']);
      });
    });
  });
});
