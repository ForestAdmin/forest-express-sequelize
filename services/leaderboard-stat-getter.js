'use strict';
var BaseStatGetter = require('./base-stat-getter');

function LeaderboardStatGetter(model, params, opts) {
  BaseStatGetter.call(this, model, params, opts);

  var collectionField = params.collection_field;
  var relationship = params.relationship;
  var aggregate = params.aggregate.toUpperCase();
  var limit = params.limit;

  var key = model.name.toLowerCase() + '.' + collectionField;
  var groupBy = '"' + key + '"';
  var aggregateKey = opts.sequelize.Utils.singularize(relationship);
  var aggregateAlias = aggregateKey + '.id';

  this.perform = function () {
    return model.associations[relationship].target
      .unscoped()
      .findAll({
        attributes: [[opts.sequelize.fn(aggregate, aggregateAlias), 'value']],
        include: [{
          model: model,
          attributes: [collectionField],
        }],
        group: [opts.sequelize.literal(groupBy)],
        order: [[opts.sequelize.literal('value'), 'DESC']],
        limit,
        raw: true
      })
      .then(function(records) {
        return records.map(function (data) {
          data.key = data[key];
          delete data[key];
          return data;
        });
      })
      .then(function (records) {
        return { value: records };
      });
  };
}

module.exports = LeaderboardStatGetter;
