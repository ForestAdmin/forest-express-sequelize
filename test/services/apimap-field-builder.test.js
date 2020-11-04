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

function initializeField(fieldDefinitions, modelName = 'testModel') {
  const model = sequelize.define(modelName, fieldDefinitions);

  return _.mapValues(model.rawAttributes, (attribute) =>
    new ApimapFieldBuilder(
      model,
      attribute,
      { sequelize: Sequelize },
    ).perform());
}

describe('services > apimap-field-builder', () => {
  describe('on a UUID column with a UUIDV4 defaultValue', () => {
    const fieldDefinitions = {
      uuid: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
      },
    };

    it('should have a name uuid', () => {
      expect.assertions(1);
      const { uuid } = initializeField(fieldDefinitions);
      expect(uuid.field).toStrictEqual('uuid');
    });

    it('should have a String type', () => {
      expect.assertions(1);
      const { uuid } = initializeField(fieldDefinitions);
      expect(uuid.type).toStrictEqual('String');
    });

    it('should not be set as required', () => {
      expect.assertions(1);
      const { uuid } = initializeField(fieldDefinitions);
      expect(uuid.isRequired).toStrictEqual(false);
    });

    it('should not have a default value', () => {
      expect.assertions(1);
      const { uuid } = initializeField(fieldDefinitions);
      expect(uuid.defaultValue).toBeUndefined();
    });
  });

  describe('on a UUID column without a defaultValue', () => {
    const fieldDefinitions = {
      uuid: {
        type: Sequelize.DataTypes.UUID,
        primaryKey: true,
      },
    };

    it('should be set as primary key', () => {
      expect.assertions(1);
      const { uuid } = initializeField(fieldDefinitions);
      expect(uuid.isPrimaryKey).toStrictEqual(true);
    });

    it('should be set as required', () => {
      expect.assertions(1);
      const { uuid } = initializeField(fieldDefinitions);
      expect(uuid.isRequired).toStrictEqual(true);
    });
  });

  describe('on other default values', () => {
    it('should handle array values', () => {
      expect.assertions(4);

      const fieldDefinitions = {
        arrayValue: {
          type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.INTEGER),
          defaultValue: [0, 21, 42],
        },
      };
      const { arrayValue } = initializeField(fieldDefinitions);

      expect(arrayValue.field).toStrictEqual('arrayValue');
      expect(arrayValue.type).toStrictEqual(['Number']);
      expect(arrayValue.isRequired).toBeUndefined();
      expect(arrayValue.defaultValue).toStrictEqual([0, 21, 42]);
    });

    it('should handle boolean values', () => {
      expect.assertions(4);

      const fieldDefinitions = {
        boolValue: {
          type: Sequelize.DataTypes.BOOLEAN,
          defaultValue: true,
        },
      };
      const { boolValue } = initializeField(fieldDefinitions);

      expect(boolValue.field).toStrictEqual('boolValue');
      expect(boolValue.type).toStrictEqual('Boolean');
      expect(boolValue.isRequired).toBeUndefined();
      expect(boolValue.defaultValue).toStrictEqual(true);
    });

    it('should handle integer values', () => {
      expect.assertions(4);

      const fieldDefinitions = {
        intValue: {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 42,
        },
      };
      const { intValue } = initializeField(fieldDefinitions);

      expect(intValue.field).toStrictEqual('intValue');
      expect(intValue.type).toStrictEqual('Number');
      expect(intValue.isRequired).toBeUndefined();
      expect(intValue.defaultValue).toStrictEqual(42);
    });

    it('should handle json values', () => {
      expect.assertions(4);

      const fieldDefinitions = {
        jsonValue: {
          type: Sequelize.DataTypes.JSONB,
          defaultValue: {
            value: 42,
            lorem: 'ipsum',
          },
        },
      };
      const { jsonValue } = initializeField(fieldDefinitions);

      expect(jsonValue.field).toStrictEqual('jsonValue');
      expect(jsonValue.type).toStrictEqual('Json');
      expect(jsonValue.isRequired).toBeUndefined();
      expect(jsonValue.defaultValue).toStrictEqual({
        value: 42,
        lorem: 'ipsum',
      });
    });

    it('should handle string values', () => {
      expect.assertions(4);

      const fieldDefinitions = {
        stringValue: {
          type: Sequelize.DataTypes.STRING,
          defaultValue: 'default_value',
        },
      };
      const { stringValue } = initializeField(fieldDefinitions);

      expect(stringValue.field).toStrictEqual('stringValue');
      expect(stringValue.type).toStrictEqual('String');
      expect(stringValue.isRequired).toBeUndefined();
      expect(stringValue.defaultValue).toStrictEqual('default_value');
    });
  });

  describe('on Sequelize.Utils.Literal values', () => {
    it('should handle boolean values', () => {
      expect.assertions(4);

      const fieldDefinitions = {
        boolLiteral: {
          type: Sequelize.DataTypes.BOOLEAN,
          defaultValue: Sequelize.literal(true),
        },
      };
      const { boolLiteral } = initializeField(fieldDefinitions);

      expect(boolLiteral.field).toStrictEqual('boolLiteral');
      expect(boolLiteral.type).toStrictEqual('Boolean');
      expect(boolLiteral.isRequired).toBeUndefined();
      expect(boolLiteral.defaultValue).toStrictEqual(true);
    });

    it('should handle integer values', () => {
      expect.assertions(4);

      const fieldDefinitions = {
        intLiteral: {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: Sequelize.literal(42),
        },
      };
      const { intLiteral } = initializeField(fieldDefinitions);

      expect(intLiteral.field).toStrictEqual('intLiteral');
      expect(intLiteral.type).toStrictEqual('Number');
      expect(intLiteral.isRequired).toBeUndefined();
      expect(intLiteral.defaultValue).toStrictEqual(42);
    });

    it('should handle string values', () => {
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
      } = initializeField(fieldDefinitions);

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
