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
    this.hasSmartFieldSearch = false;
  }

  async getFieldNamesRequested() {
    if (!this.params.fields || !this.params.fields[this.model.name]) { return null; }

    // NOTICE: Populate the necessary associations for filters
    const associations = this.params.filters
      ? await this.filterParser.getAssociations(this.params.filters) : [];

    if (this.params.sort && this.params.sort.includes('.')) {
      let associationFromSorting = this.params.sort.split('.')[0];
      if (associationFromSorting[0] === '-') {
        associationFromSorting = associationFromSorting.substring(1);
      }
      associations.push(associationFromSorting);
    }

    const requestedFields = extractRequestedFields(this.params.fields, this.model, Schemas.schemas);

    return _.union(
      associations,
      requestedFields,
    );
  }

  async buildWhereConditions(searchBuilder, { search, filters, segmentQuery }, segment) {
    const { AND, IN } = this.operators;
    const where = { [AND]: [] };

    if (search) {
      const searchCondition = searchBuilder.perform();
      where[AND].push(searchCondition);
    }

    if (filters) {
      const formattedFilters = await this.filterParser.perform(filters);
      where[AND].push(formattedFilters);
    }

    // TODO: improve
    const segmentWhere = segment && segment.where;
    if (segmentWhere) {
      where[AND].push(segmentWhere);
    }

    if (segmentQuery) {
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
        where[AND].push(condition);

        return where;
      } catch (error) {
        const errorMessage = `Invalid SQL query for this Live Query segment:\n${error.message}`;
        logger.error(errorMessage);
        throw new ErrorHTTP422(errorMessage);
      }
    }

    return where;
  }

  async getRecords(searchBuilder, fieldNamesRequested) {
    const segment = await this.getSegment();
    const segmentScope = segment && segment.scope;
    const scope = segmentScope ? this.model.scope(segmentScope) : this.model.unscoped();
    const include = this.queryBuilder.getIncludes(this.model, fieldNamesRequested);

    const where = await this.buildWhereConditions(searchBuilder, this.params, segment);

    const findAllOpts = {
      where,
      include,
      order: this.queryBuilder.getOrder(),
      offset: this.queryBuilder.getSkip(),
      limit: this.queryBuilder.getLimit(),
    };

    const { search, searchExtended } = this.params;
    if (search) {
      _.each(this.schema.fields, (field) => {
        if (field.search) {
          try {
            field.search(findAllOpts, search);
            this.hasSmartFieldSearch = true;
          } catch (error) {
            logger.error(
              `Cannot search properly on Smart Field ${field.field}`,
              error,
            );
          }
        }
      });

      const fieldsSearched = searchBuilder.getFieldsSearched();
      if (fieldsSearched.length === 0 && !this.hasSmartFieldSearch) {
        if (!searchExtended || !searchBuilder.hasExtendedSearchConditions()) {
          // NOTICE: No search condition has been set for the current search, no record can be
          //         found.
          return [];
        }
      }
    }

    return scope.findAll(findAllOpts);
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

    const countOptions = {
      include,
      where,
    };

    if (!this.primaryKey) {
      // NOTICE: If no primary key is found, use * as a fallback for Sequelize.
      countOptions.col = '*';
    }

    const { search, searchExtended } = this.params;

    if (search) {
      _.each(this.schema.fields, (field) => {
        if (field.search) {
          try {
            field.search(countOptions, search);
            this.hasSmartFieldSearch = true;
          } catch (error) {
            logger.error(
              `Cannot search properly on Smart Field ${field.field}`,
              error,
            );
          }
        }
      });

      const fieldsSearched = searchBuilder.getFieldsSearched();
      if (fieldsSearched.length === 0 && !this.hasSmartFieldSearch) {
        if (!searchExtended
          || !searchBuilder.hasExtendedSearchConditions()) {
          // NOTICE: No search condition has been set for the current search, no record can be
          //         found.
          return 0;
        }
      }
    }

    return scope.count(countOptions);
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
    // TODO: improve?
    const records = await this.getRecords(searchBuilder, fieldNamesRequested);
    let fieldsSearched = null;

    if (this.params.search) {
      fieldsSearched = searchBuilder.getFieldsSearched();
    }

    if (this.schema.isCompositePrimary) {
      records.forEach((record) => {
        record.forestCompositePrimary = new CompositeKeysManager(this.model, this.schema, record)
          .createCompositePrimary();
      });
    }

    return [records, fieldsSearched];
  }
}

module.exports = ResourcesGetter;
