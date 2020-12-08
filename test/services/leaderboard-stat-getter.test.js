/* eslint-disable import/first */
jest.mock('forest-express');
import Sequelize from 'sequelize';
import ForestExpress from 'forest-express';

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

// This funtion fake the adapter work to create a fake schema
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
  it('identifier should be double quoted', async () => {
    expect.assertions(1);
    const models = generateModels();
    buildForestExpressSchema(models);

    const LeaderBoardStatGetter = importLeaderBoardStatGetter();

    const params = {
      aggregate: 'Count',
      collection: 'user',
      label_field: 'username',
      limit: 5,
      relationship_field: 'addresses',
      timezone: 'Europe/Paris',
      type: 'Leaderboard',
    };

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

    const buildedQuery = connection.query.mock.calls[0][0];
    expect(buildedQuery).toContain('"user"."username"');
  });
});
