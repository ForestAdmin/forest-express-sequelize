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
const ResourcesExporter = require('./services/resources-exporter');
const ResourcesRemover = require('./services/resources-remover');

const HasManyGetter = require('./services/has-many-getter');
const HasManyAssociator = require('./services/has-many-associator');
const HasManyDissociator = require('./services/has-many-dissociator');
const BelongsToUpdater = require('./services/belongs-to-updater');

const ValueStatGetter = require('./services/value-stat-getter');
const PieStatGetter = require('./services/pie-stat-getter');
const LineStatGetter = require('./services/line-stat-getter');
const LeaderboardStatGetter = require('./services/leaderboard-stat-getter');
const QueryStatGetter = require('./services/query-stat-getter');
const FiltersParser = require('./services/filters-parser');

const RecordsDecorator = require('./utils/records-decorator');
const makeParseFilter = require('./public/parse-filter');

const REGEX_VERSION = /(\d+\.)?(\d+\.)?(\*|\d+)/;

exports.collection = Interface.collection;
exports.ensureAuthenticated = Interface.ensureAuthenticated;
exports.errorHandler = () => Interface.errorHandler({ logger: Interface.logger });
exports.StatSerializer = Interface.StatSerializer;
exports.ResourceSerializer = Interface.ResourceSerializer;
exports.ResourceDeserializer = Interface.ResourceDeserializer;
exports.Schemas = Interface.Schemas;
exports.ResourcesRoute = Interface.ResourcesRoute;

exports.PermissionMiddlewareCreator = Interface.PermissionMiddlewareCreator;
exports.RecordsCounter = Interface.RecordsCounter;
exports.RecordsExporter = Interface.RecordsExporter;
exports.RecordsGetter = Interface.RecordsGetter;
exports.RecordGetter = Interface.RecordGetter;
exports.RecordUpdater = Interface.RecordUpdater;
exports.RecordCreator = Interface.RecordCreator;
exports.RecordRemover = Interface.RecordRemover;
exports.RecordsRemover = Interface.RecordsRemover;
exports.RecordSerializer = Interface.RecordSerializer;
exports.BaseOperatorDateParser = Interface.BaseOperatorDateParser;
exports.parseFilter = makeParseFilter(FiltersParser, exports);

exports.PUBLIC_ROUTES = Interface.PUBLIC_ROUTES;

exports.init = function init(opts) {
  exports.opts = opts;

  if (!opts.objectMapping) {
    Interface.logger.error('The objectMapping option appears to be missing. Please make sure it is set correctly.');
    return Promise.resolve(() => {});
  }

  if (opts.sequelize) {
    Interface.logger.warn('The sequelize option is not supported anymore. Please remove this option.');
  }

  opts.Sequelize = opts.objectMapping;
  opts.useMultipleDatabases = Object.keys(opts.connections).length > 1;

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
    return orm.getVersion(opts.Sequelize);
  };

  exports.getDatabaseType = function getDatabaseType() {
    if (opts.useMultipleDatabases) return 'multiple';

    return Object.values(opts.connections)[0].options.dialect;
  };

  exports.SchemaAdapter = SchemaAdapter;

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
  exports.ResourcesExporter = ResourcesExporter;
  exports.ResourcesRemover = ResourcesRemover;

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
        return orm.findRecord(customerModel, customerId)
          .then((customer) => {
            if (customer && customer[customerField]) {
              return customer.toJSON();
            }
            return P.reject();
          });
      }
      return P.resolve();
    },
    getCustomerByUserField: (customerModel, customerField, userField) => {
      if (!customerModel) {
        return new P((resolve) => resolve());
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
    getCustomer: (userModel, customerId) => orm.findRecord(userModel, customerId),
  };

  exports.Closeio = {
    getCustomer: (userModel, customerId) => orm.findRecord(userModel, customerId),
  };

  exports.Layer = {
    getUser: (customerModel, customerField, customerId) =>
      new P((resolve, reject) => {
        if (customerId) {
          return orm.findRecord(customerModel, customerId)
            .then((customer) => {
              if (!customer || !customer[customerField]) { return reject(); }

              return resolve(customer);
            });
        }
        return resolve();
      }),
  };

  exports.Mixpanel = {
    getUser: (userModel, userId) => {
      if (userId) {
        return orm.findRecord(userModel, userId)
          .then((user) => user.toJSON());
      }

      return P.resolve();
    },
  };

  return Interface.init(exports);
};
