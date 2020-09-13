import _ from 'lodash';
import P from 'bluebird';
import { Schemas, logger } from 'forest-express';
import Operators from '../utils/operators';
import CompositeKeysManager from './composite-keys-manager';
import QueryBuilder from './query-builder';
import SearchBuilder from './search-builder';
import LiveQueryChecker from './live-query-checker';
import { ErrorHTTP422 } from './errors';
import FiltersParser from './filters-parser';
import extractRequestedFields from './requested-fields-extractor';

function ResourcesGetter(model, options, params) {
  const schema = Schemas.schemas[model.name];
  const queryBuilder = new QueryBuilder(model, options, params);
  let segmentScope;
  let segmentWhere;
  const OPERATORS = new Operators(options);
  const primaryKey = _.keys(model.primaryKeys)[0];
  const filterParser = new FiltersParser(schema, params.timezone, options);
  let fieldNamesRequested;
  let searchBuilder;

  async function getFieldNamesRequested() {
    if (!params.fields || !params.fields[model.name]) { return null; }

    // NOTICE: Populate the necessary associations for filters
    const associations = params.filters ? await filterParser.getAssociations(params.filters) : [];

    if (params.sort && params.sort.includes('.')) {
      let associationFromSorting = params.sort.split('.')[0];
      if (associationFromSorting[0] === '-') {
        associationFromSorting = associationFromSorting.substring(1);
      }
      associations.push(associationFromSorting);
    }

    const requestedFields = extractRequestedFields(params.fields, model, Schemas.schemas);

    return _.union(
      associations,
      requestedFields,
    );
  }

  function getSearchBuilder() {
    if (searchBuilder) {
      return searchBuilder;
    }

    searchBuilder = new SearchBuilder(
      model,
      options,
      params,
      fieldNamesRequested,
    );
    return searchBuilder;
  }

  let hasSmartFieldSearch = false;

  async function handleFilterParams() {
    return filterParser.perform(params.filters);
  }

  async function getWhere() {
    const where = {};
    where[OPERATORS.AND] = [];

    if (params.search) {
      where[OPERATORS.AND].push(getSearchBuilder().perform());
    }

    if (params.filters) {
      where[OPERATORS.AND].push(await handleFilterParams());
    }

    if (segmentWhere) {
      where[OPERATORS.AND].push(segmentWhere);
    }

    if (params.segmentQuery) {
      const queryToFilterRecords = params.segmentQuery.trim();

      new LiveQueryChecker().perform(queryToFilterRecords);

      // WARNING: Choosing the first connection might generate issues if the model does not
      //          belongs to this database.
      try {
        const results = await options.connections[0]
          .query(queryToFilterRecords, {
            type: options.sequelize.QueryTypes.SELECT,
          });

        const recordIds = results.map((result) => result[primaryKey] || result.id);
        const condition = { [primaryKey]: {} };
        condition[primaryKey][OPERATORS.IN] = recordIds;
        where[OPERATORS.AND].push(condition);

        return where;
      } catch (error) {
        const errorMessage = `Invalid SQL query for this Live Query segment:\n${error.message}`;
        logger.error(errorMessage);
        throw new ErrorHTTP422(errorMessage);
      }
    }

    return where;
  }

  async function getRecords() {
    fieldNamesRequested = fieldNamesRequested || await getFieldNamesRequested();

    const scope = segmentScope ? model.scope(segmentScope) : model.unscoped();
    const include = queryBuilder.getIncludes(model, fieldNamesRequested);

    return getWhere()
      .then((where) => {
        const findAllOpts = {
          where,
          include,
          order: queryBuilder.getOrder(),
          offset: queryBuilder.getSkip(),
          limit: queryBuilder.getLimit(),
        };

        if (params.search) {
          _.each(schema.fields, (field) => {
            if (field.search) {
              try {
                field.search(findAllOpts, params.search);
                hasSmartFieldSearch = true;
              } catch (error) {
                logger.error(
                  `Cannot search properly on Smart Field ${field.field}`,
                  error,
                );
              }
            }
          });

          const fieldsSearched = getSearchBuilder().getFieldsSearched();
          if (fieldsSearched.length === 0 && !hasSmartFieldSearch) {
            if (!params.searchExtended
              || !getSearchBuilder().hasExtendedSearchConditions()) {
              // NOTICE: No search condition has been set for the current search, no record can be
              //         found.
              return [];
            }
          }
        }

        return scope.findAll(findAllOpts);
      });
  }

  async function countRecords() {
    fieldNamesRequested = fieldNamesRequested || await getFieldNamesRequested();

    const scope = segmentScope ? model.scope(segmentScope) : model.unscoped();
    const include = queryBuilder.getIncludes(model, fieldNamesRequested);

    return getWhere()
      .then((where) => {
        const countOptions = {
          include,
          where,
        };

        if (!primaryKey) {
          // NOTICE: If no primary key is found, use * as a fallback for Sequelize.
          countOptions.col = '*';
        }

        if (params.search) {
          _.each(schema.fields, (field) => {
            if (field.search) {
              try {
                field.search(countOptions, params.search);
                hasSmartFieldSearch = true;
              } catch (error) {
                logger.error(
                  `Cannot search properly on Smart Field ${field.field}`,
                  error,
                );
              }
            }
          });

          const fieldsSearched = getSearchBuilder().getFieldsSearched();
          if (fieldsSearched.length === 0 && !hasSmartFieldSearch) {
            if (!params.searchExtended
              || !getSearchBuilder().hasExtendedSearchConditions()) {
              // NOTICE: No search condition has been set for the current search, no record can be
              //         found.
              return 0;
            }
          }
        }

        return scope.count(countOptions);
      });
  }

  function getSegment() {
    if (schema.segments && params.segment) {
      const segment = _.find(
        schema.segments,
        (schemaSegment) => schemaSegment.name === params.segment,
      );

      segmentScope = segment.scope;
      segmentWhere = segment.where;
    }
  }

  async function getSegmentCondition() {
    getSegment();
    if (_.isFunction(segmentWhere)) {
      return segmentWhere(params)
        .then((where) => {
          segmentWhere = where;
        });
    }
    return P.resolve();
  }

  this.perform = async () =>
    getSegmentCondition()
      .then(getRecords)
      .then((records) => {
        let fieldsSearched = null;

        if (params.search) {
          fieldsSearched = getSearchBuilder().getFieldsSearched();
        }

        if (schema.isCompositePrimary) {
          records.forEach((record) => {
            record.forestCompositePrimary = new CompositeKeysManager(model, schema, record)
              .createCompositePrimary();
          });
        }

        return [records, fieldsSearched];
      });

  this.count = async () => getSegmentCondition().then(countRecords);
}

module.exports = ResourcesGetter;
