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

var sequelizePostgres = new Sequelize(
  'postgres://forest:secret@localhost:5436/forest-express-sequelize-test',
  databaseOptions);

var sequelizeMySQL = new Sequelize(
  'mysql://forest:secret@localhost:8999/forest-express-sequelize-test',
  databaseOptions);

var PieStatGetter = require('../services/pie-stat-getter');
var LineStatGetter = require('../services/line-stat-getter');
var ResourcesGetter = require('../services/resources-getter');

[sequelizePostgres, sequelizeMySQL].forEach(function (sequelize) {
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

  describe('Dialect ' + sequelize.options.dialect, function () {
    describe('Stats > Pie Stat Getter', function () {
      before(function (done) {
        // var fixturesFileName = 'test/fixtures/routes/charts.json';
        return sequelize.sync({ force: true })
          .then(function() { return done(); });
          // .then(() => sequelizeFixtures.loadFile(fixturesFileName, models, { log: () => {} }));
      });

      describe('A simple Pie Chart on an empty users table', function () {
        it('should generate a valid SQL query', function (done) {
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

      describe('A simple Line Chart per day on an empty users table', function () {
        it('should generate a valid SQL query', function (done) {
          return new LineStatGetter(models.user, {
              type: 'Line',
              collection: 'user',
              timezone: '+02:00',
              group_by_date_field: 'createdAt',
              aggregate: 'Count',
              time_range: 'Day',
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

    describe('Stats > Line Stat Getter', function () {
      describe('A simple Line Chart per week on an empty users table', function () {
        it('should generate a valid SQL query', function (done) {
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

      describe('A simple Line Chart per month on an empty users table', function () {
        it('should generate a valid SQL query', function (done) {
          return new LineStatGetter(models.user, {
              type: 'Line',
              collection: 'user',
              timezone: '+02:00',
              group_by_date_field: 'createdAt',
              aggregate: 'Count',
              time_range: 'Month',
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

      describe('A simple Line Chart per year on an empty users table', function () {
        it('should generate a valid SQL query', function (done) {
          return new LineStatGetter(models.user, {
              type: 'Line',
              collection: 'user',
              timezone: '+02:00',
              group_by_date_field: 'createdAt',
              aggregate: 'Count',
              time_range: 'Year',
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

    describe('Resources > Resources Getter', function () {
      describe('Request on the ressources getter without page size', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
            },
            page: { number: '1' },
            timezone: '+02:00'
          };
          return new ResourcesGetter(models.user, { sequelize: sequelize }, params)
            .perform()
            .then(function () {
              done();
            });
        });
      });

      describe('Request on the ressources getter with a page size', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
            },
            page: { number: '1', size: '30' },
            timezone: '+02:00'
          };
          return new ResourcesGetter(models.user, { sequelize: sequelize }, params)
            .perform()
            .then(function () {
              done();
            });
        });
      });

      describe('Request on the ressources getter with a sort on the primary key', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
            },
            sort: '-id',
            page: { number: '1', size: '30' },
            timezone: '+02:00'
          };
          return new ResourcesGetter(models.user, { sequelize: sequelize }, params)
            .perform()
            .then(function () {
              done();
            });
        });
      });

      describe('Request on the ressources getter with a search', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
            },
            page: { number: '1', size: '30' },
            search: 'hello',
            timezone: '+02:00'
          };
          return new ResourcesGetter(models.user, { sequelize: sequelize }, params)
            .perform()
            .then(function () {
              done();
            });
        });
      });

      describe('Request on the ressources getter with a "not contains" filter condition', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
            },
            page: { number: '1', size: '30' },
            filterType: 'and',
            filter: { username: '!*hello*' },
            timezone: '+02:00'
          };
          return new ResourcesGetter(models.user, { sequelize: sequelize }, params)
            .perform()
            .then(function () {
              done();
            });
        });
      });

      describe('Request on the ressources getter with a filter condition and search', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
            },
            page: { number: '2', size: '50' },
            filterType: 'and',
            filter: { username: '*hello*' },
            search: 'world',
            timezone: '+02:00'
          };
          return new ResourcesGetter(models.user, { sequelize: sequelize }, params)
            .perform()
            .then(function () {
              done();
            });
        });
      });

      describe('Request on the ressources getter with a filter condition, search and sort combined', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
            },
            page: { number: '2', size: '50' },
            filterType: 'and',
            filter: { username: '*hello*' },
            sort: '-id',
            search: 'world',
            timezone: '+02:00'
          };
          return new ResourcesGetter(models.user, { sequelize: sequelize }, params)
            .perform()
            .then(function () {
              done();
            });
        });
      });
    });
  });
});
