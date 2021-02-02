/* eslint-disable import/first */
jest.mock('forest-express');
import Sequelize from 'sequelize';
import ForestExpress from 'forest-express';
import { InvalidParameterError } from '../../src/services/errors';

function generateModels() {
  const sequelize = new Sequelize({ dialect: 'postgres' });

  const address = sequelize.define('address', {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
    },
    user_id: Sequelize.DataTypes.STRING,
  });

  const user = sequelize.define('user', {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
    },
    username: Sequelize.DataTypes.STRING,
  });

  address.belongsTo(user, {
    foreignKey: {
      name: 'userIdKey',
      field: 'user_id',
    },
    as: 'user',
  });

  user.hasMany(address, {
    foreignKey: {
      name: 'userIdKey',
      field: 'user_id',
    },
    as: 'addresses',
  });

  return { address, user };
}

// This function fakes the adapter logic to create a fake schema
function buildForestExpressSchema(models) {
  const schemas = Object.values(models).reduce((schema, model) => {
    schema[model.name] = {
      name: model.name,
      primaryKeys: Object.keys(model.primaryKeys),
      fields: [],
    };
    return schema;
  }, {});

  ForestExpress.Schemas = { schemas };
}

function importLeaderBoardStatGetter() {
  // eslint-disable-next-line global-require
  return require('../../src/services/leaderboard-stat-getter');
}

describe('services > leaderboard-stat-getter', () => {
  const VALID_PARAMETERS = {
    aggregate: 'Count',
    collection: 'user',
    label_field: 'username',
    limit: 5,
    relationship_field: 'addresses',
    timezone: 'Europe/Paris',
    type: 'Leaderboard',
  };

  it('identifier should be double quoted', async () => {
    expect.assertions(3);

    const models = generateModels();
    buildForestExpressSchema(models);

    const LeaderBoardStatGetter = importLeaderBoardStatGetter();

    const params = VALID_PARAMETERS;

    const connection = {
      query: jest.fn(() => Promise.resolve()),
    };

    const leaderBoardStatGetter = new LeaderBoardStatGetter(
      models.user,
      models.address,
      params,
      { connections: [connection] },
    );

    await leaderBoardStatGetter.perform();

    const builtQuery = connection.query.mock.calls[0][0];
    expect(builtQuery).toContain('"user"."username"');
    expect(builtQuery).not.toContain(`${VALID_PARAMETERS.limit}`);
    expect(connection.query.mock.calls[0][1]).toMatchObject({
      replacements: {
        limit: 5,
      },
    });
  });

  it('should throw an error if the aggregate function is not supported', async () => {
    expect.assertions(1);

    const models = generateModels();
    buildForestExpressSchema(models);

    const LeaderBoardStatGetter = importLeaderBoardStatGetter();

    const params = {
      ...VALID_PARAMETERS,
      aggregate: 'HACKY',
    };

    const connection = {
      query: jest.fn(() => Promise.resolve()),
    };

    expect(() => {
      // eslint-disable-next-line no-new
      new LeaderBoardStatGetter(
        models.user,
        models.address,
        params,
        { connections: [connection] },
      );
    }).toThrow(InvalidParameterError);
  });

  it('should throw an error if label_field does not exist', async () => {
    expect.assertions(1);

    const models = generateModels();
    buildForestExpressSchema(models);

    const LeaderBoardStatGetter = importLeaderBoardStatGetter();

    const params = {
      ...VALID_PARAMETERS,
      label_field: 'HACKY',
    };

    const connection = {
      query: jest.fn(() => Promise.resolve()),
    };

    expect(() => {
      // eslint-disable-next-line no-new
      new LeaderBoardStatGetter(
        models.user,
        models.address,
        params,
        { connections: [connection] },
      );
    }).toThrow(InvalidParameterError);
  });


  it('should throw an error if aggregate_field does not exist', async () => {
    expect.assertions(1);

    const models = generateModels();
    buildForestExpressSchema(models);

    const LeaderBoardStatGetter = importLeaderBoardStatGetter();

    const params = {
      ...VALID_PARAMETERS,
      aggregate_field: 'HACKY',
    };

    const connection = {
      query: jest.fn(() => Promise.resolve()),
    };

    expect(() => {
      // eslint-disable-next-line no-new
      new LeaderBoardStatGetter(
        models.user,
        models.address,
        params,
        { connections: [connection] },
      );
    }).toThrow(InvalidParameterError);
  });
});
