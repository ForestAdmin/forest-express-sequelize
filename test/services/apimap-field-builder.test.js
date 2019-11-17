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

describe('services > apimap-field-builder', () => {
  describe('on a UUID column with a UUIDV4 defaultValue', () => {
    let field;

    beforeAll(() => {
      const model = sequelize.define('user', {
        uuid: {
          type: Sequelize.DataTypes.UUID,
          defaultValue: Sequelize.DataTypes.UUIDV4,
        },
      });

      return sequelize.sync({ force: true })
        .then(() => {
          field = new ApimapFieldBuilder(
            model,
            _.values(model.rawAttributes)[1],
            { sequelize: Sequelize },
          )
            .perform();
        });
    });

    it('should have a name uuid', () => {
      expect.assertions(1);
      expect(field.field).toStrictEqual('uuid');
    });

    it('should have a String type', () => {
      expect.assertions(1);
      expect(field.type).toStrictEqual('String');
    });

    it('should not be set as required', () => {
      expect.assertions(1);
      expect(field.isRequired).toStrictEqual(false);
    });

    it('should not have a default value', () => {
      expect.assertions(1);
      expect(field.defaultValue).toBeUndefined();
    });
  });
});
