'use strict';
var _ = require('lodash');
var Interface = require('forest-express');
var BaseStatGetter = require('./base-stat-getter');

function LeaderboardStatGetter(model, modelRelationship, params, options) {
  BaseStatGetter.call(this, model, params, options);

  var labelField = params.label_field;
  var aggregate = params.aggregate.toUpperCase();
  var aggregateField = params.aggregate_field;
  var limit = params.limit;
  var schema = Interface.Schemas.schemas[model.name];
  var schemaRelationship = Interface.Schemas.schemas[modelRelationship.name];
  var associationAs = schema.name;

  _.each(modelRelationship.associations, function (association) {
    if (association.target.name === model.name && association.as) {
      associationAs = association.as;
    }
  });

  var groupBy = associationAs + '.' + labelField;

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
    var fieldName = aggregateField || schemaRelationship.primaryKeys[0] ||
      schemaRelationship.fields[0].field;
    return schemaRelationship.name + '.' + fieldName;
  }

  this.perform = function () {
    return modelRelationship
      .unscoped()
      .findAll({
        attributes: [
          [options.sequelize.fn(aggregate, options.sequelize.col(getAggregateField())), 'value']
        ],
        include: [{
          model: model,
          attributes: [labelField],
          as: associationAs,
          required: true,
        }],
        group: groupBy,
        order: [[options.sequelize.literal('value'), 'DESC']],
        limit: limit,
        raw: true
      })
      .then(function (records) {
        records = records.map(function (data) {
          data.key = data[groupBy];
          delete data[groupBy];
          return data;
        });

        return { value: records };
      });
  };
}

module.exports = LeaderboardStatGetter;
