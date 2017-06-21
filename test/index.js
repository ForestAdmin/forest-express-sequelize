'use strict';
/* global describe, before, it */
/* jshint camelcase: false */
var expect = require('chai').expect;
var Sequelize = require('sequelize');
var Interface = require('forest-express');

var databaseOptions = {
  logging: false,
  pool: { maxConnections: 10, minConnections: 1 }
};

var sequelize = new Sequelize('postgres://forest:secret@localhost:5436/forest-express-sequelize-test',
  databaseOptions);

var models = {};

models.user = sequelize.define('user', {
  email: {
    type: Sequelize.STRING,
    unique: true,
    validate: { isEmail: true }
  },
  firstName: { type: Sequelize.STRING },
  lastName: { type: Sequelize.STRING },
  username: { type: Sequelize.STRING },
  password: { type: Sequelize.STRING },
  createdAt: { type: Sequelize.DATE },
  updatedAt: { type: Sequelize.DATE },
  resetPasswordToken: { type: Sequelize.STRING }
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
        { field: 'firstName', type: 'String' },
        { field: 'lastName', type: 'String' },
        { field: 'username', type: 'String' },
        { field: 'password', type: 'String' },
        { field: 'createdAt', type: 'Date' },
        { field: 'updatedAt', type: 'Date' },
        { field: 'resetPasswordToken', type: 'String' }
      ]
    }
  }
};

var PieStatGetter = require('../services/pie-stat-getter');
var LineStatGetter = require('../services/line-stat-getter');

describe('Stats > Pie Stat Getter', function () {
  before(function (done) {
    // var fixturesFileName = 'test/fixtures/routes/charts.json';
    return sequelize.sync({ force: true })
      .then(function() { return done(); });
      // .then(() => sequelizeFixtures.loadFile(fixturesFileName, models, { log: () => {} }));
  });

  describe('A simple Pie Chart on an empty users table', function () {
    it('should repond with an empty value', function (done) {
      return new PieStatGetter(models.user, {
          type: 'Pie',
          collection: 'user',
          timezone: '+02:00',
          group_by_field: 'firstName',
          aggregate: 'Count',
          time_range: null,
          filters: []
        }, {
          sequelize: sequelize
        })
        .perform()
        .then(function (stat) {
          expect(stat.value.length).equal(0);
          done();
        });
    });
  });

  describe('A simple Line Chart on an empty users table', function () {
    it('should repond with an empty value', function (done) {
      return new LineStatGetter(models.user, {
          type: 'Line',
          collection: 'user',
          timezone: '+02:00',
          group_by_date_field: 'createdAt',
          aggregate: 'Count',
          time_range: 'Week',
          filters: []
        }, {
          sequelize: sequelize
        })
        .perform()
        .then(function (stat) {
          expect(stat.value.length).equal(0);
          done();
        });
    });
  });
});
