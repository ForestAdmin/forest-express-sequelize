const _ = require('lodash');
const P = require('bluebird');
const Interface = require('forest-express');
const orm = require('./utils/orm');
const lianaPackage = require('../package.json');

const SchemaAdapter = require('./adapters/sequelize');

const ResourcesGetter = require('./services/resources-getter');
const ResourceGetter = require('./services/resource-getter');
const ResourceCreator = require('./services/resource-creator');
const ResourceUpdater = require('./services/resource-updater');
const ResourceRemover = require('./services/resource-remover');
const RecordsExporter = require('./services/records-exporter');

const HasManyGetter = require('./services/has-many-getter');
const HasManyAssociator = require('./services/has-many-associator');
const HasManyDissociator = require('./services/has-many-dissociator');
const BelongsToUpdater = require('./services/belongs-to-updater');

const ValueStatGetter = require('./services/value-stat-getter');
const PieStatGetter = require('./services/pie-stat-getter');
const LineStatGetter = require('./services/line-stat-getter');
const LeaderboardStatGetter = require('./services/leaderboard-stat-getter');
const QueryStatGetter = require('./services/query-stat-getter');

const RecordsDecorator = require('./utils/records-decorator');

const REGEX_VERSION = /(\d+\.)?(\d+\.)?(\*|\d+)/;

exports.collection = Interface.collection;
exports.ensureAuthenticated = Interface.ensureAuthenticated;
exports.StatSerializer = Interface.StatSerializer;
exports.ResourceSerializer = Interface.ResourceSerializer;
exports.ResourceDeserializer = Interface.ResourceDeserializer;
exports.Schemas = Interface.Schemas;
exports.ResourcesRoute = Interface.ResourcesRoute;

exports.init = function init(opts) {
  exports.opts = opts;

  // NOTICE: Ensure compatibility with the old middleware configuration.
  if (opts.sequelize && !('connections' in opts)) {
    opts.connections = [opts.sequelize];
    opts.sequelize = opts.sequelize.Sequelize;
  }

  exports.getLianaName = function getLianaName() {
    return 'forest-express-sequelize';
  };

  exports.getLianaVersion = function getLianaVersion() {
    const lianaVersion = lianaPackage.version.match(REGEX_VERSION);
    if (lianaVersion && lianaVersion[0]) {
      return lianaVersion[0];
    }
    return null;
  };

  exports.getOrmVersion = function getOrmVersion() {
    if (!opts.sequelize) { return null; }

    return orm.getVersion(opts.sequelize);
  };

  exports.getDatabaseType = function getDatabaseType() {
    if (!opts.connections) { return null; }

    return opts.connections[0].options.dialect;
  };

  exports.SchemaAdapter = SchemaAdapter;

  exports.getModels = function getModels() {
    // NOTICE: The default Forest configuration detects all models.
    const detectAllModels = _.isEmpty(opts.includedModels) && _.isEmpty(opts.excludedModels);
    const models = {};

    _.each(opts.connections, (connection) => {
      _.each(connection.models, (model) => {
        if (detectAllModels) {
          models[model.name] = model;
        } else if (!_.isEmpty(opts.includedModels) &&
          _.includes(opts.includedModels, model.name)) {
          models[model.name] = model;
        } else if (!_.isEmpty(opts.excludedModels) &&
          !_.includes(opts.excludedModels, model.name)) {
          models[model.name] = model;
        }
      });
    });

    return models;
  };

  exports.getModelName = function getModelName(model) {
    return model.name;
  };

  // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority
  exports.getModelNameOld = exports.getModelName;

  exports.ResourcesGetter = ResourcesGetter;
  exports.ResourceGetter = ResourceGetter;
  exports.ResourceCreator = ResourceCreator;
  exports.ResourceUpdater = ResourceUpdater;
  exports.ResourceRemover = ResourceRemover;
  exports.RecordsExporter = RecordsExporter;

  exports.HasManyGetter = HasManyGetter;
  exports.HasManyAssociator = HasManyAssociator;
  exports.HasManyDissociator = HasManyDissociator;
  exports.BelongsToUpdater = BelongsToUpdater;

  exports.ValueStatGetter = ValueStatGetter;
  exports.PieStatGetter = PieStatGetter;
  exports.LineStatGetter = LineStatGetter;
  exports.LeaderboardStatGetter = LeaderboardStatGetter;
  exports.QueryStatGetter = QueryStatGetter;

  exports.RecordsDecorator = RecordsDecorator;

  exports.Stripe = {
    getCustomer: (customerModel, customerField, customerId) => {
      if (customerId) {
        return customerModel
          .findById(customerId)
          .then(function (customer) {
            if (customer && customer[customerField]) {
              return customer.toJSON();
            }
            return P.reject();
          });
      } else {
        return P.resolve();
      }
    },
    getCustomerByUserField: (customerModel, customerField, userField) => {
      if (!customerModel) {
        return new P(resolve => resolve());
      }

      const query = {};
      query[customerField] = userField;

      return customerModel
        .findOne({ where: query })
        .then((customer) => {
          if (!customer) { return null; }
          return customer.toJSON();
        });
    },
  };

  exports.Intercom = {
    getCustomer: (userModel, customerId) => {
      return userModel.findById(customerId);
    },
  };

  exports.Closeio = {
    getCustomer: (userModel, customerId) => {
      return userModel.findById(customerId);
    },
  };

  exports.Layer = {
    getUser: (customerModel, customerField, customerId) => {
      return new P((resolve, reject) => {
        if (customerId) {
          return customerModel
            .findById(customerId)
            .then((customer) => {
              if (!customer || !customer[customerField]) { return reject(); }

              return resolve(customer);
            });
        }
        return resolve();
      });
    },
  };

  exports.Mixpanel = {
    getUser: (userModel, userId) => {
      if (userId) {
        return userModel
          .findById(userId)
          .then(user => user.toJSON());
      }

      return P.resolve();
    },
  };

  return Interface.init(exports);
};
