import Sequelize from 'sequelize';
import Interface from 'forest-express';
import QueryOptions from '../../src/services/query-options';

describe('services > query-options', () => {
  const resetSchema = () => {
    Interface.Schemas = {
      schemas: {
        actor: {
          idField: 'id',
          fields: [{ field: 'smartField' }, { field: 'secondSmartField' }],
        },
      },
    };
  };

  const buildModelMock = (dialect) => {
    // Sequelize is created here without connection to a database
    const sequelize = new Sequelize({ dialect });

    const modelActor = sequelize.define('actor', {});
    const modelMovie = sequelize.define('movie', {});

    resetSchema();

    modelActor.belongsTo(modelMovie);

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
          resetSchema();
        });
      });

      it('should add the search includes', async () => {
        expect.assertions(1);

        Interface.Schemas.schemas.actor.fields[0].search = async (query) => {
          await Promise.resolve();
          query.include.push('movie');
        };
        Interface.Schemas.schemas.actor.fields[1].search = async (query) => {
          await Promise.resolve();
          query.include.push('toto');
        };

        const options = new QueryOptions(model);
        await options.search('search string', null);
        expect(options._customerIncludes).toStrictEqual(['movie', 'toto']);

        resetSchema();
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
        resetSchema();
      });
    });

    describe('when smartField return none array include', () => {
      it('should transform to include to array', async () => {
        expect.assertions(1);

        Interface.Schemas.schemas.actor.fields[0].search = (query) => { query.include.push = 'movie'; };

        const options = new QueryOptions(model);
        await options.search('search string', null);
        expect(options._customerIncludes).toStrictEqual(['movie']);

        resetSchema();
      });
    });
  });
});
