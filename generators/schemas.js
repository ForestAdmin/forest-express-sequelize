'use strict';
var P = require('bluebird');
var SchemaAdapter = require('../adapters/sequelize');

module.exports = {
  schemas: {},
  perform: function (models, opts) {
    var that = this;

    return P.each(Object.keys(models), function (modelName) {
      var model = models[modelName];

      return new SchemaAdapter(model, opts)
        .then(function (schema) {
          that.schemas[model.tableName] = schema;
        });
    });
  }
};
