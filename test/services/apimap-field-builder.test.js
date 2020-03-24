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
      expect.assertions(8);

      const fieldDefinitions = {
        intValue: {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 42,
        },
        stringValue: {
          type: Sequelize.DataTypes.STRING,
          defaultValue: 'default_value',
        },
      };
      const { intValue, stringValue } = await initializeField(fieldDefinitions);

      expect(intValue.field).toStrictEqual('intValue');
      expect(intValue.type).toStrictEqual('Number');
      expect(intValue.isRequired).toBeUndefined();
      expect(intValue.defaultValue).toStrictEqual(42);

      expect(stringValue.field).toStrictEqual('stringValue');
      expect(stringValue.type).toStrictEqual('String');
      expect(stringValue.isRequired).toBeUndefined();
      expect(stringValue.defaultValue).toStrictEqual('default_value');
    });
  });

  it('should handle Sequelize Literal values', async () => {
    expect.assertions(16);

    const fieldDefinitions = {
      expressionLiteral: {
        type: Sequelize.DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      functionLiteral: {
        type: Sequelize.DataTypes.DATE,
        defaultValue: Sequelize.literal('now()'),
      },
      intLiteral: {
        type: Sequelize.DataTypes.INTEGER,
        defaultValue: Sequelize.literal('42'),
      },
      stringLiteral: {
        type: Sequelize.DataTypes.STRING,
        defaultValue: Sequelize.literal('\'default_value\''),
      },
    };
    const {
      expressionLiteral,
      functionLiteral,
      intLiteral,
      stringLiteral,
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
    expect(intLiteral.field).toStrictEqual('intLiteral');
    expect(intLiteral.type).toStrictEqual('Number');
    expect(intLiteral.isRequired).toBeUndefined();
    expect(intLiteral.defaultValue).toStrictEqual('42');

    expect(stringLiteral.field).toStrictEqual('stringLiteral');
    expect(stringLiteral.type).toStrictEqual('String');
    expect(stringLiteral.isRequired).toBeUndefined();
    expect(stringLiteral.defaultValue).toStrictEqual('\'default_value\'');
  });
});
