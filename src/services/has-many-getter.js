const _ = require('lodash');
const P = require('bluebird');
const Interface = require('forest-express');
const orm = require('../utils/orm');
const QueryBuilder = require('./query-builder');
const SearchBuilder = require('./search-builder');
const CompositeKeysManager = require('./composite-keys-manager');
const extractRequestedFields = require('./requested-fields-extractor');

function HasManyGetter(model, association, opts, params) {
  const queryBuilder = new QueryBuilder(model, opts, params);
  const schema = Interface.Schemas.schemas[association.name];
  const primaryKeyModel = _.keys(model.primaryKeys)[0];

  function getFieldNamesRequested() {
    return extractRequestedFields(params.fields, association, Interface.Schemas.schemas);
  }

  const fieldNamesRequested = getFieldNamesRequested();
  const searchBuilder = new SearchBuilder(association, opts, params, fieldNamesRequested);
  const where = searchBuilder.perform(params.associationName);
  const include = queryBuilder.getIncludes(association, fieldNamesRequested);

  function findQuery(queryOptions) {
    if (!queryOptions) { queryOptions = {}; }

    return orm.findRecord(model, params.recordId, {
      order: queryOptions.order,
      subQuery: false,
      offset: queryOptions.offset,
      limit: queryOptions.limit,
      // NOTICE: by default, all fields from the parent model
      //         are retrieved, which can cause performance issues,
      //         whereas we are only requesting the child model here
      //         and we don't need the parent's attributes
      attributes: [],
      include: [{
        model: association,
        as: params.associationName,
        scope: false,
        required: false,
        where,
        include,
      }],
    })
      .then((record) => ((record && record[params.associationName]) || []));
  }

  function getCount() {
    return model.count({
      where: { [primaryKeyModel]: params.recordId },
      include: [{
        model: association,
        as: params.associationName,
        where,
        required: true,
        scope: false,
      }],
    });
  }

  function getRecords() {
    const queryOptions = {
      order: queryBuilder.getOrder(params.associationName, schema),
      offset: queryBuilder.getSkip(),
      limit: queryBuilder.getLimit(),
    };

    return findQuery(queryOptions)
      .then((records) => P.map(records, (record) => {
        if (schema.isCompositePrimary) {
          record.forestCompositePrimary = new CompositeKeysManager(association, schema, record)
            .createCompositePrimary();
        }

        return record;
      }));
  }

  this.perform = () =>
    getRecords()
      .then((records) => {
        let fieldsSearched = null;

        if (params.search) {
          fieldsSearched = searchBuilder.getFieldsSearched();
        }

        return [records, fieldsSearched];
      });

  this.count = getCount;
}

module.exports = HasManyGetter;
