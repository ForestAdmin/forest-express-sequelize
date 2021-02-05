const sequelizeFixtures = require('sequelize-fixtures');
const Interface = require('forest-express');
const {
  DECIMAL, STRING, INTEGER,
} = require('sequelize');
const databases = require('../databases');
const runWithConnection = require('../helpers/run-with-connection');
const LeaderboardStatGetter = require('../../src/services/leaderboard-stat-getter');

describe('integration > LeaderboardStatGetter', () => {
  Object.values(databases).forEach((connectionManager) => {
    describe(`dialect ${connectionManager.getDialect()}`, () => {
      /**
       * @param {import('sequelize').Sequelize} sequelize
       */
      async function setup(sequelize) {
        const models = {
          theVendors: sequelize.define('theVendors', {
            firstName: { field: 'First name', type: STRING },
            lastName: { field: 'Last name', type: STRING },
          }, {
            tableName: 'the vendors',
          }),
          theirSales: sequelize.define('theirSales', {
            id: { type: INTEGER, primaryKey: true },
            sellingAmount: { type: INTEGER, field: 'selling amount' },
            vendorId: {
              field: 'vendor id',
              type: INTEGER,
            },
            customerId: {
              field: 'customer id',
              type: INTEGER,
            },
          }, {
            tableName: 'their sales',
          }),
          theCustomers: sequelize.define('theCustomers', {
            name: { type: STRING },
            objectiveScore: { type: DECIMAL, field: 'objective score' },
          }, { tableName: 'the customers' }),
        };

        models.theVendors.hasMany(models.theirSales, {
          foreignKey: {
            name: 'vendorId',
          },
          as: 'vendorsSales',
        });
        models.theirSales.belongsTo(models.theVendors, {
          foreignKey: {
            name: 'vendorId',
          },
          as: 'salesVendors',
        });
        models.theVendors.belongsToMany(models.theCustomers, {
          through: {
            model: models.theirSales,
          },
          foreignKey: {
            name: 'vendorId',
          },
          as: 'vendorsCustomers',
        });
        models.theCustomers.belongsToMany(models.theVendors, {
          through: {
            model: models.theirSales,
          },
          foreignKey: {
            name: 'customerId',
          },
          as: 'customersVendors',
        });


        await sequelize.sync({ force: true });

        await sequelizeFixtures.loadFile(
          'test/fixtures/leaderboard-stat-getter.json',
          models,
          { log: () => { } },
        );

        Interface.Schemas = {
          schemas: {
            theVendors: {
              name: 'theVendors',
              idField: 'id',
              primaryKeys: ['id'],
              isCompositePrimary: false,
              fields: [
                { field: 'id', type: 'Number' },
                { field: 'firstName', columnName: 'First name', type: 'String' },
                { field: 'lastName', columnName: 'Last name', type: 'String' },
              ],
            },
            theirSales: {
              name: 'theirSales',
              idField: 'id',
              primaryKeys: ['id'],
              isCompositePrimary: false,
              fields: [
                { field: 'id', type: 'Number' },
                { field: 'sellingAmount', columnName: 'selling amount', type: 'Number' },
              ],
            },
            theCustomers: {
              name: 'theCustomers',
              idField: 'id',
              primaryKeys: ['id'],
              isCompositePrimary: false,
              fields: [
                { field: 'id', type: 'Number' },
                { field: 'name', type: 'String' },
                { field: 'objectiveScore', columnName: 'objective score', type: 'Number' },
              ],
            },
          },
        };

        return { models };
      }

      describe('with a has-many relationship', () => {
        it('should correctly return the right count', async () => {
          expect.assertions(1);

          await runWithConnection(connectionManager, async (sequelize) => {
            const { models } = await setup(sequelize);

            const params = {
              label_field: 'firstName',
              aggregate: 'count',
              limit: 10,
            };

            const statGetter = new LeaderboardStatGetter(
              models.theVendors,
              models.theirSales,
              params,
            );
            const result = await statGetter.perform();

            expect(result).toStrictEqual({
              value: [{
                key: 'Alice',
                value: 2,
              }, {
                key: 'Bob',
                value: 1,
              }],
            });
          });
        });

        it('should correctly return the right sum', async () => {
          expect.assertions(1);

          await runWithConnection(connectionManager, async (sequelize) => {
            const { models } = await setup(sequelize);

            const params = {
              label_field: 'firstName',
              aggregate: 'sum',
              aggregate_field: 'sellingAmount',
              limit: 10,
            };

            const statGetter = new LeaderboardStatGetter(
              models.theVendors,
              models.theirSales,
              params,
            );
            const result = await statGetter.perform();

            expect(result).toStrictEqual({
              value: [{
                key: 'Alice',
                value: 250,
              }, {
                key: 'Bob',
                value: 200,
              }],
            });
          });
        });
      });

      describe('with a belongs-to-many relationship', () => {
        it('should correctly return the right count', async () => {
          expect.assertions(1);

          await runWithConnection(connectionManager, async (sequelize) => {
            const { models } = await setup(sequelize);

            const params = {
              label_field: 'firstName',
              aggregate: 'count',
              limit: 10,
            };

            const statGetter = new LeaderboardStatGetter(
              models.theVendors,
              models.theCustomers,
              params,
            );
            const result = await statGetter.perform();

            expect(result).toStrictEqual({
              value: [{
                key: 'Alice',
                value: 2,
              }, {
                key: 'Bob',
                value: 1,
              }],
            });
          });
        });

        it('should correctly return the right sum', async () => {
          expect.assertions(1);

          await runWithConnection(connectionManager, async (sequelize) => {
            const { models } = await setup(sequelize);

            const params = {
              label_field: 'firstName',
              aggregate: 'sum',
              aggregate_field: 'objectiveScore',
              limit: 10,
            };

            const statGetter = new LeaderboardStatGetter(
              models.theVendors,
              models.theCustomers,
              params,
            );
            const result = await statGetter.perform();

            expect(result).toStrictEqual({
              value: [{
                key: 'Alice',
                value: 6,
              }, {
                key: 'Bob',
                value: 5,
              }],
            });
          });
        });
      });
    });
  });
});
