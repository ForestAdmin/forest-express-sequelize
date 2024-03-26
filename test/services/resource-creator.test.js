import Interface, { scopeManager } from 'forest-express';
import Sequelize from 'sequelize';
import associationRecord from '../../src/utils/association-record';
import ResourceCreator from '../../src/services/resource-creator';
import ResourceGetter from '../../src/services/resource-getter';

describe('services > resource-creator', () => {
  const user = { renderingId: 1 };
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

    Interface.Schemas.schemas[Actor.name] = {};
    Interface.Schemas.schemas[Film.name] = {};

    return { Actor, Author, Film };
  };

  describe('perform', () => {
    describe('when the getter does not found the record', () => {
      it('should catch the 404 error and return the record', async () => {
        expect.assertions(1);

        const { Film } = buildModelMock();
        const record = { dataValues: { id: 1, title: 'The Godfather' } };

        const error = new Error('Record not found');
        error.statusCode = 404;
        jest
          .spyOn(ResourceGetter.prototype, 'perform')
          .mockRejectedValue(error);

        jest.spyOn(Film.prototype, 'save').mockReturnValue(record);
        jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue({});

        const body = { actor: 2 };

        const resourceCreator = new ResourceCreator(Film, params, body, user);
        const result = await resourceCreator.perform();
        expect(result).toStrictEqual(record);
      });
    });
  });

  describe('_getTargetKey', () => {
    describe('when association does not have entry in body', () => {
      it('should return null', async () => {
        expect.assertions(2);

        const { Film, Actor } = buildModelMock();

        const body = {};

        const spy = jest.spyOn(associationRecord, 'get');

        const resourceCreator = new ResourceCreator(Film, params, body, user);
        const targetKey = await resourceCreator._getTargetKey(
          Actor.name,
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

        const body = { [Actor.name]: null };

        const spy = jest.spyOn(associationRecord, 'get');

        const resourceCreator = new ResourceCreator(Film, params, body, user);
        const targetKey = await resourceCreator._getTargetKey(
          Actor.name,
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

        const body = { [Actor.name]: 2 };

        const spy = jest.spyOn(associationRecord, 'get');

        const resourceCreator = new ResourceCreator(Film, params, body, user);
        const targetKey = await resourceCreator._getTargetKey(
          Actor.name,
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

        const body = { [Author.name]: 2 };

        const spy = jest.spyOn(associationRecord, 'get').mockResolvedValue({ id: 2, name: 'Scorsese' });

        const resourceCreator = new ResourceCreator(Film, params, body, user);
        const targetKey = await resourceCreator._getTargetKey(
          Author.name,
          Film.associations[Author.name],
        );

        expect(spy).toHaveBeenCalledWith(Author, 2);
        expect(targetKey).toStrictEqual('Scorsese');
      });
    });
  });
});
