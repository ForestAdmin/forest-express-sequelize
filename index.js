'use strict';
var _ = require('lodash');
var P = require('bluebird');
var path = require('path');
var fs = P.promisifyAll(require('fs'));
var express = require('express');
var cors = require('express-cors');
var bodyParser = require('body-parser');
var jwt = require('express-jwt');
var ResourcesRoutes = require('./routes/resources');
var AssociationsRoutes = require('./routes/associations');
var StatRoutes = require('./routes/stats');
var SessionRoute = require('./routes/sessions');
var Schemas = require('./generators/schemas');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var request = require('superagent');
var logger = require('./services/logger');
var Inflector = require('inflected');

function requireAllModels(modelsDir) {
  return fs.readdirAsync(modelsDir)
    .each(function (file) {
      try {
        require(path.join(modelsDir, file));
      } catch (e) {
      }
    })
    .catch(function () {
    });
}

exports.init = function (opts) {
  var app = express();

  if (opts.jwtSigningKey) {
    console.warn('DEPRECATION WARNING: the use of jwtSigningKey option is ' +
    'deprecated. Use secret_key and auth_key instead. More info at: ' +
    'https://github.com/ForestAdmin/forest-express-sequelize/releases/tag/0.1.0');
    opts.authKey = opts.jwtSigningKey;
    opts.secretKey = opts.jwtSigningKey;
  }

  // CORS
  app.use(cors({
    allowedOrigins: ['localhost:4200', '*.forestadmin.com'],
      headers: ['Authorization', 'X-Requested-With', 'Content-Type',
        'Stripe-Reference']
  }));

  // Mime type
  app.use(bodyParser.json());

  // Authentication
  app.use(jwt({
    secret: opts.authKey,
    credentialsRequired: false
  }));

  new SessionRoute(app, opts).perform();

  // Init
  new P(function (resolve) { resolve(opts.sequelize.models); })
    .then(function (models) {
      return Schemas.perform(models, opts)
        .then(function () {
          var absModelDirs = path.resolve('.', opts.modelsDir);
          return requireAllModels(absModelDirs + '/forest');
        })
        .then(function () {
          return _.values(models);
        });
    })
    .each(function (model) {
      new ResourcesRoutes(app, model, opts).perform();
      new AssociationsRoutes(app, model, opts).perform();
      new StatRoutes(app, model, opts).perform();
    })
    .then(function () {
      if (opts.secretKey) {
        var collections = _.values(Schemas.schemas);

        var json = new JSONAPISerializer('collections', collections, {
          id: 'name',
          attributes: ['name', 'fields', 'actions'],
          fields: {
            attributes: ['field', 'type', 'reference', 'inverseOf',
              'collection_name']
          },
          actions: {
            ref: 'name',
            attributes: ['name', 'endpoint', 'httpMethod']
          },
          meta: {
            'liana': 'forest-express-sequelize',
            'liana_version': require('./package.json').version
          },
          keyForAttribute: function (key) {
            return Inflector.camelize(key, false);
          }
        });

        var forestUrl = process.env.FOREST_URL ||
          'https://forestadmin-server.herokuapp.com';

        request
          .post(forestUrl + '/forest/apimaps')
            .send(json)
            .set('forest-secret-key', opts.secretKey)
            .end(function(err, res) {
              if (res.status !== 204) {
                logger.debug('Forest cannot find your project secret key. ' +
                  'Please, ensure you have installed the Forest Liana ' +
                  'correctly.');
              }
            });
      }
    });

  return app;
};

exports.collection = function (name, opts) {
  var collection = _.find(Schemas.schemas, { name: name });

  if (!collection) {
    opts.name = name;
    Schemas.schemas[name] = opts;
  } else {
    Schemas.schemas[name].actions = opts.actions;
  }
};

exports.ensureAuthenticated = require('./services/auth').ensureAuthenticated;
exports.StatSerializer = require('./serializers/stat') ;
exports.ResourceSerializer = require('./serializers/resource') ;
