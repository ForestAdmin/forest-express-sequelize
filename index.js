'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Interface = require('forest-express');
var REGEX_VERSION = /(\d+\.)?(\d+\.)?(\*|\d+)/;

exports.collection = Interface.collection;
exports.ensureAuthenticated = Interface.ensureAuthenticated;
exports.StatSerializer = Interface.StatSerializer;
exports.ResourceSerializer = Interface.ResourceSerializer;
exports.ResourceDeserializer = Interface.ResourceDeserializer;
exports.Schemas = Interface.Schemas;
exports.ResourcesRoute = Interface.ResourcesRoute;

exports.init = function(opts) {
  exports.opts = opts;

  // NOTICE: Ensure compatibility with the old middleware configuration.
  if (opts.sequelize && !('connections' in opts)) {
    opts.connections = [opts.sequelize];
    opts.sequelize = opts.sequelize.Sequelize;
  }

  exports.getLianaName = function () {
    return 'forest-express-sequelize';
  };

  exports.getLianaVersion = function () {
    var lianaVersion = require('./package.json').version.match(REGEX_VERSION);
    if (lianaVersion && lianaVersion[0]) {
      return lianaVersion[0];
    }
  };

  exports.getOrmVersion = function () {
    if (!opts.sequelize) { return null; }

    var ormVersion = opts.sequelize.version.match(REGEX_VERSION);
    if (ormVersion && ormVersion[0]) {
      return ormVersion[0];
    }
  };

  exports.getDatabaseType = function () {
    if (!opts.connections) { return null; }

    return opts.sequelize.options.dialect;
  };

  exports.SchemaAdapter = require('./adapters/sequelize');

  exports.getModels = function () {
    var models = {};

    _.each(opts.connections, function (connection) {
      _.each(connection.models, function (model) {
        models[model.name] = model;
      });
    });

    return models;
  };

  exports.getModelName = function (model) {
    return model.name;
  };

  exports.ResourcesGetter = require('./services/resources-getter');
  exports.ResourceGetter = require('./services/resource-getter');
  exports.ResourceCreator = require('./services/resource-creator');
  exports.ResourceUpdater = require('./services/resource-updater');
  exports.ResourceRemover = require('./services/resource-remover');
  exports.RecordsExporter = require('./services/records-exporter');

  exports.HasManyGetter = require('./services/has-many-getter');
  exports.HasManyAssociator = require('./services/has-many-associator');
  exports.HasManyDissociator = require('./services/has-many-dissociator');
  exports.BelongsToUpdater = require('./services/belongs-to-updater');

  exports.ValueStatGetter = require('./services/value-stat-getter');
  exports.PieStatGetter = require('./services/pie-stat-getter');
  exports.LineStatGetter = require('./services/line-stat-getter');

  exports.Stripe = {
    getCustomer: function (customerModel, customerField, customerId) {
      if (customerId) {
        return customerModel
          .findById(customerId)
          .then(function (customer) {
            return customer.toJSON();
          });
      } else {
        return new P(function (resolve) { resolve(); });
      }
    },
    getCustomerByUserField: function (customerModel, customerField, userField) {
      if (!customerModel) {
        return new P(function (resolve) { resolve(); });
      }

      var query = {};
      query[customerField] = userField;

      return customerModel
        .findOne({ where: query })
        .then(function (customer) {
          if (!customer) { return null; }
          return customer.toJSON();
        });
    }
  };

  exports.Intercom = {
    getCustomer: function (userModel, customerId) {
      return userModel.findById(customerId);
    }
  };

  exports.Closeio = {
    getCustomer: function (userModel, customerId) {
      return userModel.findById(customerId);
    }
  };

  exports.Layer = {
    getUser: function (customerModel, customerField, customerId) {
      return new P(function (resolve, reject) {
        if (customerId) {
          return customerModel
            .findById(customerId)
            .then(function (customer) {
              if (!customer || !customer[customerField]) { return reject(); }

              resolve(customer);
            });
        } else {
          resolve();
        }
      });
    }
  };

  return Interface.init(exports);
};
