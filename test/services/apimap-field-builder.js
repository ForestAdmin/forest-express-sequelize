'use strict';
/* global describe, before, it */
/* jshint camelcase: false */
/* jshint expr: true */
var expect = require('chai').expect;
var _ = require('lodash');
var Sequelize = require('sequelize');
var ApimapFieldBuilder = require('../../services/apimap-field-builder');

var databaseOptions = {
  logging: false,
  pool: { maxConnections: 10, minConnections: 1 }
};

var sequelize = new Sequelize(
  'postgres://forest:secret@localhost:5436/forest-express-sequelize-test',
  databaseOptions);

describe('Services > ApimapFieldBuilder', function () {
  describe('on a UUID column with a UUIDV4 defaultValue', function () {
    var field;

    before(function (done) {
      var model = sequelize.define('user', {
        uuid: {
          type: Sequelize.DataTypes.UUID,
          defaultValue: Sequelize.DataTypes.UUIDV4,
        }
      });

      sequelize.sync({ force: true })
        .then(function() {
          field = new ApimapFieldBuilder(
            model,
            _.values(model.attributes)[1],
            { sequelize: Sequelize }
          )
            .perform();
          done();
        });
    });

    it('should have a name uuid', function () {
      expect(field.field).equal('uuid');
    });

    it('should have a String type', function () {
      expect(field.type).equal('String');
    });

    it('should not be set as required', function () {
      expect(field.isRequired).to.be.false;
    });

    it('should not have a default value', function () {
      expect(field.defaultValue).to.be.undefined;
    });
  });
});
