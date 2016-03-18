'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var Schemas = require('../generators/schemas');

function ResourceSerializer(model, records, opts, meta) {
  var schema = Schemas.schemas[model.name];

  this.perform = function () {
    var typeForAttributes = {};

    function getAttributesFor(dest, fields) {
      _.map(fields, function (field) {
        if (_.isPlainObject(field.type)) {
          dest[field.field] = {
            attributes: _.map(field.type.fields, 'field')
          };

          getAttributesFor(dest[field.field], field.type.fields);
        } else if (field.reference) {
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

          if (_.isArray(field.type)) {
            dest[field.field].ignoreRelationshipData = true;
            dest[field.field].included = false;
          }
        }
      });
    }

    var serializationOptions = {
      attributes: _.map(schema.fields, 'field'),
      keyForAttribute: function (key) {
        return key;
      },
      typeForAttribute: function (attribute) {
        return typeForAttributes[attribute] || attribute;
      },
      meta: meta
    };

    getAttributesFor(serializationOptions, schema.fields);

    return new JSONAPISerializer(schema.name, records,
      serializationOptions);
  };
}

module.exports = ResourceSerializer;
