import { scopeManager } from 'forest-express';
import Sequelize from 'sequelize';
import createError from 'http-errors';
import ResourceUpdater from '../../src/services/resource-updater';
import ResourceGetter from '../../src/services/resource-getter';
import QueryOptions from '../../src/services/query-options';

describe('services > resources-updater', () => {
  const user = { renderingId: 1 };
  const params = { timezone: 'Europe/Paris' };

  const buildModelMock = () => {
    // Sequelize is created here without connection to a database
    const sequelize = new Sequelize({ dialect: 'postgres' });

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

  describe('when it update with a scope and it is not in scope anymore', () => {
    it('should still return the record', async () => {
      expect.assertions(1);

      const { Film } = buildModelMock();
      jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue({ aggregator: 'and', conditions: [{ field: 'name', operator: 'contains', value: 'Scope value' }] });

      const record = { dataValues: { id: 1, title: 'The Godfather' }, validate: () => {}, save: () => {} };

      jest.spyOn(record, 'validate');
      jest.spyOn(record, 'save');

      const error = new Error('Record not found');
      error.statusCode = 404;
      jest
        .spyOn(ResourceGetter.prototype, 'perform')
        .mockRejectedValue(error);

      jest.spyOn(QueryOptions.prototype, 'filterByConditionTree').mockResolvedValue();

      const resourceUpdater = new ResourceUpdater(Film, params, { name: 'new name' }, user);
      jest.spyOn(resourceUpdater._model, 'findOne').mockReturnValue(record);

      const result = await resourceUpdater.perform();

      expect(result).toStrictEqual(record);
    });
  });

  describe('when it update with a scope but the record does not exist', () => {
    it('should throw 404', async () => {
      expect.assertions(1);

      const { Film } = buildModelMock();
      jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue({ aggregator: 'and', conditions: [{ field: 'name', operator: 'contains', value: 'Scope value' }] });

      const record = null;

      jest.spyOn(QueryOptions.prototype, 'filterByConditionTree').mockResolvedValue();

      const resourceUpdater = new ResourceUpdater(Film, { ...params, recordId: 2 }, { name: 'new name' }, user);
      jest.spyOn(resourceUpdater._model, 'findOne').mockReturnValue(record);

      await expect(resourceUpdater.perform()).rejects.toThrow(createError(404, 'The film #2 does not exist.'));
    });
  });

  describe('when there is a scope and ResourcesGetter throw an error', () => {
    it('should throw the error', async () => {
      expect.assertions(1);

      const { Film } = buildModelMock();
      jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue({ aggregator: 'and', conditions: [{ field: 'name', operator: 'contains', value: 'Scope value' }] });

      const record = { dataValues: { id: 1, title: 'The Godfather' }, validate: () => {}, save: () => {} };

      jest.spyOn(record, 'validate');
      jest.spyOn(record, 'save');

      const error = new Error('Unauthorized');
      error.statusCode = 401;
      jest
        .spyOn(ResourceGetter.prototype, 'perform')
        .mockRejectedValue(error);

      jest.spyOn(QueryOptions.prototype, 'filterByConditionTree').mockResolvedValue();

      const resourceUpdater = new ResourceUpdater(Film, { ...params, recordId: 2 }, { name: 'new name' }, user);
      jest.spyOn(resourceUpdater._model, 'findOne').mockReturnValue(record);

      await expect(resourceUpdater.perform()).rejects.toThrow(error);
    });
  });
});
