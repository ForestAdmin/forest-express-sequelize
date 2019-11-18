const _ = require('lodash');
const Sequelize = require('sequelize');
const { expect } = require('chai');
const ApimapFieldBuilder = require('../../src/services/apimap-field-builder');

const databaseOptions = {
  logging: false,
  pool: { maxConnections: 10, minConnections: 1 },
};

const sequelize = new Sequelize(
  'postgres://forest:secret@localhost:5436/forest-express-sequelize-test',
  databaseOptions,
);

describe('Services > ApimapFieldBuilder', () => {
  describe('on a UUID column with a UUIDV4 defaultValue', () => {
    let field;

    before(() => {
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
      expect(field.field).equal('uuid');
    });

    it('should have a String type', () => {
      expect(field.type).equal('String');
    });

    it('should not be set as required', () => {
      expect(field.isRequired).to.be.false; // eslint-disable-line
    });

    it('should not have a default value', () => {
      expect(field.defaultValue).to.be.undefined; // eslint-disable-line
    });
  });
});
