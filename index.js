'use strict';
var P = require('bluebird');
var Interface = require('forest-express');

exports.collection = Interface.collection;
exports.ensureAuthenticated = Interface.ensureAuthenticated;
exports.StatSerializer = Interface.StatSerializer;
exports.ResourceSerializer = Interface.ResourceSerializer;

exports.init = function(opts) {
  exports.opts = opts;

  exports.getLianaName = function () {
    return 'forest-express-sequelize';
  };

  exports.getLianaVersion = function () {
    return require('./package.json').version;
  };

  exports.SchemaAdapter = require('./adapters/sequelize');

  exports.getModels = function () {
    return opts.sequelize.models;
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

  exports.ValueStatGetter = require('./services/value-stat-getter');
  exports.PieStatGetter = require('./services/pie-stat-getter');
  exports.LineStatGetter = require('./services/line-stat-getter');

  exports.Stripe = {
    getCustomer: function (customerModel, customerId) {
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
    getCustomerByUserField: function (customerModel, userField) {
        if (!customerModel) {
          return new P(function (resolve) { resolve(); });
        }

        var query = {};
        query[opts.integrations.stripe.userField] = userField;

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
      return new P(function (resolve, reject) {
        if (customerId) {
          return userModel
          .findById(customerId)
          .lean()
          .exec(function (err, customer) {
            if (err) { return reject(err); }
            if (!customer) { return reject(); }
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
