const _ = require('lodash');
const Sequelize = require('sequelize');
const ApimapFieldBuilder = require('../../src/services/apimap-field-builder');

const databaseOptions = {
  logging: false,
  pool: { maxConnections: 10, minConnections: 1 },
};

const sequelize = new Sequelize(
  'postgres://forest:secret@localhost:5436/forest-express-sequelize-test',
  databaseOptions,
);

async function initializeField(fieldDefinitions, modelName = 'testModel') {
  const model = sequelize.define(modelName, fieldDefinitions);

  return sequelize.sync({ force: true })
    .then(() => _.mapValues(model.rawAttributes, (attribute) =>
      new ApimapFieldBuilder(
        model,
        attribute,
        { sequelize: Sequelize },
      )
        .perform()));
}

describe('services > apimap-field-builder', () => {
  describe('on a UUID column with a UUIDV4 defaultValue', () => {
    const fieldDefinitions = {
      uuid: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
      },
    };

    it('should have a name uuid', async () => {
      expect.assertions(1);
      const { uuid } = await initializeField(fieldDefinitions);
      expect(uuid.field).toStrictEqual('uuid');
    });

    it('should have a String type', async () => {
      expect.assertions(1);
      const { uuid } = await initializeField(fieldDefinitions);
      expect(uuid.type).toStrictEqual('String');
    });

    it('should not be set as required', async () => {
      expect.assertions(1);
      const { uuid } = await initializeField(fieldDefinitions);
      expect(uuid.isRequired).toStrictEqual(false);
    });

    it('should not have a default value', async () => {
      expect.assertions(1);
      const { uuid } = await initializeField(fieldDefinitions);
      expect(uuid.defaultValue).toBeUndefined();
    });
  });

  describe('on other default values', () => {
    it('should handle raw values', async () => {
      expect.assertions(16);

      const fieldDefinitions = {
        arrayValue: {
          type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.INTEGER),
          defaultValue: [0, 21, 42],
        },
        intValue: {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 42,
        },
        jsonValue: {
          type: Sequelize.DataTypes.JSONB,
          defaultValue: {
            value: 42,
            lorem: 'ipsum',
          },
        },
        stringValue: {
          type: Sequelize.DataTypes.STRING,
          defaultValue: 'default_value',
        },
      };
      const {
        arrayValue,
        intValue,
        jsonValue,
        stringValue,
      } = await initializeField(fieldDefinitions);

      expect(arrayValue.field).toStrictEqual('arrayValue');
      expect(arrayValue.type).toStrictEqual(['Number']);
      expect(arrayValue.isRequired).toBeUndefined();
      expect(arrayValue.defaultValue).toStrictEqual([0, 21, 42]);

      expect(intValue.field).toStrictEqual('intValue');
      expect(intValue.type).toStrictEqual('Number');
      expect(intValue.isRequired).toBeUndefined();
      expect(intValue.defaultValue).toStrictEqual(42);

      expect(jsonValue.field).toStrictEqual('jsonValue');
      expect(jsonValue.type).toStrictEqual('Json');
      expect(jsonValue.isRequired).toBeUndefined();
      expect(jsonValue.defaultValue).toStrictEqual({
        value: 42,
        lorem: 'ipsum',
      });

      expect(stringValue.field).toStrictEqual('stringValue');
      expect(stringValue.type).toStrictEqual('String');
      expect(stringValue.isRequired).toBeUndefined();
      expect(stringValue.defaultValue).toStrictEqual('default_value');
    });
  });

  describe('on Sequelize.Utils.Literal values', () => {
    it('should handle simple values', async () => {
      expect.assertions(8);

      const fieldDefinitions = {
        boolLiteral: {
          type: Sequelize.DataTypes.BOOLEAN,
          defaultValue: Sequelize.literal(true),
        },
        intLiteral: {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: Sequelize.literal(42),
        },
      };
      const {
        boolLiteral,
        intLiteral,
      } = await initializeField(fieldDefinitions);

      expect(boolLiteral.field).toStrictEqual('boolLiteral');
      expect(boolLiteral.type).toStrictEqual('Boolean');
      expect(boolLiteral.isRequired).toBeUndefined();
      expect(boolLiteral.defaultValue).toStrictEqual(true);

      expect(intLiteral.field).toStrictEqual('intLiteral');
      expect(intLiteral.type).toStrictEqual('Number');
      expect(intLiteral.isRequired).toBeUndefined();
      expect(intLiteral.defaultValue).toStrictEqual(42);
    });

    it('should handle quoted values', async () => {
      expect.assertions(24);

      const fieldDefinitions = {
        boolStringLiteral: {
          type: Sequelize.DataTypes.BOOLEAN,
          defaultValue: Sequelize.literal('true'),
        },
        expressionLiteral: {
          type: Sequelize.DataTypes.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        functionLiteral: {
          type: Sequelize.DataTypes.DATE,
          defaultValue: Sequelize.literal('now()'),
        },
        intStringLiteral: {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: Sequelize.literal('42'),
        },
        stringIntLiteral: {
          type: Sequelize.DataTypes.STRING,
          defaultValue: Sequelize.literal('042'),
        },
        stringStringLiteral: {
          type: Sequelize.DataTypes.STRING,
          defaultValue: Sequelize.literal('\'default_value\''),
        },
      };
      const {
        boolStringLiteral,
        expressionLiteral,
        functionLiteral,
        intStringLiteral,
        stringIntLiteral,
        stringStringLiteral,
      } = await initializeField(fieldDefinitions);

      // NOTICE: Expressions are skipped as client does not evaluate them.
      expect(expressionLiteral.field).toStrictEqual('expressionLiteral');
      expect(expressionLiteral.type).toStrictEqual('Date');
      expect(expressionLiteral.isRequired).toStrictEqual(false);
      expect(expressionLiteral.defaultValue).toBeUndefined();

      // NOTICE: Function calls are skipped as client does not evaluate them.
      expect(functionLiteral.field).toStrictEqual('functionLiteral');
      expect(functionLiteral.type).toStrictEqual('Date');
      expect(functionLiteral.isRequired).toStrictEqual(false);
      expect(functionLiteral.defaultValue).toBeUndefined();

      // NOTICE: Other simple values are kept as is.
      expect(boolStringLiteral.field).toStrictEqual('boolStringLiteral');
      expect(boolStringLiteral.type).toStrictEqual('Boolean');
      expect(boolStringLiteral.isRequired).toBeUndefined();
      expect(boolStringLiteral.defaultValue).toStrictEqual(true);

      expect(intStringLiteral.field).toStrictEqual('intStringLiteral');
      expect(intStringLiteral.type).toStrictEqual('Number');
      expect(intStringLiteral.isRequired).toBeUndefined();
      expect(intStringLiteral.defaultValue).toStrictEqual(42);

      expect(stringIntLiteral.field).toStrictEqual('stringIntLiteral');
      expect(stringIntLiteral.type).toStrictEqual('String');
      expect(stringIntLiteral.isRequired).toBeUndefined();
      expect(stringIntLiteral.defaultValue).toStrictEqual('042');

      expect(stringStringLiteral.field).toStrictEqual('stringStringLiteral');
      expect(stringStringLiteral.type).toStrictEqual('String');
      expect(stringStringLiteral.isRequired).toBeUndefined();
      expect(stringStringLiteral.defaultValue).toStrictEqual('default_value');
    });
  });
});
