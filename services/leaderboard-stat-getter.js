'use strict';
var Interface = require('forest-express');
var BaseStatGetter = require('./base-stat-getter');

function LeaderboardStatGetter(model, relationshipModel, params, opts) {
  BaseStatGetter.call(this, model, params, opts);

  var collectionField = params['collection_field'];
  var aggregate = params.aggregate.toUpperCase();
  var aggregateField = params['aggregate_field'];
  var limit = params.limit;

  var schema = Interface.Schemas.schemas[relationshipModel.name];

  var groupBy = model.name.toLowerCase() + '.' + collectionField;

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName
    //         cannot be '*'.
    var fieldName = aggregateField || schema.primaryKeys[0] ||
      schema.fields[0].field;
    return schema.name + '.' + fieldName;
  }

  this.perform = function () {
    return relationshipModel
      .unscoped()
      .findAll({
        attributes: [[opts.sequelize.fn(aggregate, opts.sequelize.col(getAggregateField())), 'value']],
        include: [{
          model: model,
          attributes: [collectionField],
        }],
        group: groupBy,
        order: [[opts.sequelize.literal('value'), 'DESC']],
        limit,
        raw: true
      })
      .then(function(records) {
        return records.map(function (data) {
          data.key = data[groupBy];
          delete data[groupBy];
          return data;
        });
      })
      .then(function (records) {
        return { value: records };
      });
  };
}

module.exports = LeaderboardStatGetter;
