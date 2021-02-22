const Sequelize = require('sequelize');
const getSchema = require('../../src/adapters/sequelize');
const { sequelizePostgres, sequelizeMySQLMin, sequelizeMySQLMax } = require('../databases');

function getField(schema, name) {
  return schema.fields.find((field) => field.field === name);
}

[sequelizePostgres, sequelizeMySQLMin, sequelizeMySQLMax].forEach((connectionManager) => {
  const sequelize = connectionManager.createConnection();
  const models = {};
  const sequelizeOptions = {
    Sequelize,
    connections: { sequelize },
  };

  models.user = sequelize.define('user', {
    username: { type: Sequelize.STRING },
    role: { type: Sequelize.ENUM(['admin', 'user']) },
    permissions: {
      type: Sequelize.ARRAY(Sequelize.ENUM([
        'documents:write',
        'documents:read',
      ])),
    },
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

  describe(`with dialect ${connectionManager.getDialect()} (port: ${connectionManager.getPort()})`, () => {
    describe('with model `users`', () => {
      it('should set name correctly', async () => {
        expect.assertions(1);

        const schema = await getSchema(models.user, sequelizeOptions);
        expect(schema.name).toStrictEqual('user');
      });

      it('should set idField to id', async () => {
        expect.assertions(1);

        const schema = await getSchema(models.user, sequelizeOptions);
        expect(schema.idField).toStrictEqual('id');
      });

      it('should set primaryKeys to [id]', async () => {
        expect.assertions(1);

        const schema = await getSchema(models.user, sequelizeOptions);
        expect(schema.primaryKeys).toStrictEqual(['id']);
      });

      it('should set isCompositePrimary to false', async () => {
        expect.assertions(1);

        const schema = await getSchema(models.user, sequelizeOptions);
        expect(schema.isCompositePrimary).toStrictEqual(false);
      });

      describe('when setting fields values', () => {
        it('should generate id field', async () => {
          expect.assertions(1);

          const schema = await getSchema(models.user, sequelizeOptions);
          expect(getField(schema, 'id')).toStrictEqual({
            field: 'id',
            type: 'Number',
            columnName: 'id',
            isPrimaryKey: true,
          });
        });

        it('should set username field', async () => {
          expect.assertions(1);

          const schema = await getSchema(models.user, sequelizeOptions);
          expect(getField(schema, 'username')).toStrictEqual({
            field: 'username',
            type: 'String',
            columnName: 'username',
          });
        });

        it('should handle enum (role field)', async () => {
          expect.assertions(1);

          const schema = await getSchema(models.user, sequelizeOptions);
          expect(getField(schema, 'role')).toStrictEqual({
            field: 'role',
            type: 'Enum',
            columnName: 'role',
            enums: ['admin', 'user'],
          });
        });

        it('should handle array of enum (role field)', async () => {
          expect.assertions(1);

          const schema = await getSchema(models.user, sequelizeOptions);
          expect(getField(schema, 'permissions')).toStrictEqual({
            field: 'permissions',
            type: ['Enum'],
            columnName: 'permissions',
            enums: ['documents:write', 'documents:read'],
          });
        });

        it('should generate timestamps', async () => {
          expect.assertions(2);

          const schema = await getSchema(models.user, sequelizeOptions);
          expect(getField(schema, 'createdAt')).toStrictEqual({
            field: 'createdAt',
            type: 'Date',
            columnName: 'createdAt',
          });
          expect(getField(schema, 'updatedAt')).toStrictEqual({
            field: 'updatedAt',
            type: 'Date',
            columnName: 'updatedAt',
          });
        });
      });
    });

    describe('with association', () => {
      it('should set foreignAndPrimaryKey to true', async () => {
        expect.assertions(1);

        const schema = await getSchema(models.picture, sequelizeOptions);
        expect(schema.fields.find((x) => x.field === 'customer').foreignAndPrimaryKey).toBeTrue();
      });
    });
  });
});
