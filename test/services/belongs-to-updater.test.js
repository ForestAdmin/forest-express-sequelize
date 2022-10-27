import Sequelize from 'sequelize';
import associationRecord from '../../src/utils/association-record';
import BelongsToUpdater from '../../src/services/belongs-to-updater';

describe('services > belongs-to-updater', () => {
  const params = { timezone: 'Europe/Paris' };

  const buildModelMock = () => {
    // Sequelize is created here without connection to a database
    const sequelize = new Sequelize({ dialect: 'postgres' });

    const Actor = sequelize.define('actor', {
      Id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
      },
    });
    const Author = sequelize.define('author', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
      },
      name: {
        type: Sequelize.DataTypes.STRING,
        unique: true,
      },
    });
    const Film = sequelize.define('film', {});

    Film.belongsTo(Actor);
    Film.belongsTo(Author, {
      targetKey: 'name',
    });

    return { Actor, Author, Film };
  };

  describe('_getTargetKey', () => {
    describe('when association does not have entry in data', () => {
      it('should return null', async () => {
        expect.assertions(2);

        const { Film, Actor } = buildModelMock();

        const data = {};

        const spy = jest.spyOn(associationRecord, 'get');

        const belongsToUpdater = new BelongsToUpdater(Film, null, null, params, { data });
        const targetKey = await belongsToUpdater._getTargetKey(
          Film.associations[Actor.name],
        );

        expect(spy).not.toHaveBeenCalled();
        expect(targetKey).toBeNil();
      });
    });

    describe('when association does not have value in body', () => {
      it('should return null', async () => {
        expect.assertions(2);

        const { Film, Actor } = buildModelMock();

        const data = { id: null };

        const spy = jest.spyOn(associationRecord, 'get');

        const belongsToUpdater = new BelongsToUpdater(Film, null, null, params, { data });
        const targetKey = await belongsToUpdater._getTargetKey(
          Film.associations[Actor.name],
        );

        expect(spy).not.toHaveBeenCalled();
        expect(targetKey).toBeNil();
      });
    });

    describe('when association target key is the primary key', () => {
      it('should return the body value', async () => {
        expect.assertions(2);

        const { Film, Actor } = buildModelMock();

        const data = { id: 2 };

        const spy = jest.spyOn(associationRecord, 'get');

        const belongsToUpdater = new BelongsToUpdater(Film, null, null, params, { data });
        const targetKey = await belongsToUpdater._getTargetKey(
          Film.associations[Actor.name],
        );

        expect(spy).not.toHaveBeenCalled();
        expect(targetKey).toStrictEqual(2);
      });
    });

    describe('when association target key is not the primary key', () => {
      it('should return the right value', async () => {
        expect.assertions(2);

        const { Film, Author } = buildModelMock();

        const data = { id: 2 };

        const spy = jest.spyOn(associationRecord, 'get').mockResolvedValue({ id: 2, name: 'Scorsese' });

        const belongsToUpdater = new BelongsToUpdater(Film, null, null, params, { data });
        const targetKey = await belongsToUpdater._getTargetKey(
          Film.associations[Author.name],
        );

        expect(spy).toHaveBeenCalledWith(Author, 2);
        expect(targetKey).toStrictEqual('Scorsese');
      });
    });
  });
});
