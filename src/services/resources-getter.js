import { keys, each, union, find, isFunction } from 'lodash';
import P, { resolve as _resolve } from 'bluebird';
import { Schemas, logger } from 'forest-express';
import Operators from '../utils/operators';
import OperatorValueParser from './operator-value-parser';
import CompositeKeysManager from './composite-keys-manager';
import QueryBuilder from './query-builder';
import SearchBuilder from './search-builder';
import LiveQueryChecker from './live-query-checker';
import { ErrorHTTP422 } from './errors';

function ResourcesGetter(model, opts, params) {
  const schema = Schemas.schemas[model.name];
  const queryBuilder = new QueryBuilder(model, opts, params);
  let segmentScope;
  let segmentWhere;
  const OPERATORS = new Operators(opts);
  const primaryKey = keys(model.primaryKeys)[0];

  function getFieldNamesRequested() {
    if (!params.fields || !params.fields[model.name]) { return null; }

    // NOTICE: Populate the necessary associations for filters
    const associationsForQuery = [];
    each(params.filter, (values, key) => {
      if (key.indexOf(':') !== -1) {
        const association = key.split(':')[0];
        associationsForQuery.push(association);
      }
    });

    if (params.sort && params.sort.indexOf('.') !== -1) {
      associationsForQuery.push(params.sort.split('.')[0]);
    }

    // NOTICE: Force the primaryKey retrieval to store the records properly in the client.
    return union(
      [primaryKey],
      params.fields[model.name].split(','),
      associationsForQuery,
    );
  }

  const fieldNamesRequested = getFieldNamesRequested();

  const searchBuilder = new SearchBuilder(
    model,
    opts,
    params,
    fieldNamesRequested,
  );
  let hasSmartFieldSearch = false;

  function handleFilterParams() {
    const where = {};
    const conditions = [];

    each(params.filter, (values, key) => {
      if (key.indexOf(':') !== -1) {
        key = `$${key.replace(':', '.')}$`;
      }
      values.split(',').forEach((value) => {
        const condition = {};
        condition[key] = new OperatorValueParser(opts)
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
        return opts.connections[0]
          .query(queryToFilterRecords, {
            type: opts.sequelize.QueryTypes.SELECT,
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
          each(schema.fields, (field) => {
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
        const options = {
          include,
          where,
        };

        if (!primaryKey) {
          // NOTICE: If no primary key is found, use * as a fallback for Sequelize.
          options.col = '*';
        }

        if (params.search) {
          each(schema.fields, (field) => {
            if (field.search) {
              try {
                field.search(options, params.search);
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

        return scope.count(options);
      });
  }

  function getSegment() {
    if (schema.segments && params.segment) {
      const segment = find(
        schema.segments,
        schemaSegment => schemaSegment.name === params.segment,
      );

      segmentScope = segment.scope;
      segmentWhere = segment.where;
    }
  }

  function getSegmentCondition() {
    getSegment();
    if (isFunction(segmentWhere)) {
      return segmentWhere(params)
        .then((where) => {
          segmentWhere = where;
        });
    }
    return _resolve();
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
