const _ = require('lodash');
const Sequelize = require('sequelize');
const sequelizeFixtures = require('sequelize-fixtures');
const Interface = require('forest-express');
const SchemaAdapter = require('../src/adapters/sequelize');

const databaseOptions = {
  logging: false,
  pool: { maxConnections: 10, minConnections: 1 },
};

const sequelizePostgres = new Sequelize(
  'postgres://forest:secret@localhost:5436/forest-express-sequelize-test',
  databaseOptions,
);

const sequelizeMySQL = new Sequelize(
  'mysql://forest:secret@localhost:8999/forest-express-sequelize-test',
  databaseOptions,
);

const PieStatGetter = require('../src/services/pie-stat-getter');
const LineStatGetter = require('../src/services/line-stat-getter');
const ResourcesGetter = require('../src/services/resources-getter');
const ResourceGetter = require('../src/services/resource-getter');
const ResourceCreator = require('../src/services/resource-creator');
const ResourceRemover = require('../src/services/resource-remover');
const HasManyGetter = require('../src/services/has-many-getter');
const HasManyDissociator = require('../src/services/has-many-dissociator');

[sequelizePostgres, sequelizeMySQL].forEach((sequelize) => {
  const models = {};
  const sequelizeOptions = {
    sequelize: Sequelize,
    connections: [sequelize],
  };

  models.user = sequelize.define('user', {
    email: {
      type: Sequelize.STRING,
      unique: true,
      validate: { isEmail: true },
    },
    emailValid: { type: Sequelize.BOOLEAN },
    firstName: { type: Sequelize.STRING },
    lastName: {
      type: Sequelize.STRING,
      validate: {
        len: [0, 50],
      },
    },
    username: { type: Sequelize.STRING },
    password: { type: Sequelize.STRING },
    createdAt: { type: Sequelize.DATE },
    updatedAt: { type: Sequelize.DATE },
    resetPasswordToken: { type: Sequelize.STRING },
    uuid: { type: Sequelize.UUID },
  });

  models.bike = sequelize.define('bike', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    createdAt: { type: Sequelize.DATE },
    updatedAt: { type: Sequelize.DATE },
    name: { type: Sequelize.STRING, allowNull: false },
  });

  models.address = sequelize.define('address', {
    line: { type: Sequelize.STRING },
    zipCode: { type: Sequelize.STRING },
    city: { type: Sequelize.STRING },
    country: { type: Sequelize.STRING },
    userId: { type: Sequelize.INTEGER },
  });

  models.addressWithUserAlias = sequelize.define('addressWithUserAlias', {
    line: { type: Sequelize.STRING },
    zipCode: { type: Sequelize.STRING },
    city: { type: Sequelize.STRING },
    country: { type: Sequelize.STRING },
    userId: { type: Sequelize.INTEGER },
  });

  models.team = sequelize.define('team', {
    name: { type: Sequelize.STRING },
  });

  models.userTeam = sequelize.define('userTeam', {
    userId: { type: Sequelize.INTEGER },
    teamId: { type: Sequelize.INTEGER },
  });

  models.log = sequelize.define('log', {
    code: { type: Sequelize.STRING, primaryKey: true },
    trace: { type: Sequelize.STRING, primaryKey: true },
    stack: { type: Sequelize.STRING },
  });

  models.order = sequelize.define('order', {
    amount: { type: Sequelize.INTEGER },
    comment: { type: Sequelize.STRING },
    giftMessage: { type: Sequelize.STRING },
  });

  models.hasBadFieldType = sequelize.define('hasBadFieldType', {
    fieldGood: { type: Sequelize.STRING },
    fieldBad: { type: Sequelize.REAL }, // NOTICE: not supported yet.
  });

  models.address.belongsTo(models.user);
  models.addressWithUserAlias.belongsTo(models.user, { as: 'userAlias' });
  models.user.hasMany(models.address);
  models.team.belongsToMany(models.user, { through: 'userTeam' });
  models.user.belongsToMany(models.team, { through: 'userTeam' });

  Interface.Schemas = {
    schemas: {
      user: {
        name: 'user',
        idField: 'id',
        primaryKeys: ['id'],
        isCompositePrimary: false,
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'email', type: 'String' },
          { field: 'emailValid', type: 'Boolean' },
          { field: 'firstName', type: 'String' },
          { field: 'lastName', type: 'String' },
          { field: 'username', type: 'String' },
          { field: 'password', type: 'String' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' },
          { field: 'resetPasswordToken', type: 'String' },
          { field: 'addresses', type: ['Number'] },
          { field: 'uuid', type: 'String' },
        ],
      },
      bike: {
        name: 'bike',
        idField: 'id',
        primaryKeys: ['id'],
        isCompositePrimary: false,
        fields: [
          { field: 'id', type: 'String' },
          { field: 'name', type: 'String' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' },
        ],
      },
      address: {
        name: 'address',
        idField: 'id',
        primaryKeys: ['id'],
        isCompositePrimary: false,
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'line', type: 'String' },
          { field: 'zipCode', type: 'String' },
          { field: 'city', type: 'String' },
          { field: 'country', type: 'String' },
          { field: 'user', type: 'Number', reference: 'user.id' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' },
        ],
      },
      addressWithUserAlias: {
        name: 'addressWithUserAlias',
        idField: 'id',
        primaryKeys: ['id'],
        isCompositePrimary: false,
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'line', type: 'String' },
          { field: 'zipCode', type: 'String' },
          { field: 'city', type: 'String' },
          { field: 'country', type: 'String' },
          { field: 'user', type: 'Number', reference: 'userAlias.id' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' },
        ],
      },
      log: {
        name: 'log',
        idField: 'forestCompositePrimary',
        primaryKeys: ['code', 'trace'],
        isCompositePrimary: true,
        fields: [
          { field: 'code', type: 'String' },
          { field: 'trace', type: 'String' },
          { field: 'stack', type: 'String' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' },
        ],
      },
      order: {
        name: 'order',
        idField: 'id',
        primaryKeys: ['id'],
        isCompositePrimary: false,
        searchFields: ['amount', 'comment'],
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'amount', type: 'Number' },
          { field: 'comment', type: 'String' },
          { field: 'giftMessage', type: 'String' },
        ],
      },
      team: {
        name: 'team',
        idField: 'id',
        primaryKeys: ['id'],
        isCompositePrimary: false,
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'name', type: 'String' },
        ],
      },
      userTeam: {
        name: 'userTeam',
        idField: 'forestCompositePrimary',
        primaryKeys: ['userId', 'teamId'],
        isCompositePrimary: true,
        fields: [
          { field: 'user', type: 'Number', reference: 'user.id' },
          { field: 'team', type: 'Number', reference: 'team.id' },
        ],
      },
    },
  };

  describe(`dialect ${sequelize.options.dialect}`, () => {
    describe('schema adapter', () => {
      describe('on a collection with 13 fields and a few validations', () => {
        async function initializeSchema() {
          return SchemaAdapter(models.user, sequelizeOptions);
        }

        it('should generate a schema', async () => {
          expect.assertions(1);
          const schema = await initializeSchema();
          expect(schema).not.toBeNull();
        });

        it('should define an idField', async () => {
          expect.assertions(3);
          const schema = await initializeSchema();
          expect(schema.idField).toStrictEqual('id');
          expect(schema.primaryKeys).toHaveLength(1);
          expect(schema.primaryKeys[0]).toStrictEqual('id');
        });

        it('should not detect a composite primary key', async () => {
          expect.assertions(1);
          const schema = await initializeSchema();
          expect(schema.isCompositePrimary).toStrictEqual(false);
        });

        it('should detect 13 fields with a type', async () => {
          expect.assertions(14);
          const schema = await initializeSchema();
          expect(schema.fields).toHaveLength(13);
          expect(schema.fields[0].type).toStrictEqual('Number');
          expect(schema.fields[1].type).toStrictEqual('String');
          expect(schema.fields[2].type).toStrictEqual('Boolean');
          expect(schema.fields[3].type).toStrictEqual('String');
          expect(schema.fields[4].type).toStrictEqual('String');
          expect(schema.fields[5].type).toStrictEqual('String');
          expect(schema.fields[6].type).toStrictEqual('String');
          expect(schema.fields[7].type).toStrictEqual('Date');
          expect(schema.fields[8].type).toStrictEqual('Date');
          expect(schema.fields[9].type).toStrictEqual('String');
          expect(schema.fields[10].type).toStrictEqual('String');
          expect(schema.fields[11].type[0]).toStrictEqual('Number');
          expect(schema.fields[12].type[0]).toStrictEqual('Number');
        });

        it('should setup validations', async () => {
          expect.assertions(5);
          const schema = await initializeSchema();
          expect(schema.fields[4].validations).toHaveLength(2);
          expect(schema.fields[4].validations[0].type).toStrictEqual('is longer than');
          expect(schema.fields[4].validations[0].value).toStrictEqual(0);
          expect(schema.fields[4].validations[1].type).toStrictEqual('is shorter than');
          expect(schema.fields[4].validations[1].value).toStrictEqual(50);
        });
      });

      describe('on a simple collection with a fields with a bad type', () => {
        async function initializeSchema() {
          return SchemaAdapter(models.hasBadFieldType, sequelizeOptions);
        }

        it('should generate a schema', async () => {
          expect.assertions(1);
          const schema = await initializeSchema();
          expect(schema).not.toBeNull();
        });

        it('should detect 4 fields with a type', async () => {
          expect.assertions(5);
          const schema = await initializeSchema();
          expect(schema.fields).toHaveLength(4);
          expect(schema.fields[0].type).toStrictEqual('Number');
          expect(schema.fields[1].type).toStrictEqual('String');
          expect(schema.fields[2].type).toStrictEqual('Date');
          expect(schema.fields[3].type).toStrictEqual('Date');
        });
      });
    });

    describe('stats > pie stat getter', () => {
      async function initializeDatabase() {
        return sequelize.sync({ force: true })
          .then(() =>
            sequelizeFixtures.loadFile(
              'test/fixtures/db.json',
              models,
              { log: () => {} },
            ));
      }

      describe('a simple pie chart', () => {
        describe('on an empty users table', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            await initializeDatabase();
            const stat = await new PieStatGetter(models.user, {
              type: 'Pie',
              collection: 'user',
              timezone: 'Europe/Paris',
              group_by_field: 'firstName',
              aggregate: 'Count',
              time_range: null,
              filters: null,
            }, sequelizeOptions)
              .perform();
            expect(stat.value).toHaveLength(3);
          });
        });

        describe('with a group by on a belongsTo association using an alias', () => {
          it('should respond correct data', async () => {
            expect.assertions(1);
            await initializeDatabase();
            const stat = await new PieStatGetter(models.addressWithUserAlias, {
              type: 'Pie',
              collection: 'addressWithUserAlias',
              timezone: 'Europe/Paris',
              group_by_field: 'userAlias:id',
              aggregate: 'Count',
              time_range: null,
              filters: null,
            }, sequelizeOptions)
              .perform();
            expect(stat.value).toHaveLength(0);
          });
        });
      });
    });

    describe('stats > line stat getter', () => {
      describe('a simple line chart per day on an empty users table', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const stat = await new LineStatGetter(models.user, {
            type: 'Line',
            collection: 'user',
            timezone: 'Europe/Paris',
            group_by_date_field: 'createdAt',
            aggregate: 'Count',
            time_range: 'Day',
            filters: null,
          }, sequelizeOptions)
            .perform();
          expect(stat.value).toHaveLength(1);
        });
      });

      describe('a simple line chart per week on an empty users table', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const stat = await new LineStatGetter(models.user, {
            type: 'Line',
            collection: 'user',
            timezone: 'Europe/Paris',
            group_by_date_field: 'createdAt',
            aggregate: 'Count',
            time_range: 'Week',
            filters: null,
          }, sequelizeOptions)
            .perform();
          expect(stat.value).toHaveLength(1);
        });
      });

      describe('a simple line chart per month on an empty users table', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const stat = await new LineStatGetter(models.user, {
            type: 'Line',
            collection: 'user',
            timezone: 'Europe/Paris',
            group_by_date_field: 'createdAt',
            aggregate: 'Count',
            time_range: 'Month',
            filters: null,
          }, sequelizeOptions)
            .perform();
          expect(stat.value).toHaveLength(1);
        });
      });

      describe('a simple line chart per year on an empty users table', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const stat = await new LineStatGetter(models.user, {
            type: 'Line',
            collection: 'user',
            timezone: 'Europe/Paris',
            group_by_date_field: 'createdAt',
            aggregate: 'Count',
            time_range: 'Year',
            filters: null,
          }, sequelizeOptions)
            .perform();
          expect(stat.value).toHaveLength(1);
        });
      });
    });

    describe('resources > resources creator', () => {
      describe('create a record on a simple collection', () => {
        it('should create a record', async () => {
          expect.assertions(4);
          const result = await new ResourceCreator(models.user, {
            id: '1',
            email: 'jack@forestadmin.com',
            firstName: 'Jack',
            lastName: 'Lumberjack',
            username: 'Jacouille',
            password: 'bonpoissonnet',
            teams: [],
          })
            .perform();
          expect(result.id).toStrictEqual(1);
          expect(result.firstName).toStrictEqual('Jack');
          expect(result.username).toStrictEqual('Jacouille');

          const user = await models.user.findOne({ where: { email: 'jack@forestadmin.com' } });
          expect(user).not.toBeNull();
        });
      });

      describe('create a record on a collection with a composite primary key', () => {
        it('should create a record', async () => {
          expect.assertions(3);
          const result = await new ResourceCreator(models.log, {
            code: 'G@G#F@G@',
            trace: 'Ggg23g242@',
          })
            .perform();
          expect(result.code).toStrictEqual('G@G#F@G@');
          expect(result.trace).toStrictEqual('Ggg23g242@');

          const log = await models.log.findOne({ where: { code: 'G@G#F@G@' } });
          expect(log).not.toBeNull();
        });
      });
    });

    describe('resources > resources getter', () => {
      describe('request on the resources getter without page size', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
            },
            page: { number: '1' },
            timezone: 'Europe/Paris',
          };
          await new ResourcesGetter(models.user, sequelizeOptions, params).perform();
          expect(true).toStrictEqual(true);
        });
      });

      describe('request on the resources getter with a page size', () => {
        it('should return the records for the specified page', async () => {
          expect.assertions(1);
          const params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
            },
            page: { number: '1', size: '30' },
            timezone: 'Europe/Paris',
          };
          const result = await new ResourcesGetter(models.user, sequelizeOptions, params).perform();
          expect(result[0]).toHaveLength(4);
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const params = {
            timezone: 'Europe/Paris',
          };
          const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
          expect(count).toStrictEqual(4);
        });
      });

      describe('request on the resources getter with a sort on the primary key', () => {
        it('should return the records for the specified page', async () => {
          expect.assertions(1);
          const params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
            },
            sort: '-id',
            page: { number: '1', size: '30' },
            timezone: 'Europe/Paris',
          };
          const result = await new ResourcesGetter(models.user, sequelizeOptions, params).perform();
          expect(result[0]).toHaveLength(4);
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const params = {
            timezone: 'Europe/Paris',
          };
          const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
          expect(count).toStrictEqual(4);
        });
      });

      describe('request on the resources getter with a search', () => {
        it('should return the records for the specified page', async () => {
          expect.assertions(1);
          const params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
            },
            page: { number: '1', size: '30' },
            search: 'hello',
            timezone: 'Europe/Paris',
          };
          const result = await new ResourcesGetter(models.user, sequelizeOptions, params).perform();
          expect(result[0]).toHaveLength(0);
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const params = {
            search: 'hello',
            timezone: 'Europe/Paris',
          };
          const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
          expect(count).toStrictEqual(0);
        });
      });

      describe('request on the resources getter with a search on a UUID primary key', () => {
        describe('with a UUID that does not exist', () => {
          it('should return 0 records for the specified page', async () => {
            expect.assertions(1);
            const params = {
              fields: {
                bike: 'id,name',
              },
              page: { number: '1', size: '30' },
              search: '39a704a7-9149-448c-ac93-9c869c5af41d',
              timezone: 'Europe/Paris',
            };
            const result = await new ResourcesGetter(models.bike, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(0);
          });

          it('should count 0 records', async () => {
            expect.assertions(1);
            const params = {
              search: '39a704a7-9149-448c-ac93-9c869c5af41d',
              timezone: 'Europe/Paris',
            };
            const count = await new ResourcesGetter(models.bike, sequelizeOptions, params).count();
            expect(count).toStrictEqual(0);
          });
        });

        describe('with a UUID that exists', () => {
          it('should return 1 record for the specified page', async () => {
            expect.assertions(1);
            const params = {
              fields: {
                bike: 'id,name',
              },
              page: { number: '1', size: '30' },
              search: '1a11dc05-4e04-4d8f-958b-0a9f23a141a3',
              timezone: 'Europe/Paris',
            };
            const result = await new ResourcesGetter(models.bike, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(1);
          });

          it('should count 1 record', async () => {
            expect.assertions(1);
            const params = {
              search: '1a11dc05-4e04-4d8f-958b-0a9f23a141a3',
              timezone: 'Europe/Paris',
            };
            const count = await new ResourcesGetter(models.bike, sequelizeOptions, params).count();
            expect(count).toStrictEqual(1);
          });
        });
      });

      describe('request on the resources getter with a search on a collection with searchFields', () => {
        it('should return the records for the specified page', async () => {
          expect.assertions(1);
          const params = {
            fields: {
              order: 'id,amount,description,giftComment',
            },
            page: { number: '1', size: '30' },
            search: 'gift',
            timezone: 'Europe/Paris',
          };
          const result = await new ResourcesGetter(models.order, sequelizeOptions, params)
            .perform();
          expect(result[0]).toHaveLength(1);
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const params = {
            search: 'gift',
            timezone: 'Europe/Paris',
          };
          const count = await new ResourcesGetter(models.order, sequelizeOptions, params).count();
          expect(count).toStrictEqual(1);
        });
      });

      describe('request on the resources getter with filters conditions', () => {
        const paramsBaseList = {
          fields: {
            user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
          },
          page: { number: '1', size: '30' },
          timezone: 'Europe/Paris',
        };

        const paramsBaseCount = {
          timezone: 'Europe/Paris',
        };

        const paramsAddressList = {
          fields: {
            address: 'id,city,country',
          },
          page: { number: '1', size: '30' },
          timezone: 'Europe/Paris',
        };

        const paramsAddressCount = {
          timezone: 'Europe/Paris',
        };

        describe('with a "is" condition on a number field', () => {
          it('should return the records for the specified page', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'equal',
              value: 100,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(1);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'equal',
              value: 100,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(1);
          });
        });

        describe('with a "greater than" condition on a number field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'greater_than',
              value: 101,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(2);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'greater_than',
              value: 101,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(2);
          });
        });

        describe('with a "less than" condition on a number field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'less_than',
              value: 104,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(4);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'less_than',
              value: 104,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(4);
          });
        });

        describe('with a "is not" condition on a number field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'not_equal',
              value: 100,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(3);
          });

          it('should return the records result', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'not_equal',
              value: 100,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(3);
          });
        });

        describe('with a "is null" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: null,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(2);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: null,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(2);
          });
        });

        describe('with a "is true" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: true,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(1);
          });

          it('should return records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: true,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(1);
          });
        });

        describe('with a "is false" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: false,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(1);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: false,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(1);
          });
        });

        describe('with a "is not null" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not_equal',
              value: null,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(2);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not_equal',
              value: null,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(2);
          });
        });

        describe('with a "is not true" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not',
              value: true,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(3);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not',
              value: true,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(3);
          });
        });

        describe('with a "is not" condition on a string field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'not_equal',
              value: 'richard@piedpiper.com',
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(3);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'not_equal',
              value: 'richard@piedpiper.com',
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(3);
          });
        });

        describe('with a "is not false" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not',
              value: false,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(3);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not',
              value: false,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(3);
          });
        });

        describe('with a "contains" condition on a string field', () => {
          it('should generate a valid SQL query for list', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'firstName',
              operator: 'contains',
              value: 'Richa',
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(1);
          });

          it('should generate a valid SQL query for count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'firstName',
              operator: 'contains',
              value: 'Richa',
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(1);
          });
        });

        describe('with a "not contains" condition on a string field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'username',
              operator: 'not_contains',
              value: 'hello',
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(4);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'username',
              operator: 'not_contains',
              value: 'hello',
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(4);
          });
        });

        describe('with a "starts with" condition on a string field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'starts_with',
              value: 'dinesh@',
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(1);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'starts_with',
              value: 'dinesh@',
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(1);
          });
        });

        describe('with a "ends with" condition on a string field', () => {
          it('should generate a valid SQL query for list', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'ends_with',
              value: '@piedpiper.com',
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(3);
          });

          it('should generate a valid SQL query for count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'ends_with',
              value: '@piedpiper.com',
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(3);
          });
        });

        describe('with a "is present" condition on a string field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(3);
            const params = _.clone(paramsAddressList);
            params.filters = JSON.stringify({
              field: 'country',
              operator: 'present',
              value: null,
            });
            await new ResourcesGetter(models.address, sequelizeOptions, params)
              .perform()
              .then((result) => {
                _.each(result[0], (instance) => {
                  expect(instance.dataValues.country).toBeDefined();
                });
              });
          });
        });

        describe('with a "is blank" condition on a string field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsAddressList);
            params.filters = JSON.stringify({
              field: 'country',
              operator: 'blank',
              value: null,
            });
            const result = await new ResourcesGetter(models.address, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(1);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsAddressCount);
            params.filters = JSON.stringify({
              field: 'country',
              operator: 'blank',
              value: null,
            });
            const count = await new ResourcesGetter(models.address, sequelizeOptions, params)
              .count();
            expect(count).toStrictEqual(1);
          });
        });

        describe('with a "before x hours" condition on a date field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'createdAt',
              operator: 'before_x_hours_ago',
              value: 2,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(0);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'createdAt',
              operator: 'before_x_hours_ago',
              value: 2,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(0);
          });
        });

        describe('with a "after x hours" condition on a date field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'createdAt',
              operator: 'after_x_hours_ago',
              value: 2,
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(4);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'createdAt',
              operator: 'after_x_hours_ago',
              value: 2,
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(4);
          });
        });

        describe('with complex filters conditions', () => {
          const filters = JSON.stringify({
            aggregator: 'and',
            conditions: [{
              field: 'createdAt',
              operator: 'after_x_hours_ago',
              value: 2,
            }, {
              aggregator: 'or',
              conditions: [{
                field: 'firstName',
                operator: 'contains',
                value: 'h',
              }, {
                field: 'lastName',
                operator: 'starts_with',
                value: 'Lumb',
              }],
            }, {
              field: 'id',
              operator: 'greater_than',
              value: 12,
            }],
          });

          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseList);
            params.filters = filters;
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(3);
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const params = _.clone(paramsBaseCount);
            params.filters = filters;
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(3);
          });
        });
      });

      describe('request on the resources getter with a filter condition and search', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
            },
            page: { number: '2', size: '50' },
            filters: JSON.stringify({
              field: 'username',
              operator: 'contains',
              value: 'hello',
            }),
            search: 'world',
            timezone: 'Europe/Paris',
          };
          const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
            .perform();
          expect(result[0]).toHaveLength(0);
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const params = {
            filters: JSON.stringify({
              field: 'username',
              operator: 'contains',
              value: 'hello',
            }),
            search: 'world',
            timezone: 'Europe/Paris',
          };
          const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
          expect(count).toStrictEqual(0);
        });
      });

      describe('request on the resources getter with an extended search with a UUID input', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const params = {
            fields: {
              address: 'line,zipCode,city,country,user',
              user: 'id',
            },
            page: { number: '1', size: '10' },
            search: '1a11dc05-4e04-4d8f-958b-0a9f23a141a3',
            searchExtended: 1,
            timezone: 'Europe/Paris',
          };
          const result = await new ResourcesGetter(models.address, sequelizeOptions, params)
            .perform();
          expect(result[0]).toHaveLength(4);
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const params = {
            search: '1a11dc05-4e04-4d8f-958b-0a9f23a141a3',
            searchExtended: 1,
            timezone: 'Europe/Paris',
          };
          const count = await new ResourcesGetter(models.address, sequelizeOptions, params).count();
          expect(count).toStrictEqual(4);
        });
      });

      describe('request on the resources getter with a filter condition, search and sort combined', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
            },
            page: { number: '2', size: '50' },
            filters: JSON.stringify({
              field: 'username',
              operator: 'contains',
              value: 'hello',
            }),
            sort: '-id',
            search: 'world',
            timezone: 'Europe/Paris',
          };
          const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
            .perform();
          expect(result[0]).toHaveLength(0);
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const params = {
            filters: JSON.stringify({
              field: 'username',
              operator: 'contains',
              value: 'hello',
            }),
            search: 'world',
            timezone: 'Europe/Paris',
          };
          const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
          expect(count).toStrictEqual(0);
        });
      });

      describe('request on the resources getter with a Live Query segment', () => {
        it('should respond with a valid result', async () => {
          expect.assertions(1);
          const params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
            },
            page: { number: '2', size: '50' },
            sort: '-id',
            segmentQuery: 'select * from users\nwhere id in (100, 102);',
            timezone: 'Europe/Paris',
          };
          const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
            .perform();
          expect(result).toHaveLength(2);
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const params = {
            segmentQuery: 'select * from users\nwhere id in (100, 102);',
            timezone: 'Europe/Paris',
          };
          const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
          expect(count).toStrictEqual(2);
        });
      });
    });

    describe('hasmany > has-many-getter', () => {
      describe('request on the has-many getter without sort', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const params = {
            recordId: 100,
            associationName: 'addresses',
            fields: {
              address: 'line,zipCode,city,country,user',
            },
            page: { number: '1', size: '20' },
            timezone: 'Europe/Paris',
          };
          const result = await new HasManyGetter(
            models.user,
            models.address,
            sequelizeOptions,
            params,
          )
            .perform();
          expect(result[0]).toHaveLength(4);
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const params = {
            recordId: 100,
            associationName: 'addresses',
            timezone: 'Europe/Paris',
          };
          const count = await new HasManyGetter(
            models.user,
            models.address,
            sequelizeOptions,
            params,
          )
            .count();
          expect(count).toStrictEqual(4);
        });
      });

      describe('request on the has-many-getter with a sort on an attribute', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const params = {
            recordId: 100,
            associationName: 'addresses',
            fields: {
              address: 'line,zipCode,city,country,user',
            },
            page: { number: '1', size: '20' },
            sort: 'city',
            timezone: 'Europe/Paris',
          };
          const result = await new HasManyGetter(
            models.user,
            models.address,
            sequelizeOptions,
            params,
          )
            .perform();
          expect(result[0]).toHaveLength(4);
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const params = {
            recordId: 100,
            associationName: 'addresses',
            timezone: 'Europe/Paris',
          };
          const count = await new HasManyGetter(
            models.user,
            models.address,
            sequelizeOptions,
            params,
          )
            .count();
          expect(count).toStrictEqual(4);
        });
      });

      describe('request on the has-many-getter with a sort on a belongsTo', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const params = {
            recordId: 100,
            associationName: 'addresses',
            fields: {
              address: 'line,zipCode,city,country,user',
            },
            page: { number: '1', size: '20' },
            sort: '-user.id',
            timezone: 'Europe/Paris',
          };
          const result = await new HasManyGetter(
            models.user,
            models.address,
            sequelizeOptions,
            params,
          )
            .perform();
          expect(result[0]).toHaveLength(4);
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const params = {
            recordId: 100,
            associationName: 'addresses',
            timezone: 'Europe/Paris',
          };
          const count = await new HasManyGetter(
            models.user,
            models.address,
            sequelizeOptions,
            params,
          )
            .count();
          expect(count).toStrictEqual(4);
        });
      });
    });

    describe('request on the has-many-getter with a search parameter', () => {
      it('should return the records for the specified page', async () => {
        expect.assertions(1);
        const params = {
          recordId: 100,
          associationName: 'addresses',
          fields: {
            address: 'line,zipCode,city,country,user',
          },
          page: { number: '1', size: '20' },
          search: 'SF',
          sort: '-user.id',
          timezone: 'Europe/Paris',
        };

        const result = await new HasManyGetter(
          models.user,
          models.address,
          sequelizeOptions,
          params,
        )
          .perform();
        expect(result[0]).toHaveLength(1);
      });

      it('should return the total records count', async () => {
        expect.assertions(1);
        const params = {
          recordId: 100,
          associationName: 'addresses',
          search: 'SF',
          timezone: 'Europe/Paris',
        };

        const count = await new HasManyGetter(models.user, models.address, sequelizeOptions, params)
          .count();
        expect(count).toStrictEqual(1);
      });
    });

    describe('resources > resource-getter', () => {
      describe('get a record in a simple collection', () => {
        it('should retrieve the record', async () => {
          expect.assertions(3);
          const params = {
            recordId: 100,
          };
          const user = await new ResourceGetter(models.user, params).perform();
          expect(user).not.toBeNull();
          expect(user.id).toStrictEqual(100);
          expect(user.firstName).toStrictEqual('Richard');
        });
      });

      describe('get a record in a collection with a composite primary key', () => {
        it('should retrieve the record', async () => {
          expect.assertions(2);
          const params = {
            recordId: 'G@G#F@G@-Ggg23g242@',
          };
          const log = await new ResourceGetter(models.log, params).perform();
          expect(log).not.toBeNull();
          expect(log.forestCompositePrimary).toStrictEqual('G@G#F@G@-Ggg23g242@');
        });
      });
    });

    describe('resources > resources-remover', () => {
      describe('remove a record in a simple collection', () => {
        it('should destroy the record', async () => {
          expect.assertions(1);
          const params = {
            recordId: 1,
          };
          await new ResourceRemover(models.user, params).perform();
          const user = await models.user.findOne({ where: { email: 'jack@forestadmin.com' } });
          expect(user).toBeNull();
        });
      });

      describe('remove a record in a collection with a composite primary key', () => {
        it('should destroy the record', async () => {
          expect.assertions(1);
          const params = {
            recordId: 'G@G#F@G@-Ggg23g242@',
          };
          await new ResourceRemover(models.log, params).perform();
          const log = await models.log.findOne({ where: { code: 'G@G#F@G@' } });
          expect(log).toBeNull();
        });
      });
    });

    describe('has-many > has-many-dissociator', () => {
      describe('dissociate', () => {
        describe('on HasMany relationship', () => {
          it('should delete the relationship of the record', async () => {
            expect.assertions(1);
            const params = {
              recordId: '100',
              associationName: 'addresses',
            };
            const data = {
              data: [
                { id: '103', type: 'address' },
              ],
            };
            await new HasManyDissociator(
              models.user,
              models.address,
              sequelizeOptions,
              params,
              data,
            )
              .perform();

            const address = await models.address.findOne({ where: { id: '103' } });
            expect(address.userId).toBeNull();
          });
        });

        describe('on belongs-to-many relationship', () => {
          it('should delete the relationship of the record', async () => {
            expect.assertions(1);
            const params = {
              recordId: '100',
              associationName: 'teams',
            };
            const data = {
              data: [
                { id: '100', type: 'team' },
              ],
            };
            await new HasManyDissociator(
              models.user,
              models.team,
              sequelizeOptions,
              params,
              data,
            )
              .perform();

            const userTeam = await models.userTeam
              .findOne({ where: { userId: '100', teamId: '100' } });
            expect(userTeam).toBeNull();
          });
        });
      });

      describe('delete', () => {
        describe('on has-many relationship', () => {
          it('should delete the relationship and delete the record', async () => {
            expect.assertions(1);
            const params = {
              recordId: '100',
              associationName: 'addresses',
              delete: 'true',
            };
            const data = {
              data: [
                { id: '103', type: 'address' },
              ],
            };
            await new HasManyDissociator(
              models.user,
              models.address,
              sequelizeOptions,
              params,
              data,
            )
              .perform();

            const address = await models.address.findOne({ where: { id: '103' } });
            expect(address).toBeNull();
          });
        });

        describe('on belongs-to-many relationship', () => {
          it('should delete the relationship and delete the record', async () => {
            expect.assertions(1);
            const params = {
              recordId: '100',
              associationName: 'teams',
              delete: 'true',
            };
            const data = {
              data: [
                { id: '100', type: 'team' },
              ],
            };
            await new HasManyDissociator(
              models.user,
              models.team,
              sequelizeOptions,
              params,
              data,
            )
              .perform();

            const userTeam = await models.userTeam
              .findOne({ where: { userId: '100', teamId: '100' } });
            expect(userTeam).toBeNull();
          });
        });
      });
    });
  });
});
