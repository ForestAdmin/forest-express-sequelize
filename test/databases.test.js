const _ = require('lodash');
const Sequelize = require('sequelize');
const sequelizeFixtures = require('sequelize-fixtures');
const Interface = require('forest-express');
const SchemaAdapter = require('../src/adapters/sequelize');
const { sequelizePostgres, sequelizeMySQLMin, sequelizeMySQLMax } = require('./databases');
const PieStatGetter = require('../src/services/pie-stat-getter');
const LineStatGetter = require('../src/services/line-stat-getter');
const ValueStatGetter = require('../src/services/value-stat-getter');
const ResourcesGetter = require('../src/services/resources-getter');
const ResourceGetter = require('../src/services/resource-getter');
const ResourceCreator = require('../src/services/resource-creator');
const ResourceUpdater = require('../src/services/resource-updater');
const BelongsToUpdater = require('../src/services/belongs-to-updater');
const ResourceRemover = require('../src/services/resource-remover');
const HasManyGetter = require('../src/services/has-many-getter');
const HasManyDissociator = require('../src/services/has-many-dissociator');

[sequelizePostgres, sequelizeMySQLMin, sequelizeMySQLMax].forEach((connectionManager) => {
  function initializeSequelize() {
    const sequelize = connectionManager.createConnection();
    const models = {};
    const sequelizeOptions = {
      Sequelize,
      connections: { sequelize },
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
      age: { type: Sequelize.INTEGER },
    });

    models.member = sequelize.define('member', {
      name: { type: Sequelize.STRING },
    });

    models.membership = sequelize.define('membership', {
      type: { type: Sequelize.STRING },
      memberId: { type: Sequelize.INTEGER },
    });

    models.friend = sequelize.define('friend', {
      name: { type: Sequelize.STRING },
      memberId: { type: Sequelize.INTEGER },
    });

    models.bird = sequelize.define('bird', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
      },
      createdAt: { type: Sequelize.DATE },
      updatedAt: { type: Sequelize.DATE },
      name: { type: Sequelize.STRING, allowNull: false },
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

    models.georegion = sequelize.define('georegion', {
      isocode: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      nameEnglish: { type: Sequelize.STRING, allowNull: false },
      nameFrench: { type: Sequelize.STRING, allowNull: false },
    });

    models.address = sequelize.define('address', {
      line: { type: Sequelize.STRING },
      zipCode: { type: Sequelize.STRING },
      city: { type: Sequelize.STRING },
      country: { type: Sequelize.STRING },
      userId: { type: Sequelize.INTEGER },
      archivedAt: { type: Sequelize.DATE },
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

    models.owner = sequelize.define('owner', {
      name: { type: Sequelize.STRING },
      ownerId: { type: Sequelize.INTEGER, allowNull: false, unique: true },
    });

    models.project = sequelize.define('project', {
      name: { type: Sequelize.STRING },
      ownerId: { type: Sequelize.INTEGER },
    });

    models.counter = sequelize.define('counter', {
      clicks: { type: Sequelize.BIGINT },
      quantity: { type: Sequelize.INTEGER },
    });

    models.customer = sequelize.define('customer', {
      name: { type: Sequelize.STRING },
    });

    models.picture = sequelize.define('picture', {
      name: { type: Sequelize.STRING },
      customerId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
    }, {
      underscored: true,
    });

    models.car = sequelize.define('car', {
      brand: {
        type: Sequelize.STRING,
        validate: {
          reliable(value) {
            if (value === 'Fiat') throw new Error('brand must be reliable.');
          },
        },
      },
      model: { type: Sequelize.STRING },
    });

    models.address.belongsTo(models.user);
    models.addressWithUserAlias.belongsTo(models.user, { as: 'userAlias' });
    models.user.hasMany(models.address);
    models.team.belongsToMany(models.user, { through: 'userTeam' });
    models.user.belongsToMany(models.team, { through: 'userTeam' });
    models.membership.belongsTo(models.member);
    models.member.hasOne(models.membership);
    models.member.hasMany(models.friend);
    models.friend.belongsTo(models.member);
    models.project.belongsTo(models.owner, {
      foreignKey: {
        name: 'ownerIdKey',
        field: 'owner_id',
      },
      targetKey: 'ownerId',
    });
    models.owner.hasMany(models.project, {
      foreignKey: {
        name: 'ownerIdKey',
        field: 'owner_id',
      },
      sourceKey: 'ownerId',
    });

    models.customer.hasOne(models.picture, {
      foreignKey: {
        name: 'customerIdKey',
        field: 'customer_id',
      },
      as: 'picture',
    });
    models.picture.belongsTo(models.customer, {
      foreignKey: {
        name: 'customerIdKey',
        field: 'customer_id',
      },
      as: 'customer',
    });

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
            { field: 'fullName', isVirtual: true, type: 'String' },
            { field: 'age', type: 'Number' },
          ],
        },
        bird: {
          name: 'bird',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'name', type: 'String' },
            { field: 'createdAt', type: 'Date' },
            { field: 'updatedAt', type: 'Date' },
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
        georegion: {
          name: 'georegion',
          idField: 'isocode',
          primaryKeys: ['isocode'],
          isCompositePrimary: false,
          fields: [
            { field: 'isocode', type: 'String' },
            { field: 'nameEnglish', type: 'String' },
            { field: 'nameFrench', type: 'String' },
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
        member: {
          name: 'member',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'name', type: 'String' },
          ],
        },
        membership: {
          name: 'membership',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'type', type: 'String' },
            { field: 'member', type: 'Number', reference: 'member.id' },
          ],
        },
        friend: {
          name: 'friend',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'name', type: 'String' },
            { field: 'member', type: 'Number', reference: 'member.id' },
          ],
        },
        owner: {
          name: 'owner',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'name', type: 'STRING' },
            { field: 'ownerId', type: 'Number' },
          ],
        },
        project: {
          name: 'project',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'name', type: 'STRING' },
            { field: 'ownerId', type: 'Number', reference: 'owner.ownerId' },
          ],
        },
        counter: {
          name: 'counter',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'clicks', type: 'Number' },
            { field: 'quantity', type: 'Number' },
          ],
        },
        customer: {
          name: 'owner',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'name', type: 'STRING' },
          ],
        },
        picture: {
          name: 'picture',
          idField: 'customerId',
          primaryKeys: ['customerId'],
          isCompositePrimary: false,
          fields: [
            { field: 'customerId', type: 'Number', reference: 'customer.id' },
            { field: 'name', type: 'STRING' },
          ],
        },
        car: {
          name: 'car',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'brand', type: 'String' },
            { field: 'model', type: 'String' },
            {
              field: 'name',
              isVirtual: true,
              type: 'String',
              get: (car) => `${car.brand} ${car.model}`,
              search: (query, search) => {
                const split = search.split(' ');
                const searchCondition = {
                  [Sequelize.Op.and]: [
                    { brand: { [Sequelize.Op.like]: `%${split[0]}%` } },
                    { model: { [Sequelize.Op.like]: `%${split[1]}%` } },
                  ],
                };
                query.where[Sequelize.Op.and][0][Sequelize.Op.or].push(searchCondition);
                return query;
              },
            },
          ],
          segments: [{
            name: 'only monza sp*',
            where: () => ({ model: { [Sequelize.Op.like]: '%Monza SP%' } }),
          }],
        },
      },
    };

    return { sequelize, models, sequelizeOptions };
  }

  describe(`dialect ${connectionManager.getDialect()}`, () => {
    describe('schema adapter', () => {
      async function initializeSchema(modelName) {
        const { models, sequelizeOptions } = initializeSequelize();
        const schema = SchemaAdapter(models[modelName], sequelizeOptions);
        connectionManager.closeConnection();
        return schema;
      }

      describe('on a collection with 13 fields and a few validations', () => {
        it('should generate a schema', async () => {
          expect.assertions(1);
          const schema = await initializeSchema('user');
          expect(schema).not.toBeNull();
        });

        it('should define an idField', async () => {
          expect.assertions(3);
          const schema = await initializeSchema('user');
          expect(schema.idField).toStrictEqual('id');
          expect(schema.primaryKeys).toHaveLength(1);
          expect(schema.primaryKeys[0]).toStrictEqual('id');
        });

        it('should not detect a composite primary key', async () => {
          expect.assertions(1);
          const schema = await initializeSchema('user');
          expect(schema.isCompositePrimary).toStrictEqual(false);
        });

        it('should detect 14 fields with a type', async () => {
          expect.assertions(15);
          const schema = await initializeSchema('user');
          expect(schema.fields).toHaveLength(14);
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
          expect(schema.fields[11].type).toStrictEqual('Number');
          expect(schema.fields[12].type[0]).toStrictEqual('Number');
          expect(schema.fields[13].type[0]).toStrictEqual('Number');
        });

        it('should setup validations', async () => {
          expect.assertions(5);
          const schema = await initializeSchema('user');
          expect(schema.fields[4].validations).toHaveLength(2);
          expect(schema.fields[4].validations[0].type).toStrictEqual('is longer than');
          expect(schema.fields[4].validations[0].value).toStrictEqual(0);
          expect(schema.fields[4].validations[1].type).toStrictEqual('is shorter than');
          expect(schema.fields[4].validations[1].value).toStrictEqual(50);
        });
      });

      describe('on a simple collection with a fields with a bad type', () => {
        it('should generate a schema', async () => {
          expect.assertions(1);
          const schema = await initializeSchema('hasBadFieldType');
          expect(schema).not.toBeNull();
        });

        it('should detect 4 fields with a type', async () => {
          expect.assertions(5);
          const schema = await initializeSchema('hasBadFieldType');
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
        const { sequelize, models, sequelizeOptions } = initializeSequelize();
        await sequelize.sync({ force: true });
        await sequelizeFixtures.loadFile(
          'test/fixtures/db.json',
          models,
          { log: () => { } },
        );
        return { models, sequelizeOptions };
      }

      describe('a simple pie chart', () => {
        describe('on an empty users table', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = await initializeDatabase();
            try {
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
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a group by on a belongsTo association using an alias', () => {
          it('should respond correct data', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = await initializeDatabase();
            try {
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
            } finally {
              connectionManager.closeConnection();
            }
          });
        });
      });
    });

    describe('stats > line stat getter', () => {
      describe('a simple line chart per day on an empty users table', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          try {
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
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('a simple line chart per week on an empty users table', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          try {
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
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('a simple line chart per month on an empty users table', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          try {
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
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('a simple line chart per year on an empty users table', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          try {
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
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('chart with a filter', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          try {
            const stat = await new LineStatGetter(models.address, {
              type: 'Line',
              collection: 'address',
              timezone: 'Europe/Paris',
              group_by_date_field: 'createdAt',
              aggregate: 'Count',
              time_range: 'Year',
              filters: JSON.stringify({ field: 'user:id', operator: 'equal', value: 100 }),
            }, sequelizeOptions).perform();
            expect(stat.value).toHaveLength(1);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });
    });

    describe('stats > value stat getter', () => {
      it('should give correct answer without filters', async () => {
        expect.assertions(1);
        const { models, sequelizeOptions } = initializeSequelize();

        try {
          const stat = await new ValueStatGetter(models.user, {
            type: 'Value',
            aggregate: 'Sum',
            aggregate_field: 'id',
            timezone: 'Europe/Paris',
          }, sequelizeOptions).perform();

          expect(stat.value).toStrictEqual({ countCurrent: 305, countPrevious: undefined });
        } finally {
          connectionManager.closeConnection();
        }
      });

      it('should give correct answer and previous value', async () => {
        expect.assertions(1);
        const { models, sequelizeOptions } = initializeSequelize();

        try {
          const stat = await new ValueStatGetter(models.user, {
            type: 'Value',
            aggregate: 'Sum',
            aggregate_field: 'id',
            filters: '{"field":"createdAt","operator":"previous_month_to_date","value":null}',
            timezone: 'Europe/Paris',
          }, sequelizeOptions).perform();

          expect(stat.value).toStrictEqual({ countCurrent: 305, countPrevious: 0 });
        } finally {
          connectionManager.closeConnection();
        }
      });

      it('should give correct answer and previous value with filters', async () => {
        expect.assertions(1);
        const { models, sequelizeOptions } = initializeSequelize();

        try {
          const stat = await new ValueStatGetter(models.user, {
            type: 'Value',
            aggregate: 'Sum',
            aggregate_field: 'id',
            filters: '{"aggregator":"and","conditions":[{"field":"createdAt","operator":"previous_month_to_date","value":null},{"field":"id","operator":"greater_than","value":100}]}',
            timezone: 'Europe/Paris',
          }, sequelizeOptions).perform();

          expect(stat.value).toStrictEqual({ countCurrent: 205, countPrevious: 0 });
        } finally {
          connectionManager.closeConnection();
        }
      });

      it('should give correct answer with filter on related data', async () => {
        expect.assertions(1);
        const { models, sequelizeOptions } = initializeSequelize();

        try {
          const stat = await new ValueStatGetter(models.address, {
            type: 'Value',
            aggregate: 'Count',
            filters: '{"field":"user:id","operator":"greater_than","value":0}',
            timezone: 'Europe/Paris',
          }, sequelizeOptions).perform();

          expect(stat.value).toStrictEqual({ countCurrent: 4, countPrevious: undefined });
        } finally {
          connectionManager.closeConnection();
        }
      });
    });

    describe('resources > resources creator', () => {
      describe('create a record on a simple collection', () => {
        it('should create a record', async () => {
          expect.assertions(4);
          const { models } = initializeSequelize();
          try {
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
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('create a record on a collection with a foreign key non pointing to a primary key', () => {
        it('should create a record', async () => {
          expect.assertions(6);
          const { models } = initializeSequelize();
          try {
            await new ResourceCreator(models.owner, {
              id: 1,
              name: 'foo',
              ownerId: 3,
            }).perform();
            const result = await new ResourceCreator(models.project, {
              id: 1,
              name: 'bar',
              owner: 1,
            }).perform();

            expect(result.id).toStrictEqual(1);
            expect(result.name).toStrictEqual('bar');
            expect(result.ownerIdKey).toStrictEqual(3);

            const project = await models.project.findOne({ where: { name: 'bar' }, include: { model: models.owner, as: 'owner' } });
            expect(project).not.toBeNull();
            expect(project.owner.id).toStrictEqual(1);
            expect(project.owner.ownerId).toStrictEqual(3);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should not create a record', async () => {
          expect.assertions(1);
          const { models } = initializeSequelize();
          try {
            await new ResourceCreator(models.owner, {
              id: 2,
              name: 'foo',
              ownerId: 4,
            }).perform();
            await expect(new ResourceCreator(models.project, {
              id: 1,
              name: 'bar',
              owner: 4,
            }).perform()).rejects.toThrow(Error('related owner with pk 4 does not exist.'));
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('create a record on a collection with a foreign key which is a primary key', () => {
        it('should create a record', async () => {
          expect.assertions(6);
          const { models } = initializeSequelize();
          try {
            await new ResourceCreator(models.customer, {
              id: 1,
              name: 'foo',
            }).perform();
            const result = await new ResourceCreator(models.picture, {
              name: 'bar',
              customer: 1,
            }).perform();

            expect(result.customerId).toStrictEqual(1);
            expect(result.customerIdKey).toStrictEqual(1);
            expect(result.name).toStrictEqual('bar');

            const picture = await models.picture.findOne({ where: { name: 'bar' }, include: { model: models.customer, as: 'customer' } });
            expect(picture).not.toBeNull();
            expect(picture.customerId).toStrictEqual(1);
            expect(picture.customer.id).toStrictEqual(1);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('create a record on a collection with a composite primary key', () => {
        it('should create a record', async () => {
          expect.assertions(3);
          const { models } = initializeSequelize();
          try {
            const result = await new ResourceCreator(models.log, {
              code: 'G@G#F@G@',
              trace: 'Ggg23g242@',
            })
              .perform();
            expect(result.code).toStrictEqual('G@G#F@G@');
            expect(result.trace).toStrictEqual('Ggg23g242@');

            const log = await models.log.findOne({ where: { code: 'G@G#F@G@' } });
            expect(log).not.toBeNull();
          } finally {
            connectionManager.closeConnection();
          }
        });
      });
    });

    describe('resources > relation updater', () => {
      describe('update a record on a collection', () => {
        it('should update a record', async () => {
          expect.assertions(2);
          const { models } = initializeSequelize();
          try {
            await new ResourceCreator(models.member, {
              id: 1,
              name: 'foo',
            }).perform();
            await new ResourceCreator(models.member, {
              id: 2,
              name: 'bar',
            }).perform();
            await new ResourceCreator(models.friend, {
              id: 1,
              name: 'foo',
              memberId: 1,
            }).perform();
            const result = await new BelongsToUpdater(models.friend, null, null, {
              recordId: '1',
              associationName: 'member',
            }, {
              data: {
                id: '2',
                type: 'member',
              },
            }).perform();

            expect(result.id).toStrictEqual(1);
            expect(result.memberId).toStrictEqual('2');
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should update a record with hasOne association', async () => {
          expect.assertions(2);
          const { models } = initializeSequelize();
          try {
            await new ResourceCreator(models.membership, {
              id: 1,
              type: 'basic',
              memberId: 1,
            }).perform();
            await new ResourceCreator(models.membership, {
              id: 2,
              type: 'premium',
              memberId: 2,
            }).perform();
            await new BelongsToUpdater(models.member, null, null, {
              recordId: '1',
              associationName: 'membership',
            }, {
              data: {
                id: '2',
                type: 'membership',
              },
            }).perform();

            const member = await models.member.findOne({
              where: { id: 1 },
              include: { model: models.membership },
            });
            expect(member).not.toBeNull();
            expect(member.membership.id).toStrictEqual(2);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should not update a record', async () => {
          expect.assertions(1);
          const { models } = initializeSequelize();
          try {
            await expect(new BelongsToUpdater(models.member, null, null, {
              recordId: '1',
              associationName: 'membership',
            }, {
              data: {
                id: '999',
                type: 'membership',
              },
            }).perform()).rejects.toThrow(Error('related membership with pk 999 does not exist.'));
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should not update a record if no data', async () => {
          expect.assertions(1);
          const { models } = initializeSequelize();
          try {
            const result = await new BelongsToUpdater(models.member, null, null, {
              recordId: '1',
              associationName: 'membership',
            }, {}).perform();
            expect(result).toBeNull();
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should update a record when removing a reference to another record', async () => {
          expect.assertions(2);
          const { models } = initializeSequelize();

          try {
            const newMember = await new ResourceCreator(models.member, {
              id: 421,
              name: 'the member',
            }).perform();

            const newFriend = await new ResourceCreator(models.friend, {
              id: 422,
              member: newMember,
              name: 'my friend',
            }).perform();


            expect(newFriend.memberId).not.toBeNull();

            const result = await new BelongsToUpdater(models.friend, null, null, {
              recordId: newFriend.id,
              associationName: 'member',
            }, { data: null }).perform();

            expect(result.memberId).toBeNull();
          } finally {
            connectionManager.closeConnection();
          }
        });
      });
      describe('update a record on a collection with a foreign key non pointing to a primary key', () => {
        it('should update a record', async () => {
          expect.assertions(2);
          const { models } = initializeSequelize();
          try {
            await new ResourceCreator(models.owner, {
              id: 3,
              name: 'foo3',
              ownerId: 5,
            }).perform();
            const result = await new BelongsToUpdater(models.project, null, null, {
              recordId: '1',
              associationName: 'owner',
            }, {
              data: {
                id: '3',
                type: 'owner',
              },
            }).perform();

            expect(result.id).toStrictEqual(1);
            expect(result.ownerIdKey).toStrictEqual(5);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should not update a record', async () => {
          expect.assertions(1);
          const { models } = initializeSequelize();
          try {
            await new ResourceCreator(models.owner, {
              id: 4,
              name: 'foo4',
              ownerId: 6,
            }).perform();
            await expect(new BelongsToUpdater(models.project, null, null, {
              recordId: '1',
              associationName: 'owner',
            }, {
              data: {
                id: '6',
                type: 'owner',
              },
            }).perform()).rejects.toThrow(Error('related owner with pk 6 does not exist.'));
          } finally {
            connectionManager.closeConnection();
          }
        });
      });
    });

    describe('resources > resources getter', () => {
      describe('request on the resources getter without page size', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          try {
            const params = {
              fields: {
                user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
              },
              page: { number: '1' },
              timezone: 'Europe/Paris',
            };
            await new ResourcesGetter(models.user, sequelizeOptions, params).perform();
            expect(true).toStrictEqual(true);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the resources getter with a page size', () => {
        it('should return the records for the specified page', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
            },
            page: { number: '1', size: '30' },
            timezone: 'Europe/Paris',
          };
          try {
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(4);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            timezone: 'Europe/Paris',
          };
          try {
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(4);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the resources getter with a sort on the primary key', () => {
        it('should return the records for the specified page', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
            },
            sort: '-id',
            page: { number: '1', size: '30' },
            timezone: 'Europe/Paris',
          };
          try {
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(4);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            timezone: 'Europe/Paris',
          };
          try {
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(4);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the resources getter', () => {
        describe('with a "string" search', () => {
          it('should return the records for the specified page', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              fields: {
                user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
              },
              page: { number: '1', size: '30' },
              search: 'hello',
              timezone: 'Europe/Paris',
            };
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(0);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              search: 'hello',
              timezone: 'Europe/Paris',
            };
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(0);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "number" search', () => {
          it('should return the records for the specified page', async () => {
            expect.assertions(2);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              fields: {
                user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken,age',
              },
              page: { number: '1', size: '30' },
              search: '10',
              timezone: 'Europe/Paris',
            };
            try {
              let result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(2);

              params.search = '0';
              result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(2);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              search: '10',
              timezone: 'Europe/Paris',
            };
            try {
              let count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
              expect(count).toStrictEqual(2);

              params.search = '0';
              count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
              expect(count).toStrictEqual(1);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should handle numbers over MAX_SAFE_INTEGER', async () => {
            expect.assertions(2);
            const { models, sequelizeOptions } = initializeSequelize();

            // HACK: sequelize-fixtures does not support BigInt in json files,
            //       so we need to update the clicks value manually
            const counter = await models.counter.findByPk(10);
            counter.clicks = BigInt('9013084467599484828'); // eslint-disable-line no-undef
            await counter.save();

            const params = {
              fields: {
                counter: 'id,clicks',
              },
              page: { number: '1', size: '30' },
              search: '9013084467599484828',
              timezone: 'Europe/Paris',
            };
            try {
              const result = await new ResourcesGetter(models.counter, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
              expect(result[0][0].id).toBe(10);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should handle numbers over MAX_SAFE_INTEGER even if there are fields that are not big int', async () => {
            expect.assertions(2);
            const { models, sequelizeOptions } = initializeSequelize();

            // HACK: sequelize-fixtures does not support BigInt in json files,
            //       so we need to update the clicks value manually
            const counter = await models.counter.findByPk(10);
            counter.clicks = BigInt('9013084467599484828'); // eslint-disable-line no-undef
            await counter.save();

            const params = {
              fields: {
                counter: 'id,clicks,quantity',
              },
              page: { number: '1', size: '30' },
              search: '9013084467599484828',
              timezone: 'Europe/Paris',
            };
            try {
              const result = await new ResourcesGetter(models.counter, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
              expect(result[0][0].id).toBe(10);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "string" search on a smart field', () => {
          it('should return the records for the specified page', async () => {
            expect.assertions(3);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              fields: {
                car: 'id,name',
              },
              page: { number: '1', size: '30' },
              search: 'Ferrari Enzo',
              timezone: 'Europe/Paris',
            };
            try {
              const result = await new ResourcesGetter(models.car, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
              expect(result[0][0].brand).toStrictEqual('Ferrari');
              expect(result[0][0].model).toStrictEqual('Enzo');
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              search: 'Ferrari Enzo',
              timezone: 'Europe/Paris',
            };
            try {
              const count = await new ResourcesGetter(models.car, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(1);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });
      });

      describe('with live query segment', () => {
        describe('with a valid query', () => {
          it('should return the records filtered by the segment', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              fields: {
                user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken,age',
              },
              page: { number: '1', size: '30' },
              timezone: 'Europe/Paris',
              segmentQuery: "SELECT * FROM users WHERE users.email = 'richard@piedpiper.com'",
            };
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count filtered by the segment', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              search: '10',
              timezone: 'Europe/Paris',
              segmentQuery: "SELECT * FROM users WHERE users.email = 'richard@piedpiper.com'",
            };
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();

              expect(count).toStrictEqual(1);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with an invalid query', () => {
          it('should raise an error on perform', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              fields: {
                user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken,age',
              },
              page: { number: '1', size: '30' },
              timezone: 'Europe/Paris',
              segmentQuery: 'SELECT * FROM use',
            };
            try {
              await expect(new ResourcesGetter(models.user, sequelizeOptions, params).perform())
                .rejects.toThrow('Invalid SQL query for this Live Query segment');
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should raise an error on count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              search: '10',
              timezone: 'Europe/Paris',
              segmentQuery: 'SELECT * FROM use',
            };
            try {
              await expect(new ResourcesGetter(models.user, sequelizeOptions, params).count())
                .rejects.toThrow('Invalid SQL query for this Live Query segment');
            } finally {
              connectionManager.closeConnection();
            }
          });
        });
      });

      describe('with segment defined on the liana side', () => {
        it('should return the records filtered by the segment', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            fields: {
              car: 'id,brand,model',
            },
            page: { number: '1', size: '30' },
            timezone: 'Europe/Paris',
            segment: 'only monza sp*',
          };
          try {
            const result = await new ResourcesGetter(models.car, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(2);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should return the total records count filtered by the segment', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            fields: {
              car: 'id,brand,model',
            },
            page: { number: '1', size: '30' },
            timezone: 'Europe/Paris',
            segment: 'only monza sp*',
          };
          try {
            const count = await new ResourcesGetter(models.car, sequelizeOptions, params)
              .count();

            expect(count).toStrictEqual(2);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the resources getter with a search on a UUID primary key', () => {
        describe('with a UUID that does not exist', () => {
          it('should return 0 records for the specified page', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              fields: {
                bike: 'id,name',
              },
              page: { number: '1', size: '30' },
              search: '39a704a7-9149-448c-ac93-9c869c5af41d',
              timezone: 'Europe/Paris',
            };
            try {
              const result = await new ResourcesGetter(models.bike, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(0);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should count 0 records', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              search: '39a704a7-9149-448c-ac93-9c869c5af41d',
              timezone: 'Europe/Paris',
            };
            try {
              const count = await new ResourcesGetter(models.bike, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(0);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a UUID that exists', () => {
          it('should return 1 record for the specified page', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              fields: {
                bike: 'id,name',
              },
              page: { number: '1', size: '30' },
              search: '1a11dc05-4e04-4d8f-958b-0a9f23a141a3',
              timezone: 'Europe/Paris',
            };
            try {
              const result = await new ResourcesGetter(models.bike, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should count 1 record', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              search: '1a11dc05-4e04-4d8f-958b-0a9f23a141a3',
              timezone: 'Europe/Paris',
            };
            try {
              const count = await new ResourcesGetter(models.bike, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(1);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });
      });

      describe('request on the resources getter with a search on a string primary key', () => {
        describe('with a string that does not matches', () => {
          it('should return 0 records for the specified page', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              fields: {
                country: 'isocode,nameEnglish',
              },
              page: { number: '1', size: '30' },
              search: 'en',
              timezone: 'Europe/Paris',
            };
            try {
              const result = await new ResourcesGetter(models.georegion, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(0);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should count 0 records', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              search: 'en',
              timezone: 'Europe/Paris',
            };
            try {
              const count = await new ResourcesGetter(models.georegion, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(0);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a string that matches', () => {
          it('should return 1 record for the specified page', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              fields: {
                georegion: 'isocode,nameEnglish',
              },
              page: { number: '1', size: '30' },
              search: 'es',
              timezone: 'Europe/Paris',
            };
            try {
              const result = await new ResourcesGetter(models.georegion, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should count 1 record', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              search: 'es',
              timezone: 'Europe/Paris',
            };
            try {
              const count = await new ResourcesGetter(models.georegion, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(1);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });
      });

      describe('request on the resources getter with a search on a bigInt primary key', () => {
        describe('with a bigInt that does not matches', () => {
          it('should return 0 records for the specified page', async () => {
            expect.assertions(1);

            const { models, sequelizeOptions } = initializeSequelize();

            // HACK: sequelize-fixtures does not support BigInt in json files,
            //       so we need to update the id value manually
            await models.bird.update(
              { id: BigInt('9223372036854770000') }, // eslint-disable-line no-undef
              { where: { name: 'eagle' } },
            );

            const params = {
              fields: {
                bird: 'id,name',
              },
              page: { number: '1', size: '30' },
              search: '9223372036854770001',
              timezone: 'Europe/Paris',
            };
            try {
              const result = await new ResourcesGetter(models.bird, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(0);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should count 0 records', async () => {
            expect.assertions(1);

            const { models, sequelizeOptions } = initializeSequelize();

            // HACK: sequelize-fixtures does not support BigInt in json files,
            //       so we need to update the id value manually
            await models.bird.update(
              { id: BigInt('9223372036854770000') }, // eslint-disable-line no-undef
              { where: { name: 'eagle' } },
            );

            const params = {
              search: '9223372036854770001',
              timezone: 'Europe/Paris',
            };
            try {
              const count = await new ResourcesGetter(models.bird, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(0);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a string that matches', () => {
          it('should return 1 record for the specified page', async () => {
            expect.assertions(1);

            const { models, sequelizeOptions } = initializeSequelize();

            // HACK: sequelize-fixtures does not support BigInt in json files,
            //       so we need to update the id value manually
            await models.bird.update(
              { id: BigInt('9223372036854770000') }, // eslint-disable-line no-undef
              { where: { name: 'eagle' } },
            );

            const params = {
              fields: {
                bird: 'id,name',
              },
              page: { number: '1', size: '30' },
              search: '9223372036854770000',
              timezone: 'Europe/Paris',
            };
            try {
              const result = await new ResourcesGetter(models.bird, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should count 1 record', async () => {
            expect.assertions(1);

            const { models, sequelizeOptions } = initializeSequelize();

            // HACK: sequelize-fixtures does not support BigInt in json files,
            //       so we need to update the id value manually
            await models.bird.update(
              { id: BigInt('9223372036854770000') }, // eslint-disable-line no-undef
              { where: { name: 'eagle' } },
            );

            const params = {
              search: '9223372036854770000',
              timezone: 'Europe/Paris',
            };
            try {
              const count = await new ResourcesGetter(models.bird, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(1);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });
      });

      describe('request on the resources getter with a search on a collection with searchFields', () => {
        it('should return the records for the specified page', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            fields: {
              order: 'id,amount,description,giftComment',
            },
            page: { number: '1', size: '30' },
            search: 'gift',
            timezone: 'Europe/Paris',
          };
          try {
            const result = await new ResourcesGetter(models.order, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(1);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            search: 'gift',
            timezone: 'Europe/Paris',
          };
          try {
            const count = await new ResourcesGetter(models.order, sequelizeOptions, params).count();
            expect(count).toStrictEqual(1);
          } finally {
            connectionManager.closeConnection();
          }
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
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'equal',
              value: 100,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'equal',
              value: 100,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(1);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "greater than" condition on a number field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'greater_than',
              value: 101,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(2);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'greater_than',
              value: 101,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(2);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "less than" condition on a number field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'less_than',
              value: 104,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(4);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'less_than',
              value: 104,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(4);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "is not" condition on a number field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'not_equal',
              value: 100,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(3);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the records result', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'not_equal',
              value: 100,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(3);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "is null" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: null,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(2);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: null,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(2);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "is true" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: true,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: true,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(1);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "is false" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: false,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'equal',
              value: false,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(1);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "is not null" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not_equal',
              value: null,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(2);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not_equal',
              value: null,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(2);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "is not true" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not',
              value: true,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(3);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not',
              value: true,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(3);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "is not" condition on a string field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'not_equal',
              value: 'richard@piedpiper.com',
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(3);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'not_equal',
              value: 'richard@piedpiper.com',
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(3);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "is not false" condition on a boolean field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not',
              value: false,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(3);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'emailValid',
              operator: 'not',
              value: false,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(3);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "contains" condition on a string field', () => {
          it('should generate a valid SQL query for list', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'firstName',
              operator: 'contains',
              value: 'Richa',
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should generate a valid SQL query for count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'firstName',
              operator: 'contains',
              value: 'Richa',
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(1);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "not contains" condition on a string field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'username',
              operator: 'not_contains',
              value: 'hello',
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(4);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'username',
              operator: 'not_contains',
              value: 'hello',
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(4);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "starts with" condition on a string field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'starts_with',
              value: 'dinesh@',
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(1);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'starts_with',
              value: 'dinesh@',
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(1);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "ends with" condition on a string field', () => {
          it('should generate a valid SQL query for list', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'ends_with',
              value: '@piedpiper.com',
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(3);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should generate a valid SQL query for count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'email',
              operator: 'ends_with',
              value: '@piedpiper.com',
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(3);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "is present" condition on a string field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(4);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsAddressList);
            params.filters = JSON.stringify({
              field: 'country',
              operator: 'present',
              value: null,
            });
            try {
              await new ResourcesGetter(models.address, sequelizeOptions, params)
                .perform()
                .then((result) => {
                  _.each(result[0], (instance) => {
                    expect(instance.dataValues.country).toBeDefined();
                  });
                });
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "is blank" condition on a string field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsAddressList);
            params.filters = JSON.stringify({
              field: 'country',
              operator: 'blank',
              value: null,
            });
            try {
              const result = await new ResourcesGetter(models.address, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(2);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsAddressCount);
            params.filters = JSON.stringify({
              field: 'country',
              operator: 'blank',
              value: null,
            });
            try {
              const count = await new ResourcesGetter(models.address, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(2);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "is blank" condition on a date field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsAddressList);
            params.filters = JSON.stringify({
              field: 'archivedAt',
              operator: 'blank',
              value: null,
            });
            try {
              const result = await new ResourcesGetter(models.address, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(2);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsAddressCount);
            params.filters = JSON.stringify({
              field: 'archivedAt',
              operator: 'blank',
              value: null,
            });
            try {
              const count = await new ResourcesGetter(models.address, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(2);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "before x hours" condition on a date field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'createdAt',
              operator: 'before_x_hours_ago',
              value: 2,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(0);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'createdAt',
              operator: 'before_x_hours_ago',
              value: 2,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(0);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "after x hours" condition on a date field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'createdAt',
              operator: 'after_x_hours_ago',
              value: 2,
            });
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(4);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'createdAt',
              operator: 'after_x_hours_ago',
              value: 2,
            });
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(4);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('with a "in" condition on a number field', () => {
          it('should generate a valid SQL query', async () => {
            expect.assertions(1);

            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'in',
              value: [100, 101, 102],
            });
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            // Only users with ids 100 and 102 exist in fixtures
            expect(result[0]).toHaveLength(2);
          });

          it('should return the records result', async () => {
            expect.assertions(1);

            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = JSON.stringify({
              field: 'id',
              operator: 'in',
              value: [100, 101, 102],
            });
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            // Only users with ids 100 and 102 exist in fixtures
            expect(count).toStrictEqual(2);
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
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseList);
            params.filters = filters;
            try {
              const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .perform();
              expect(result[0]).toHaveLength(3);
            } finally {
              connectionManager.closeConnection();
            }
          });

          it('should return the total records count', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = _.clone(paramsBaseCount);
            params.filters = filters;
            try {
              const count = await new ResourcesGetter(models.user, sequelizeOptions, params)
                .count();
              expect(count).toStrictEqual(3);
            } finally {
              connectionManager.closeConnection();
            }
          });
        });
      });

      describe('request on the resources getter with a filter condition and search', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
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
          try {
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(0);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            filters: JSON.stringify({
              field: 'username',
              operator: 'contains',
              value: 'hello',
            }),
            search: 'world',
            timezone: 'Europe/Paris',
          };
          try {
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(0);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the resources getter with an extended search with a UUID input', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
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
          try {
            const result = await new ResourcesGetter(models.address, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(4);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            search: '1a11dc05-4e04-4d8f-958b-0a9f23a141a3',
            searchExtended: 1,
            timezone: 'Europe/Paris',
          };
          try {
            const count = await new ResourcesGetter(models.address, sequelizeOptions, params)
              .count();
            expect(count).toStrictEqual(4);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the resources getter with a filter condition, search and sort combined', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
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
          try {
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(0);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            filters: JSON.stringify({
              field: 'username',
              operator: 'contains',
              value: 'hello',
            }),
            search: 'world',
            timezone: 'Europe/Paris',
          };
          try {
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(0);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the resources getter with a Live Query segment', () => {
        it('should respond with a valid result', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken',
            },
            page: { number: '1', size: '50' },
            sort: '-id',
            segmentQuery: 'select * from users\nwhere id in (100, 102);',
            timezone: 'Europe/Paris',
          };
          try {
            const result = await new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform();
            expect(result[0]).toHaveLength(2);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            segmentQuery: 'select * from users\nwhere id in (100, 102);',
            timezone: 'Europe/Paris',
          };
          try {
            const count = await new ResourcesGetter(models.user, sequelizeOptions, params).count();
            expect(count).toStrictEqual(2);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the resources getter with a smart field', () => {
        it('should only retrieve requested fields when only DB fields are used', async () => {
          expect.assertions(5);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            fields: {
              address: 'user',
              user: 'firstName',
            },
            page: { number: '1' },
            timezone: 'Europe/Paris',
          };
          try {
            const result = await new ResourcesGetter(
              models.address,
              sequelizeOptions,
              params,
            ).perform();

            expect(result[0]).not.toHaveLength(0);
            expect(result[0][0]).toHaveProperty('user');
            expect(result[0][0].user.dataValues).toHaveProperty('firstName');
            expect(result[0][0].user.dataValues).toHaveProperty('id');
            expect(result[0][0].user.dataValues).not.toHaveProperty('lastName');
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should retrieve all fields when a smart field is requested', async () => {
          expect.assertions(5);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            fields: {
              address: 'user',
              user: 'fullName',
            },
            page: { number: '1' },
            timezone: 'Europe/Paris',
          };
          try {
            const result = await new ResourcesGetter(
              models.address,
              sequelizeOptions,
              params,
            ).perform();

            expect(result[0]).not.toHaveLength(0);
            expect(result[0][0]).toHaveProperty('user');
            expect(result[0][0].user.dataValues).toHaveProperty('firstName');
            expect(result[0][0].user.dataValues).toHaveProperty('id');
            expect(result[0][0].user.dataValues).toHaveProperty('lastName');
          } finally {
            connectionManager.closeConnection();
          }
        });
      });
    });

    describe('hasmany > has-many-getter', () => {
      describe('request on the has-many getter without sort', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            recordId: 100,
            associationName: 'addresses',
            fields: {
              address: 'line,zipCode,city,country,user',
            },
            page: { number: '1', size: '20' },
            timezone: 'Europe/Paris',
          };
          try {
            const result = await new HasManyGetter(
              models.user,
              models.address,
              sequelizeOptions,
              params,
            )
              .perform();
            expect(result[0]).toHaveLength(4);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            recordId: 100,
            associationName: 'addresses',
            timezone: 'Europe/Paris',
          };
          try {
            const count = await new HasManyGetter(
              models.user,
              models.address,
              sequelizeOptions,
              params,
            )
              .count();
            expect(count).toStrictEqual(4);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should only return the ids of the other relationships when fields are specified', async () => {
          expect.assertions(2);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            recordId: 100,
            associationName: 'addresses',
            fields: {
              address: 'line,zipCode,city,country',
              user: 'id',
            },
            page: { number: '1', size: '20' },
            timezone: 'Europe/Paris',
          };
          try {
            const result = await new HasManyGetter(
              models.user,
              models.address,
              sequelizeOptions,
              params,
            )
              .perform();
            expect(result[0]).not.toHaveLength(0);
            const firstEntry = result[0][0];

            expect(Object.keys(firstEntry.user.dataValues)).toStrictEqual(['id']);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the has-many getter without relations', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            recordId: 100,
            associationName: 'addresses',
            fields: {
              address: 'line,zipCode,city,country',
            },
            page: { number: '1', size: '20' },
            timezone: 'Europe/Paris',
          };
          try {
            await new HasManyGetter(
              models.user,
              models.address,
              sequelizeOptions,
              params,
            )
              .perform();
            expect(true).toBeTrue();
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the has-many-getter with a sort on an attribute', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
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
          try {
            const result = await new HasManyGetter(
              models.user,
              models.address,
              sequelizeOptions,
              params,
            )
              .perform();
            expect(result[0]).toHaveLength(4);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            recordId: 100,
            associationName: 'addresses',
            timezone: 'Europe/Paris',
          };
          try {
            const count = await new HasManyGetter(
              models.user,
              models.address,
              sequelizeOptions,
              params,
            )
              .count();
            expect(count).toStrictEqual(4);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the has-many-getter with a sort on a belongsTo', () => {
        it('should generate a valid SQL query', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
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
          try {
            const result = await new HasManyGetter(
              models.user,
              models.address,
              sequelizeOptions,
              params,
            )
              .perform();
            expect(result[0]).toHaveLength(4);
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should return the total records count', async () => {
          expect.assertions(1);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            recordId: 100,
            associationName: 'addresses',
            timezone: 'Europe/Paris',
          };
          try {
            const count = await new HasManyGetter(
              models.user,
              models.address,
              sequelizeOptions,
              params,
            )
              .count();
            expect(count).toStrictEqual(4);
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('request on the has-many-getter with a smart field for an association', () => {
        it('should get all fields for addresses when a smart field is requested', async () => {
          expect.assertions(4);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            recordId: 100,
            associationName: 'addresses',
            fields: {
              address: 'street',
              user: 'fullName',
            },
            page: { number: '1', size: '20' },
            timezone: 'Europe/Paris',
          };
          try {
            const result = await new HasManyGetter(
              models.user,
              models.address,
              sequelizeOptions,
              params,
            )
              .perform();
            expect(result[0]).not.toHaveLength(0);
            expect(result[0][0].user.dataValues).toHaveProperty('id');
            expect(result[0][0].user.dataValues).toHaveProperty('firstName');
            expect(result[0][0].user.dataValues).toHaveProperty('lastName');
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should get only requested fields on the related users', async () => {
          expect.assertions(5);
          const { models, sequelizeOptions } = initializeSequelize();
          const params = {
            recordId: 100,
            associationName: 'addresses',
            fields: {
              address: 'street',
              user: 'firstName',
            },
            page: { number: '1', size: '20' },
            timezone: 'Europe/Paris',
          };
          try {
            const result = await new HasManyGetter(
              models.user,
              models.address,
              sequelizeOptions,
              params,
            )
              .perform();
            expect(result[0]).not.toHaveLength(0);
            expect(result[0][0]).toHaveProperty('user');
            expect(result[0][0].user.dataValues).toHaveProperty('firstName');
            expect(result[0][0].user.dataValues).toHaveProperty('id');
            expect(result[0][0].user.dataValues).not.toHaveProperty('lastName');
          } finally {
            connectionManager.closeConnection();
          }
        });
      });
    });

    describe('request on the has-many-getter with a search parameter', () => {
      it('should return the records for the specified page', async () => {
        expect.assertions(1);
        const { models, sequelizeOptions } = initializeSequelize();
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
        try {
          const result = await new HasManyGetter(
            models.user,
            models.address,
            sequelizeOptions,
            params,
          )
            .perform();
          expect(result[0]).toHaveLength(1);
        } finally {
          connectionManager.closeConnection();
        }
      });

      it('should return the total records count', async () => {
        expect.assertions(1);
        const { models, sequelizeOptions } = initializeSequelize();
        const params = {
          recordId: 100,
          associationName: 'addresses',
          search: 'SF',
          timezone: 'Europe/Paris',
        };
        try {
          const count = await new HasManyGetter(
            models.user,
            models.address,
            sequelizeOptions,
            params,
          ).count();
          expect(count).toStrictEqual(1);
        } finally {
          connectionManager.closeConnection();
        }
      });
    });

    describe('resources > resource-getter', () => {
      describe('get a record in a simple collection', () => {
        it('should retrieve the record', async () => {
          expect.assertions(3);
          const { models } = initializeSequelize();
          const params = {
            recordId: 100,
          };
          try {
            const user = await new ResourceGetter(models.user, params).perform();
            expect(user).not.toBeNull();
            expect(user.id).toStrictEqual(100);
            expect(user.firstName).toStrictEqual('Richard');
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('get a record in a collection with a composite primary key', () => {
        it('should retrieve the record', async () => {
          expect.assertions(2);
          const { models } = initializeSequelize();
          const params = {
            recordId: 'G@G#F@G@|Ggg23g242@',
          };
          try {
            const log = await new ResourceGetter(models.log, params).perform();
            expect(log).not.toBeNull();
            expect(log.forestCompositePrimary).toStrictEqual('G@G#F@G@|Ggg23g242@');
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('get a non existing record', () => {
        it('should fail', async () => {
          expect.assertions(1);
          const { models } = initializeSequelize();
          const params = { recordId: '123123|123' };

          try {
            await expect(new ResourceGetter(models.log, params).perform()).toReject();
          } finally {
            connectionManager.closeConnection();
          }
        });
      });
    });

    describe('resources > resources updater', () => {
      describe('update a record on a collection', () => {
        it('should update a record', async () => {
          expect.assertions(1);
          const { models } = initializeSequelize();
          try {
            const updater = new ResourceUpdater(models.car, { recordId: 102 }, { brand: 'Volvo' });
            await updater.perform();

            const car = await models.car.findOne({ where: { id: 102 } });
            expect(car.brand).toStrictEqual('Volvo');
          } finally {
            await models.car.update({ brand: 'Ferrari' }, { where: { id: 102 } });
            connectionManager.closeConnection();
          }
        });

        it('should reject if the record is invalid according to sequelize validation', async () => {
          expect.assertions(1);
          const { models } = initializeSequelize();
          try {
            const updater = new ResourceUpdater(models.car, { recordId: 102 }, { brand: 'Fiat' });
            await expect(updater.perform()).toReject();
          } finally {
            connectionManager.closeConnection();
          }
        });

        it('should reject if the record does not exists', async () => {
          expect.assertions(1);
          const { models } = initializeSequelize();
          try {
            const updater = new ResourceUpdater(models.car, { recordId: 666 }, { brand: 'Volvo' });
            await expect(updater.perform()).toReject();
          } finally {
            connectionManager.closeConnection();
          }
        });
      });
    });

    describe('resources > resources-remover', () => {
      describe('remove a record in a simple collection', () => {
        it('should destroy the record', async () => {
          expect.assertions(1);
          const { models } = initializeSequelize();
          const params = {
            recordId: 1,
          };
          try {
            await new ResourceRemover(models.user, params).perform();
            const user = await models.user.findOne({ where: { email: 'jack@forestadmin.com' } });
            expect(user).toBeNull();
          } finally {
            connectionManager.closeConnection();
          }
        });
      });

      describe('remove a record in a collection with a composite primary key', () => {
        it('should destroy the record', async () => {
          expect.assertions(1);
          const { models } = initializeSequelize();
          const params = {
            recordId: 'G@G#F@G@|Ggg23g242@',
          };
          try {
            await new ResourceRemover(models.log, params).perform();
            const log = await models.log.findOne({ where: { code: 'G@G#F@G@' } });
            expect(log).toBeNull();
          } finally {
            connectionManager.closeConnection();
          }
        });
      });
    });

    describe('has-many > has-many-dissociator', () => {
      describe('dissociate', () => {
        describe('on HasMany relationship', () => {
          it('should delete the relationship of the record', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              recordId: '100',
              associationName: 'addresses',
            };
            const data = {
              data: [
                { id: '103', type: 'address' },
              ],
            };
            try {
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
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('on belongs-to-many relationship', () => {
          it('should delete the relationship of the record', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
            const params = {
              recordId: '100',
              associationName: 'teams',
            };
            const data = {
              data: [
                { id: '100', type: 'team' },
              ],
            };
            try {
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
            } finally {
              connectionManager.closeConnection();
            }
          });
        });
      });

      describe('delete', () => {
        describe('on has-many relationship', () => {
          it('should delete the relationship and delete the record', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
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
            try {
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
            } finally {
              connectionManager.closeConnection();
            }
          });
        });

        describe('on belongs-to-many relationship', () => {
          it('should delete the relationship and delete the record', async () => {
            expect.assertions(1);
            const { models, sequelizeOptions } = initializeSequelize();
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
            try {
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
            } finally {
              connectionManager.closeConnection();
            }
          });
        });
      });
    });
  });
});
