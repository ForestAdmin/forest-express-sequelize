'use strict';
var P = require('bluebird');
var Interface = require('forest-express');

exports.collection = Interface.collection;
exports.ensureAuthenticated = Interface.ensureAuthenticated;
exports.StatSerializer = Interface.StatSerializer;
exports.ResourceSerializer = Interface.ResourceSerializer;
exports.ResourceDeserializer = Interface.ResourceDeserializer;
exports.Schemas = Interface.Schemas;

exports.init = function(opts) {
  exports.opts = opts;

  exports.getLianaName = function () {
    return 'forest-express-sequelize';
  };

  exports.getLianaVersion = function () {
    return require('./package.json').version;
  };

  exports.getOrmVersion = function () {
    return opts.sequelize.Sequelize.version;
  };

  exports.getDatabaseType = function () {
    return opts.sequelize.options.dialect;
  };

  exports.SchemaAdapter = require('./adapters/sequelize');

  exports.getModels = function () {
    return opts.sequelize ? opts.sequelize.models : [];
  };

  exports.getModelName = function (model) {
    return model.name;
  };

  exports.ResourcesGetter = require('./services/resources-getter');
  exports.ResourceGetter = require('./services/resource-getter');
  exports.ResourceCreator = require('./services/resource-creator');
  exports.ResourceUpdater = require('./services/resource-updater');
  exports.ResourceRemover = require('./services/resource-remover');

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

  return Interface.init(exports);
};
