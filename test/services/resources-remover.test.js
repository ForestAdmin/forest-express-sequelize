import { scopeManager } from 'forest-express';
import Sequelize, { Op } from 'sequelize';
import { InvalidParameterError } from '../../src/services/errors';
import ResourcesRemover from '../../src/services/resources-remover';

describe('services > resources-remover', () => {
  const user = { renderingId: 1 };
  const params = { timezone: 'Europe/Paris' };

  const buildModelMock = (dialect) => {
    // Sequelize is created here without connection to a database
    const sequelize = new Sequelize({ dialect });

    const Actor = sequelize.define('actor', {});
    const Film = sequelize.define('film', {});
    const ActorFilm = sequelize.define('ActorFilem', {
      actorId: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
      },
      filmId: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
      },
    });

    ActorFilm.belongsTo(Actor);
    ActorFilm.belongsTo(Film);

    return { Actor, Film, ActorFilm };
  };

  ['mysql', 'mssql', 'postgres'].forEach((dialect) => {
    describe(`perform with ${dialect}`, () => {
      it('should throw error if ids is not an array or empty', async () => {
        expect.assertions(3);

        const { Actor } = buildModelMock(dialect);
        const spy = jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue(null);

        await expect(new ResourcesRemover(Actor, params, [], user).perform())
          .rejects
          .toBeInstanceOf(InvalidParameterError);

        await expect(new ResourcesRemover(Actor, params, 'foo', user).perform())
          .rejects
          .toBeInstanceOf(InvalidParameterError);

        await expect(new ResourcesRemover(Actor, params, {}, user).perform())
          .rejects
          .toBeInstanceOf(InvalidParameterError);

        spy.mockRestore();
      });

      it('should remove resources with a single primary key', async () => {
        expect.assertions(1);

        const { Actor } = buildModelMock(dialect);
        const spy = jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue(null);
        jest.spyOn(Actor, 'destroy').mockImplementation((condition) => {
          expect(condition).toStrictEqual({ where: { id: ['1', '2'] } });
        });

        await new ResourcesRemover(Actor, params, ['1', '2'], user).perform();
        spy.mockRestore();
      });

      it('should remove resources with composite keys', async () => {
        expect.assertions(1);

        const { ActorFilm } = buildModelMock(dialect);
        const spy = jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue(null);
        jest.spyOn(ActorFilm, 'destroy').mockImplementation((condition) => {
          expect(condition.where).toStrictEqual({
            [Op.or]: [
              { actorId: '1', filmId: '2' },
              { actorId: '3', filmId: '4' },
            ],
          });
        });

        await new ResourcesRemover(ActorFilm, params, ['1|2', '3|4'], user).perform();
        spy.mockRestore();
      });
    });
  });
});
