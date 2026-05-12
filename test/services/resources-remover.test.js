import Interface, { scopeManager } from 'forest-express';
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

  describe('when scope targets a relation field', () => {
    const scope = { field: 'film:id', operator: 'present', value: null };

    const setup = () => {
      const { Actor, Film, ActorFilm } = buildModelMock('postgres');
      Actor.belongsTo(Film);

      Interface.Schemas.schemas = {
        actor: {
          name: 'actor',
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'film', reference: 'film.id' },
          ],
          primaryKeys: ['id'],
          idField: 'id',
        },
        ActorFilem: {
          name: 'ActorFilem',
          fields: [
            { field: 'actorId', type: 'Number' },
            { field: 'filmId', type: 'Number' },
            { field: 'film', reference: 'film.id' },
          ],
          primaryKeys: ['actorId', 'filmId'],
          idField: 'actorId|filmId',
        },
        film: {
          name: 'film',
          fields: [{ field: 'id', type: 'Number' }],
          primaryKeys: ['id'],
          idField: 'id',
        },
      };

      const scopeSpy = jest.spyOn(scopeManager, 'getScopeForUser').mockResolvedValue(scope);
      const restore = () => {
        scopeSpy.mockRestore();
        Interface.Schemas.schemas = {};
      };

      return { Actor, ActorFilm, restore };
    };

    it('should resolve PKs via findAll, then destroy by Op.in for single-PK models', async () => {
      expect.assertions(4);

      const { Actor, restore } = setup();
      const findAllSpy = jest.spyOn(Actor, 'findAll').mockResolvedValue([
        { get: () => 7 },
        { get: () => 42 },
      ]);
      const destroySpy = jest.spyOn(Actor, 'destroy').mockResolvedValue(2);

      await new ResourcesRemover(Actor, params, ['7', '42'], user).perform();

      expect(findAllSpy).toHaveBeenCalledTimes(1);
      expect(findAllSpy.mock.calls[0][0].include).toStrictEqual(
        expect.arrayContaining([expect.objectContaining({ as: 'film' })]),
      );
      expect(destroySpy).toHaveBeenCalledTimes(1);
      expect(destroySpy).toHaveBeenCalledWith({ where: { id: [7, 42] } });

      findAllSpy.mockRestore();
      destroySpy.mockRestore();
      restore();
    });

    it('should destroy by Op.or for composite-PK models', async () => {
      expect.assertions(1);

      const { ActorFilm, restore } = setup();
      const findAllSpy = jest.spyOn(ActorFilm, 'findAll').mockResolvedValue([
        { get: (key) => ({ actorId: 1, filmId: 2 }[key]) },
        { get: (key) => ({ actorId: 3, filmId: 4 }[key]) },
      ]);
      const destroySpy = jest.spyOn(ActorFilm, 'destroy').mockResolvedValue(2);

      await new ResourcesRemover(ActorFilm, params, ['1|2', '3|4'], user).perform();

      expect(destroySpy).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { actorId: 1, filmId: 2 },
            { actorId: 3, filmId: 4 },
          ],
        },
      });

      findAllSpy.mockRestore();
      destroySpy.mockRestore();
      restore();
    });

    it('should not call destroy when no record matches the scope', async () => {
      expect.assertions(2);

      const { ActorFilm, restore } = setup();
      const findAllSpy = jest.spyOn(ActorFilm, 'findAll').mockResolvedValue([]);
      const destroySpy = jest.spyOn(ActorFilm, 'destroy');

      const removed = await new ResourcesRemover(ActorFilm, params, ['1|2'], user).perform();

      expect(destroySpy).not.toHaveBeenCalled();
      expect(removed).toBe(0);

      findAllSpy.mockRestore();
      destroySpy.mockRestore();
      restore();
    });
  });
});
