'use strict';
/* global describe, before, it */
/* jshint camelcase: false */
/* jshint expr: true */
var expect = require('chai').expect;
var _ = require('lodash');
var Sequelize = require('sequelize');
var sequelizeFixtures = require('sequelize-fixtures');
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
var ResourceGetter = require('../services/resource-getter');
var ResourceCreator = require('../services/resource-creator');
var ResourceRemover = require('../services/resource-remover');
var HasManyGetter = require('../services/has-many-getter');

[sequelizePostgres, sequelizeMySQL].forEach(function (sequelize) {
  var models = {};
  var sequelizeOptions = {
    sequelize: Sequelize,
    connections: [sequelize]
  };

  models.user = sequelize.define('user', {
    email: {
      type: Sequelize.STRING,
      unique: true,
      validate: { isEmail: true }
    },
    emailValid: { type: Sequelize.BOOLEAN },
    firstName: { type: Sequelize.STRING },
    lastName: { type: Sequelize.STRING },
    username: { type: Sequelize.STRING },
    password: { type: Sequelize.STRING },
    createdAt: { type: Sequelize.DATE },
    updatedAt: { type: Sequelize.DATE },
    resetPasswordToken: { type: Sequelize.STRING }
  });

  models.address = sequelize.define('address', {
    line: { type: Sequelize.STRING },
    zipCode: { type: Sequelize.STRING },
    city: { type: Sequelize.STRING },
    country: { type: Sequelize.STRING },
    userId: { type: Sequelize.INTEGER }
  });

  models.log = sequelize.define('log', {
    code: { type: Sequelize.STRING, primaryKey: true },
    trace: { type: Sequelize.STRING, primaryKey: true },
    stack: { type: Sequelize.STRING }
  });

  models.address.belongsTo(models.user);
  models.user.hasMany(models.address);

  Interface.Schemas = {
    schemas: {
      user: {
        name: 'user',
        idField: 'id',
        primaryKeys: ['id'],
        isCompositePrimary: false,
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'email', type: 'String' },
          { field: 'emailValid', type: 'Boolean' },
          { field: 'firstName', type: 'String' },
          { field: 'lastName', type: 'String' },
          { field: 'username', type: 'String' },
          { field: 'password', type: 'String' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' },
          { field: 'resetPasswordToken', type: 'String' },
          { field: 'addresses', type: ['Number'] }
        ]
      },
      address: {
        name: 'address',
        idField: 'id',
        primaryKeys: ['id'],
        isCompositePrimary: false,
        fields: [
          { field: 'id', type: 'Number' },
          { field: 'line', type: 'String' },
          { field: 'zipCode', type: 'String' },
          { field: 'city', type: 'String' },
          { field: 'country', type: 'String' },
          { field: 'user', type: 'Number', references: 'user.id' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' }
        ]
      },
      log: {
        name: 'log',
        idField: 'forestCompositePrimary',
        primaryKeys: ['code', 'trace'],
        isCompositePrimary: true,
        fields: [
          { field: 'code', type: 'String' },
          { field: 'trace', type: 'String' },
          { field: 'stack', type: 'String' },
          { field: 'createdAt', type: 'Date' },
          { field: 'updatedAt', type: 'Date' }
        ]
      }
    }
  };

  describe('Dialect ' + sequelize.options.dialect, function () {
    describe('Stats > Pie Stat Getter', function () {
      before(function (done) {
        return sequelize.sync({ force: true })
          .then(function () {
            return sequelizeFixtures.loadFile('test/fixtures/db.json', models,
              { log: function () {} });
          })
          .then(function() { return done(); });
      });

      describe('A simple Pie Chart on an empty users table', function () {
        it('should generate a valid SQL query', function (done) {
          return new PieStatGetter(models.user, {
              type: 'Pie',
              collection: 'user',
              timezone: '+02:00',
              group_by_field: 'firstName',
              aggregate: 'Count',
              time_range: null,
              filters: []
            }, sequelizeOptions)
            .perform()
            .then(function (stat) {
              expect(stat.value.length).equal(3);
              done();
            });
        });
      });

      describe('A simple Line Chart per day on an empty users table', function () {
        it('should generate a valid SQL query', function (done) {
          return new LineStatGetter(models.user, {
              type: 'Line',
              collection: 'user',
              timezone: '+02:00',
              group_by_date_field: 'createdAt',
              aggregate: 'Count',
              time_range: 'Day',
              filters: []
            }, sequelizeOptions)
            .perform()
            .then(function (stat) {
              expect(stat.value.length).equal(1);
              done();
            });
        });
      });
    });

    describe('Stats > Line Stat Getter', function () {
      describe('A simple Line Chart per week on an empty users table', function () {
        it('should generate a valid SQL query', function (done) {
          return new LineStatGetter(models.user, {
              type: 'Line',
              collection: 'user',
              timezone: '+02:00',
              group_by_date_field: 'createdAt',
              aggregate: 'Count',
              time_range: 'Week',
              filters: []
            }, sequelizeOptions)
            .perform()
            .then(function (stat) {
              expect(stat.value.length).equal(1);
              done();
            });
        });
      });

      describe('A simple Line Chart per month on an empty users table', function () {
        it('should generate a valid SQL query', function (done) {
          return new LineStatGetter(models.user, {
              type: 'Line',
              collection: 'user',
              timezone: '+02:00',
              group_by_date_field: 'createdAt',
              aggregate: 'Count',
              time_range: 'Month',
              filters: []
            }, sequelizeOptions)
            .perform()
            .then(function (stat) {
              expect(stat.value.length).equal(1);
              done();
            });
        });
      });

      describe('A simple Line Chart per year on an empty users table', function () {
        it('should generate a valid SQL query', function (done) {
          return new LineStatGetter(models.user, {
              type: 'Line',
              collection: 'user',
              timezone: '+02:00',
              group_by_date_field: 'createdAt',
              aggregate: 'Count',
              time_range: 'Year',
              filters: []
            }, sequelizeOptions)
            .perform()
            .then(function (stat) {
              expect(stat.value.length).equal(1);
              done();
            });
        });
      });
    });

    describe('Resources > Resources Creator', function () {
      describe('Create a record on a simple collection', function () {
        it('should create a record', function (done) {
          return new ResourceCreator(models.user, {
            id: '1',
            email: 'jack@forestadmin.com',
            firstName: 'Jack',
            lastName: 'Lumberjack',
            username: 'Jacouille',
            password: 'bonpoissonnet'
          })
          .perform()
          .then(function (result) {
            expect(result.id).equal(1);
            expect(result.firstName).equal('Jack');
            expect(result.username).equal('Jacouille');

            return models.user
              .find({ where : { email: 'jack@forestadmin.com' } })
              .then(function (user) {
                expect(user).not.to.be.null;
                done();
              });
          });
        });
      });

      describe('Create a record on a collection with a composite primary key', function () {
        it('should create a record', function (done) {
          return new ResourceCreator(models.log, {
            code: 'G@G#F@G@',
            trace: 'Ggg23g242@'
          })
          .perform()
          .then(function (result) {
            expect(result.code).equal('G@G#F@G@');
            expect(result.trace).equal('Ggg23g242@');
            return models.log
              .find({ where : { code: 'G@G#F@G@' } })
              .then(function (log) {
                expect(log).not.to.be.null;
                done();
              });
          });
        });
      });
    });

    describe('Resources > Resources Getter', function () {
      describe('Request on the resources getter without page size', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
            },
            page: { number: '1' },
            timezone: '+02:00'
          };
          return new ResourcesGetter(models.user, sequelizeOptions,
            params)
            .perform()
            .then(function () {
              done();
            });
        });
      });

      describe('Request on the resources getter with a page size', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
            },
            page: { number: '1', size: '30' },
            timezone: '+02:00'
          };
          return new ResourcesGetter(models.user, sequelizeOptions,
            params)
            .perform()
            .then(function (result) {
              expect(result[0]).equal(4);
              done();
            });
        });
      });

      describe('Request on the resources getter with a sort on the primary key', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
            },
            sort: '-id',
            page: { number: '1', size: '30' },
            timezone: '+02:00'
          };
          return new ResourcesGetter(models.user, sequelizeOptions,
            params)
            .perform()
            .then(function (result) {
              expect(result[0]).equal(4);
              done();
            });
        });
      });

      describe('Request on the resources getter with a search', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            fields: {
              user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
            },
            page: { number: '1', size: '30' },
            search: 'hello',
            timezone: '+02:00'
          };
          return new ResourcesGetter(models.user, sequelizeOptions,
            params)
            .perform()
            .then(function (result) {
              expect(result[0]).equal(0);
              done();
            });
        });
      });

      describe('Request on the resources getter with filters conditions', function () {
        var paramsBase = {
          fields: {
            user: 'id,firstName,lastName,username,password,createdAt,updatedAt,resetPasswordToken'
          },
          page: { number: '1', size: '30' },
          filterType: 'and',
          timezone: '+02:00'
        };

        describe('with a "is null" condition on a boolean field', function () {
          it('should generate a valid SQL query', function (done) {
            var params = _.clone(paramsBase);
            params.filter = { emailValid: 'null' };
            return new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform()
              .then(function (result) {
                expect(result[0]).equal(4);
                done();
              });
          });
        });

        describe('with a "is true" condition on a boolean field', function () {
          it('should generate a valid SQL query', function (done) {
            var params = _.clone(paramsBase);
            params.filter = { emailValid: 'true' };
            return new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform()
              .then(function (result) {
                expect(result[0]).equal(0);
                done();
              });
          });
        });

        describe('with a "is false" condition on a boolean field', function () {
          it('should generate a valid SQL query', function (done) {
            var params = _.clone(paramsBase);
            params.filter = { emailValid: 'false' };
            return new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform()
              .then(function (result) {
                expect(result[0]).equal(0);
                done();
              });
          });
        });

        describe('with a "is not null" condition on a boolean field', function () {
          it('should generate a valid SQL query', function (done) {
            var params = _.clone(paramsBase);
            params.filter = { emailValid: '!null' };
            return new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform()
              .then(function (result) {
                expect(result[0]).equal(0);
                done();
              });
          });
        });

        describe('with a "is not true" condition on a boolean field', function () {
          it('should generate a valid SQL query', function (done) {
            var params = _.clone(paramsBase);
            params.filter = { emailValid: '!true' };
            return new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform()
              .then(function (result) {
                expect(result[0]).equal(0);
                done();
              });
          });
        });

        describe('with a "is not false" condition on a boolean field', function () {
          it('should generate a valid SQL query', function (done) {
            var params = _.clone(paramsBase);
            params.filter = { emailValid: '!false' };
            return new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform()
              .then(function (result) {
                expect(result[0]).equal(0);
                done();
              });
          });
        });

        describe('with a "not contains" condition on a string field', function () {
          it('should generate a valid SQL query', function (done) {
            var params = _.clone(paramsBase);
            params.filter = { username: '!*hello*' };
            return new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform()
              .then(function (result) {
                expect(result[0]).equal(4);
                done();
              });
          });
        });

        describe('with a "before x hours" condition on a date field', function () {
          it('should generate a valid SQL query', function (done) {
            var params = _.clone(paramsBase);
            params.filter = { createdAt: '$2HoursBefore' };
            return new ResourcesGetter(models.user, sequelizeOptions, params)
              .perform()
              .then(function (result) {
                expect(result[0]).equal(0);
                done();
              });
          });
        });
      });

      describe('Request on the resources getter with a filter condition and search', function () {
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
          return new ResourcesGetter(models.user, sequelizeOptions,
            params)
            .perform()
            .then(function (result) {
              expect(result[0]).equal(0);
              done();
            });
        });
      });

      describe('Request on the resources getter with a filter condition, search and sort combined', function () {
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
          return new ResourcesGetter(models.user, sequelizeOptions,
            params)
            .perform()
            .then(function (result) {
              expect(result[0]).equal(0);
              done();
            });
        });
      });
    });

    describe('HasMany > HasMany Getter', function () {
      describe('Request on the hasMany getter without sort', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            recordId: 100,
            associationName: 'addresses',
            fields: {
              address: 'line,zipCode,city,country,user'
            },
            page: { number: '1', size: '20' },
            timezone: '+02:00'
          };
          return new HasManyGetter(models.user, models.address, sequelizeOptions,
            params)
            .perform()
            .then(function (result) {
              expect(result[0]).equal(3);
              done();
            });
        });
      });

      describe('Request on the hasMany getter with a sort on an attribute', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            recordId: 100,
            associationName: 'addresses',
            fields: {
              address: 'line,zipCode,city,country,user'
            },
            page: { number: '1', size: '20' },
            sort: 'city',
            timezone: '+02:00'
          };
          return new HasManyGetter(models.user, models.address, sequelizeOptions,
            params)
            .perform()
            .then(function (result) {
              expect(result[0]).equal(3);
              done();
            });
        });
      });

      describe('Request on the hasMany getter with a sort on a belongsTo', function () {
        it('should generate a valid SQL query', function (done) {
          var params = {
            recordId: 100,
            associationName: 'addresses',
            fields: {
              address: 'line,zipCode,city,country,user'
            },
            page: { number: '1', size: '20' },
            sort: '-user.id',
            timezone: '+02:00'
          };
          return new HasManyGetter(models.user, models.address, sequelizeOptions,
            params)
            .perform()
            .then(function (result) {
              expect(result[0]).equal(3);
              done();
            });
        });
      });
    });

    describe('Request on the hasMany getter with a search parameter', function () {
      it('should generate a valid SQL query', function (done) {
        var params = {
          recordId: 100,
          associationName: 'addresses',
          fields: {
            address: 'line,zipCode,city,country,user'
          },
          page: { number: '1', size: '20' },
          search: 'SF',
          sort: '-user.id',
          timezone: '+02:00'
        };
        return new HasManyGetter(models.user, models.address,
          sequelizeOptions, params)
          .perform()
          .then(function (result) {
            expect(result[0]).equal(1);
            expect(result[1].length).equal(1);
            done();
          });
      });
    });

    describe('Resources > Resource Getter', function () {
      describe('Get a record in a simple collection', function () {
        it('should retrieve the record', function (done) {
          var params = {
            recordId: 100
          };
          return new ResourceGetter(models.user, params)
          .perform()
          .then(function (user) {
            expect(user).not.to.be.null;
            expect(user.id).equal(100);
            expect(user.firstName).equal('Richard');
            done();
          });
        });
      });

      describe('Get a record in a collection with a composite primary key', function () {
        it('should retrieve the record', function (done) {
          var params = {
            recordId: 'G@G#F@G@-Ggg23g242@'
          };
          return new ResourceGetter(models.log, params)
          .perform()
          .then(function (log) {
            expect(log).not.to.be.null;
            expect(log.forestCompositePrimary).equal('G@G#F@G@-Ggg23g242@');
            done();
          });
        });
      });
    });

    describe('Resources > Resources Remover', function () {
      describe('Remove a record in a simple collection', function () {
        it('should destroy the record', function (done) {
          var params = {
            recordId: 1
          };
          return new ResourceRemover(models.user, params)
          .perform()
          .then(function () {
            return models.user
              .find({ where : { email: 'jack@forestadmin.com' } })
              .then(function (user) {
                expect(user).to.be.null;
                done();
              });
          });
        });
      });

      describe('Remove a record in a collection with a composite primary key', function () {
        it('should destroy the record', function (done) {
          var params = {
            recordId: 'G@G#F@G@-Ggg23g242@'
          };
          return new ResourceRemover(models.log, params)
          .perform()
          .then(function () {
            return models.log
              .find({ where : { code: 'G@G#F@G@' } })
              .then(function (log) {
                expect(log).to.be.null;
                done();
              });
          });
        });
      });
    });
  });
});
