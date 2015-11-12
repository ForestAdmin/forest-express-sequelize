'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer');
var Inflector = require('inflected');
var Schemas = require('../generators/schemas');

function ResourceSerializer(model, records, opts, meta) {
  var schema = Schemas.schemas[model.name];
  var typeForAttributes = {};

  function addRelationship(dest, field) {
    if (field.reference) {
      var referenceType = typeForAttributes[field.field] =
        field.reference.substring(0, field.reference.length -
        '.id'.length);

      var referenceSchema = Schemas.schemas[referenceType];
      dest[field.field] = {
        ref: 'id',
        attributes: _.map(referenceSchema.fields, 'field'),
        relationshipLinks: {
          related: function (dataSet, relationship) {
            var ret = {
              href: '/forest/' + model.name + '/' +
                dataSet.id + '/' + field.field,
            };

            if (_.isArray(field.type)) {
              ret.meta = { count: relationship.length || 0 };
            }

            return ret;
          }
        }
      };
    }
  }

  this.perform = function () {
    var serializationOptions = {
      attributes: _.map(schema.fields, 'field'),
      keyForAttribute: function (key) {
        return Inflector.underscore(key);
      },
      typeForAttribute: function (attribute) {
        return typeForAttributes[attribute] || attribute;
      },
      meta: meta
    };

    _.each(schema.fields, function (field) {
      addRelationship(serializationOptions, field);
    });

    return new JSONAPISerializer(schema.name, records,
      serializationOptions);
  };
}

module.exports = ResourceSerializer;
