import _ from 'lodash';
import P from 'bluebird';
import { Schemas, logger } from 'forest-express';
import Operators from '../utils/operators';
import OperatorValueParser from './operator-value-parser';
import CompositeKeysManager from './composite-keys-manager';
import QueryBuilder from './query-builder';
import SearchBuilder from './search-builder';
import LiveQueryChecker from './live-query-checker';
import { ErrorHTTP422 } from './errors';

function ResourcesGetter(model, options, params) {
  const schema = Schemas.schemas[model.name];
  const queryBuilder = new QueryBuilder(model, options, params);
  let segmentScope;
  let segmentWhere;
  const OPERATORS = new Operators(options);
  const primaryKey = _.keys(model.primaryKeys)[0];

  function getFieldNamesRequested() {
    if (!params.fields || !params.fields[model.name]) { return null; }

    // NOTICE: Populate the necessary associations for filters
    const associationsForQuery = [];
    _.each(params.filter, (values, key) => {
      if (key.indexOf(':') !== -1) {
        const association = key.split(':')[0];
        associationsForQuery.push(association);
      }
    });

    if (params.sort && params.sort.indexOf('.') !== -1) {
      associationsForQuery.push(params.sort.split('.')[0]);
    }

    // NOTICE: Force the primaryKey retrieval to store the records properly in the client.
    return _.union(
      [primaryKey],
      params.fields[model.name].split(','),
      associationsForQuery,
    );
  }

  const fieldNamesRequested = getFieldNamesRequested();

  const searchBuilder = new SearchBuilder(
    model,
    options,
    params,
    fieldNamesRequested,
  );
  let hasSmartFieldSearch = false;

  function handleFilterParams() {
    const where = {};
    const conditions = [];

    _.each(params.filter, (values, key) => {
      if (key.indexOf(':') !== -1) {
        key = `$${key.replace(':', '.')}$`;
      }
      values.split(',').forEach((value) => {
        const condition = {};
        condition[key] = new OperatorValueParser(options)
          .perform(model, key, value, params.timezone);
        conditions.push(condition);
      });
    });

    if (params.filterType) {
      where[OPERATORS[params.filterType.toUpperCase()]] = conditions;
    }

    return where;
  }

  function getWhere() {
    return new P((resolve, reject) => {
      const where = {};
      where[OPERATORS.AND] = [];

      if (params.search) {
        where[OPERATORS.AND].push(searchBuilder.perform());
      }

      if (params.filter) {
        where[OPERATORS.AND].push(handleFilterParams());
      }

      if (segmentWhere) {
        where[OPERATORS.AND].push(segmentWhere);
      }

      if (params.segmentQuery) {
        const queryToFilterRecords = params.segmentQuery.trim();
        new LiveQueryChecker().perform(queryToFilterRecords);

        // WARNING: Choosing the first connection might generate issues if the model does not
        //          belongs to this database.
        return options.connections[0]
          .query(queryToFilterRecords, {
            type: options.sequelize.QueryTypes.SELECT,
          })
          .then((results) => {
            const recordIds = results.map(result => result[primaryKey] || result.id);
            const condition = { [primaryKey]: {} };
            condition[primaryKey][OPERATORS.IN] = recordIds;
            where[OPERATORS.AND].push(condition);

            return resolve(where);
          }, (error) => {
            const errorMessage = `Invalid SQL query for this Live Query segment:\n${error.message}`;
            logger.error(errorMessage);
            reject(new ErrorHTTP422(errorMessage));
          });
      }
      return resolve(where);
    });
  }


  function getRecords() {
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

          const fieldsSearched = searchBuilder.getFieldsSearched();
          if (fieldsSearched.length === 0 && !hasSmartFieldSearch) {
            if (!params.searchExtended ||
              !searchBuilder.hasExtendedSearchConditions()) {
              // NOTICE: No search condition has been set for the current search, no record can be
              //         found.
              return [];
            }
          }
        }

        return scope.findAll(findAllOpts);
      });
  }

  function countRecords() {
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

          const fieldsSearched = searchBuilder.getFieldsSearched();
          if (fieldsSearched.length === 0 && !hasSmartFieldSearch) {
            if (!params.searchExtended ||
              !searchBuilder.hasExtendedSearchConditions()) {
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
        schemaSegment => schemaSegment.name === params.segment,
      );

      segmentScope = segment.scope;
      segmentWhere = segment.where;
    }
  }

  function getSegmentCondition() {
    getSegment();
    if (_.isFunction(segmentWhere)) {
      return segmentWhere(params)
        .then((where) => {
          segmentWhere = where;
        });
    }
    return P.resolve();
  }

  this.perform = () =>
    getSegmentCondition()
      .then(getRecords)
      .then((records) => {
        let fieldsSearched = null;

        if (params.search) {
          fieldsSearched = searchBuilder.getFieldsSearched();
        }

        if (schema.isCompositePrimary) {
          records.forEach((record) => {
            record.forestCompositePrimary =
              new CompositeKeysManager(model, schema, record)
                .createCompositePrimary();
          });
        }

        return [records, fieldsSearched];
      });

  this.count = () => getSegmentCondition().then(countRecords);
}

module.exports = ResourcesGetter;
