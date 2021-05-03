const _ = require('lodash');
const Interface = require('forest-express');
const orm = require('../utils/orm');
const QueryBuilder = require('./query-builder');
const SearchBuilder = require('./search-builder');
const FiltersParser = require('./filters-parser');
const CompositeKeysManager = require('./composite-keys-manager');
const extractRequestedFields = require('./requested-fields-extractor');
const Operators = require('../utils/operators');

class HasManyGetter {
  constructor(model, association, options, params) {
    this.model = model;
    this.association = association;
    this.params = params;
    this.queryBuilder = new QueryBuilder(model, options, params);
    this.schema = Interface.Schemas.schemas[association.name];
    [this.primaryKeyModel] = _.keys(model.primaryKeys);
    this.operators = Operators.getInstance(options);
    this.filtersParser = new FiltersParser(this.schema, params.timezone, options);
    this.fieldNamesRequested = extractRequestedFields(
      params.fields, association, Interface.Schemas.schemas,
    );
    this.searchBuilder = new SearchBuilder(
      association,
      options,
      params,
      this.fieldNamesRequested,
    );
  }

  async buildWhereConditions({ associationName, search, filters }) {
    const { AND } = this.operators;
    const where = { [AND]: [] };

    if (search) {
      const searchCondition = this.searchBuilder.perform(associationName);
      where[AND].push(searchCondition);
    }


    if (filters) {
      const formattedFilters = await this.filtersParser.perform(filters);
      where[AND].push(formattedFilters);
    }

    return where;
  }

  async findQuery(queryOptions) {
    if (!queryOptions) { queryOptions = {}; }
    const { associationName, recordId } = this.params;

    const where = await this.buildWhereConditions(this.params);
    const include = this.queryBuilder.getIncludes(this.association, this.fieldNamesRequested);

    const record = await orm.findRecord(this.model, recordId, {
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
        model: this.association,
        as: associationName,
        scope: false,
        required: false,
        where,
        include,
      }],
    });

    return (record && record[associationName]) || [];
  }

  async count() {
    const { associationName, recordId } = this.params;
    const where = await this.buildWhereConditions(this.params);
    const include = this.queryBuilder.getIncludes(this.association, this.fieldNamesRequested);

    return this.model.count({
      where: { [this.primaryKeyModel]: recordId },
      include: [{
        model: this.association,
        as: associationName,
        where,
        required: true,
        scope: false,
        include,
      }],
    });
  }

  async getRecords() {
    const { associationName } = this.params;

    const queryOptions = {
      order: this.queryBuilder.getOrder(associationName, this.schema),
      offset: this.queryBuilder.getSkip(),
      limit: this.queryBuilder.getLimit(),
    };

    const records = await this.findQuery(queryOptions);
    new CompositeKeysManager(this.association).annotateRecords(records);
    return records;
  }

  async perform() {
    const records = await this.getRecords();

    let fieldsSearched = null;

    if (this.params.search) {
      fieldsSearched = this.searchBuilder.getFieldsSearched();
    }

    return [records, fieldsSearched];
  }
}

module.exports = HasManyGetter;
