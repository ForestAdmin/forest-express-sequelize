import _ from 'lodash';
import { Schemas, logger } from 'forest-express';
import Operators from '../utils/operators';
import CompositeKeysManager from './composite-keys-manager';
import QueryBuilder from './query-builder';
import SearchBuilder from './search-builder';
import LiveQueryChecker from './live-query-checker';
import { ErrorHTTP422 } from './errors';
import FiltersParser from './filters-parser';
import extractRequestedFields from './requested-fields-extractor';

class ResourcesGetter {
  constructor(model, options, params) {
    this.model = model;
    this.options = options;
    this.params = params;
    this.schema = Schemas.schemas[model.name];
    this.queryBuilder = new QueryBuilder(model, options, params);
    this.operators = Operators.getInstance(options);
    [this.primaryKey] = _.keys(model.primaryKeys);
    this.filterParser = new FiltersParser(this.schema, params.timezone, options);
  }

  async getAssociations(filters, sort) {
    // NOTICE: Populate the necessary associations for filters
    const associations = filters ? await this.filterParser.getAssociations(filters) : [];

    if (sort && sort.includes('.')) {
      let associationFromSorting = sort.split('.')[0];
      if (associationFromSorting[0] === '-') {
        associationFromSorting = associationFromSorting.substring(1);
      }
      associations.push(associationFromSorting);
    }
  }

  async getFieldNamesRequested() {
    const { fields, filters, sort } = this.params;
    if (!fields || !fields[this.model.name]) { return null; }

    const associations = await this.getAssociations(filters, sort);
    const requestedFields = extractRequestedFields(fields, this.model, Schemas.schemas);

    return _.union(
      associations,
      requestedFields,
    );
  }

  async buildSegmentQueryCondition(segmentQuery) {
    const { IN } = this.operators;
    const queryToFilterRecords = segmentQuery.trim();

    new LiveQueryChecker().perform(queryToFilterRecords);

    // WARNING: Choosing the first connection might generate issues if the model does not
    //          belongs to this database.
    try {
      const connection = this.model.sequelize;
      const results = await connection.query(queryToFilterRecords, {
        type: this.options.Sequelize.QueryTypes.SELECT,
      });

      const recordIds = results.map((result) => result[this.primaryKey] || result.id);
      const condition = { [this.primaryKey]: {} };
      condition[this.primaryKey][IN] = recordIds;

      return condition;
    } catch (error) {
      const errorMessage = `Invalid SQL query for this Live Query segment:\n${error.message}`;
      logger.error(errorMessage);
      throw new ErrorHTTP422(errorMessage);
    }
  }

  async buildWhereConditions(searchBuilder, { search, filters, segmentQuery }, segment) {
    const { AND } = this.operators;
    const where = { [AND]: [] };

    if (search) {
      const searchCondition = searchBuilder.perform();
      where[AND].push(searchCondition);
    }

    if (filters) {
      const formattedFilters = await this.filterParser.perform(filters);
      where[AND].push(formattedFilters);
    }

    const segmentWhere = segment && segment.where;
    if (segmentWhere) {
      where[AND].push(segmentWhere);
    }

    if (segmentQuery) {
      const segmentQueryCondition = await this.buildSegmentQueryCondition(segmentQuery);
      where[AND].push(segmentQueryCondition);
    }

    return where;
  }

  /**
   * @param {any} queryOptions The predefined query options containing sorts, filters and
   * search on basic fields
   * @param {any} schemaFields The fields definition issued from the user agent
   * @param {string} searchValue The searchValue provided by the user through the request
   * @returns {boolean} A boolean stating if options have been added due to custom
   * search definition
   */
  // eslint-disable-next-line class-methods-use-this
  addCustomFieldSearchToQueryOptions(queryOptions, schemaFields, searchValue) {
    let hasCustomFieldSearch = false;

    _.each(schemaFields, (field) => {
      if (field.search) {
        try {
          // Custom field search definition adds custom conditions
          // to the query where clause
          field.search(queryOptions, searchValue);
          hasCustomFieldSearch = true;
        } catch (error) {
          logger.error(
            `Cannot search properly on Smart Field ${field.field}`,
            error,
          );
        }
      }
    });

    return hasCustomFieldSearch;
  }

  async getRecords(searchBuilder, fieldNamesRequested) {
    const segment = await this.getSegment();
    const segmentScope = segment && segment.scope;
    const scope = segmentScope ? this.model.scope(segmentScope) : this.model.unscoped();
    const include = this.queryBuilder.getIncludes(this.model, fieldNamesRequested);

    const where = await this.buildWhereConditions(searchBuilder, this.params, segment);

    const queryOptions = {
      where,
      include,
      order: this.queryBuilder.getOrder(),
      offset: this.queryBuilder.getSkip(),
      limit: this.queryBuilder.getLimit(),
    };

    const { search, searchExtended } = this.params;

    if (search) {
      const hasCustomFieldSearch = this.addCustomFieldSearchToQueryOptions(
        queryOptions, this.schema.fields, search,
      );

      const fieldsSearched = searchBuilder.getFieldsSearched();

      if (fieldsSearched.length === 0 && !hasCustomFieldSearch) {
        if (!searchExtended || !searchBuilder.hasExtendedSearchConditions()) {
          // NOTICE: No search condition has been set for the current search, no record can be
          //         found.
          return [];
        }
      }
    }

    return scope.findAll(queryOptions);
  }


  async count() {
    const fieldNamesRequested = await this.getFieldNamesRequested();
    const searchBuilder = new SearchBuilder(
      this.model,
      this.options,
      this.params,
      fieldNamesRequested,
    );
    const segment = await this.getSegment();
    const segmentScope = segment && segment.scope;
    const scope = segmentScope ? this.model.scope(segmentScope) : this.model.unscoped();
    const include = this.queryBuilder.getIncludes(this.model, fieldNamesRequested);

    const where = await this.buildWhereConditions(searchBuilder, this.params, segment);

    const queryOptions = {
      include,
      where,
    };

    if (!this.primaryKey) {
      // NOTICE: If no primary key is found, use * as a fallback for Sequelize.
      queryOptions.col = '*';
    }

    const { search, searchExtended } = this.params;

    if (search) {
      const hasCustomFieldSearch = this.addCustomFieldSearchToQueryOptions(
        queryOptions, this.schema.fields, search,
      );

      const fieldsSearched = searchBuilder.getFieldsSearched();

      if (fieldsSearched.length === 0 && !hasCustomFieldSearch) {
        if (!searchExtended
          || !searchBuilder.hasExtendedSearchConditions()) {
          // NOTICE: No search condition has been set for the current search, no record can be
          //         found.
          return 0;
        }
      }
    }

    return scope.count(queryOptions);
  }

  async getSegment() {
    if (!this.schema.segments || !this.params.segment) return null;

    const segment = _.find(
      this.schema.segments,
      (schemaSegment) => schemaSegment.name === this.params.segment,
    );

    if (segment && segment.where && _.isFunction(segment.where)) {
      segment.where = await segment.where(this.params);
    }

    return segment;
  }

  async perform() {
    const fieldNamesRequested = await this.getFieldNamesRequested();
    const searchBuilder = new SearchBuilder(
      this.model,
      this.options,
      this.params,
      fieldNamesRequested,
    );

    const records = await this.getRecords(searchBuilder, fieldNamesRequested);
    let fieldsSearched = null;

    if (this.params.search) {
      fieldsSearched = searchBuilder.getFieldsSearched();
    }

    new CompositeKeysManager(this.model).annotateRecords(records);

    return [records, fieldsSearched];
  }
}

module.exports = ResourcesGetter;
