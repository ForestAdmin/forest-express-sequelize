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

async function initializeField() {
  const model = sequelize.define('user', {
    uuid: {
      type: Sequelize.DataTypes.UUID,
      defaultValue: Sequelize.DataTypes.UUIDV4,
    },
  });

  return sequelize.sync({ force: true })
    .then(() => new ApimapFieldBuilder(
      model,
      _.values(model.rawAttributes)[1],
      { sequelize: Sequelize },
    )
      .perform());
}

describe('services > apimap-field-builder', () => {
  describe('on a UUID column with a UUIDV4 defaultValue', () => {
    it('should have a name uuid', async () => {
      expect.assertions(1);
      const field = await initializeField();
      expect(field.field).toStrictEqual('uuid');
    });

    it('should have a String type', async () => {
      expect.assertions(1);
      const field = await initializeField();
      expect(field.type).toStrictEqual('String');
    });

    it('should not be set as required', async () => {
      expect.assertions(1);
      const field = await initializeField();
      expect(field.isRequired).toStrictEqual(false);
    });

    it('should not have a default value', async () => {
      expect.assertions(1);
      const field = await initializeField();
      expect(field.defaultValue).toBeUndefined();
    });
  });
});
