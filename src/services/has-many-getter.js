const _ = require('lodash');
const P = require('bluebird');
const Interface = require('forest-express');
const orm = require('../utils/orm');
const QueryBuilder = require('./query-builder');
const SearchBuilder = require('./search-builder');
const FiltersParser = require('./filters-parser');
const CompositeKeysManager = require('./composite-keys-manager');
const extractRequestedFields = require('./requested-fields-extractor');
const Operators = require('../utils/operators');

function HasManyGetter(model, association, options, params) {
  const queryBuilder = new QueryBuilder(model, options, params);
  const schema = Interface.Schemas.schemas[association.name];
  const primaryKeyModel = _.keys(model.primaryKeys)[0];
  const { AND } = Operators.getInstance(options);
  const filtersParser = new FiltersParser(schema, params.timezone, options);

  let fieldNamesRequested;
  let searchBuilder;

  function getFieldNamesRequested() {
    if (!fieldNamesRequested) {
      fieldNamesRequested = extractRequestedFields(
        params.fields, association, Interface.Schemas.schemas,
      );
    }

    return fieldNamesRequested;
  }

  function getSearchBuilder() {
    if (!searchBuilder) {
      searchBuilder = new SearchBuilder(
        association,
        options,
        params,
        getFieldNamesRequested(),
      );
    }
    return searchBuilder;
  }

  async function buildWhereConditions(associationName, filters) {
    const where = { [AND]: [] };

    if (params.search) {
      const searchCondition = getSearchBuilder().perform(associationName);
      where[AND].push(searchCondition);
    }

    if (filters) {
      const formattedFilters = await filtersParser.perform(params.filters);
      where[AND].push(formattedFilters);
    }

    return where;
  }


  async function findQuery(queryOptions) {
    if (!queryOptions) { queryOptions = {}; }
    const where = await buildWhereConditions(params.associationName, params.filters);
    const include = queryBuilder.getIncludes(association, getFieldNamesRequested());

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

  async function getCount() {
    const where = await buildWhereConditions(params.associationName, params.filters);
    const include = queryBuilder.getIncludes(association, getFieldNamesRequested());

    return model.count({
      where: { [primaryKeyModel]: params.recordId },
      include: [{
        model: association,
        as: params.associationName,
        where,
        required: true,
        scope: false,
        include,
      }],
    });
  }

  async function getRecords() {
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
