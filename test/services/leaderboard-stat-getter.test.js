/* eslint-disable import/first */
jest.mock('forest-express');
jest.mock('../../src/utils/orm');
import Sequelize from 'sequelize';
import ForestExpress from 'forest-express';
import Orm from '../../src/utils/orm';

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

address.primaryKeys = Object.keys(address.primaryKeys);

ForestExpress.Schemas = { schemas: { user, address } };

jest.spyOn(Orm, 'getColumnName').mockReturnValue('id');

import LeaderBoardStatGetter from '../../src/services/leaderboard-stat-getter';

describe('services > leaderboard-stat-getter', () => {
  it('should build the right query', async () => {
    expect.assertions(1);
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
      user,
      address,
      params,
      { connections: [connection] },
    );

    await leaderBoardStatGetter.perform();

    const buildedQuery = connection.query.mock.calls[0][0];
    expect(buildedQuery).toStrictEqual(`
    SELECT COUNT("addresses"."id") as "value", "user"."username" as "key"
    FROM "addresses"
    INNER JOIN "users" AS "user"
        ON "user"."id" = "addresses"."user_id"
    
    GROUP BY "user"."username"
    ORDER BY "value" DESC
    LIMIT 5
  `);
  });
});
