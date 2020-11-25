import _ from 'lodash';
import { Schemas } from 'forest-express';
import Orm from '../utils/orm';
import Database from '../utils/database';

const HAS_ONE = 'HasOne';
const BELONGS_TO = 'BelongsTo';

const { getReferenceField } = require('../utils/query');

/**
 * @param {string[]} values
 * @returns {string[]}
 */
function uniqueValues(values) {
  return Array.from(new Set(values));
}

/**
 * @param {string} key
 * @param {import('sequelize').Association} association
 * @returns {string}
 */
function getTargetFieldName(key, association) {
  // Defensive programming
  if (key && association.target.tableAttributes[key]) {
    return association.target.tableAttributes[key].fieldName;
  }

  return undefined;
}

/**
 * @param {import('sequelize').HasOne|import('sequelize').BelongsTo} association
 * @returns {string[]}
 */
function getMandatoryFields(association) {
  return association.target.primaryKeyAttributes
    .map((attribute) => getTargetFieldName(attribute, association));
}

function QueryBuilder(model, opts, params) {
  const schema = Schemas.schemas[model.name];

  function hasPagination() {
    return params.page && params.page.number;
  }

  this.getSkip = () => {
    if (hasPagination()) {
      return (Number.parseInt(params.page.number, 10) - 1) * this.getLimit();
    }
    return 0;
  };

  this.getLimit = () => {
    if (hasPagination()) {
      return Number.parseInt(params.page.size, 10) || 10;
    }
    return 10;
  };

  this.getIncludes = (modelForIncludes, fieldNamesRequested) => {
    const includes = [];

    Object.values(modelForIncludes.associations)
      .filter((association) => [HAS_ONE, BELONGS_TO].includes(association.associationType))
      .forEach((association) => {
        const targetFields = Object.values(association.target.tableAttributes)
          .map((attribute) => attribute.fieldName);

        const explicitAttributes = (fieldNamesRequested || [])
          .filter((name) => name.startsWith(`${association.as}.`))
          .map((name) => name.replace(`${association.as}.`, ''))
          .filter((fieldName) => targetFields.includes(fieldName));

        if (!fieldNamesRequested
        || fieldNamesRequested.includes(association.as)
        || explicitAttributes.length) {
          // NOTICE: For performance reasons, we only request the keys
          //         as they're the only needed fields for the interface
          const uniqueExplicitAttributes = uniqueValues([
            ...getMandatoryFields(association),
            ...explicitAttributes,
          ].filter(Boolean));

          const attributes = explicitAttributes.length
            ? uniqueExplicitAttributes
            : undefined;

          includes.push({
            model: association.target.unscoped(),
            as: association.associationAccessor,
            attributes,
          });
        }
      });

    return includes;
  };

  // NOTICE: This function supports params such as `id`, `-id` (DESC) and `collection.id`.
  //         It does not handle multiple columns sorting.
  this.getOrder = (aliasName, aliasSchema) => {
    if (!params.sort) { return null; }

    let order = 'ASC';

    if (params.sort[0] === '-') {
      params.sort = params.sort.substring(1);
      order = 'DESC';
    }

    // NOTICE: Sequelize version previous to 4.4.2 generate a bad MSSQL query
    //         if users sort the collection on the primary key, so we prevent
    //         that.
    const idField = _.keys(model.primaryKeys)[0];
    if (Database.isMSSQL(opts) && _.includes([idField, `-${idField}`], params.sort)) {
      const sequelizeVersion = opts.sequelize.version;
      if (sequelizeVersion !== '4.4.2-forest') {
        return null;
      }
    }

    if (params.sort.indexOf('.') !== -1) {
      // NOTICE: Sort on the belongsTo displayed field
      const sortingParameters = params.sort.split('.');
      const associationName = aliasName ? `${aliasName}->${sortingParameters[0]}` : sortingParameters[0];
      const fieldName = sortingParameters[1];
      const column = getReferenceField(
        Schemas.schemas,
        (aliasSchema || schema),
        associationName,
        fieldName,
      );
      return [[opts.sequelize.col(column), order]];
    }
    if (aliasName) {
      return [[opts.sequelize.col(`${aliasName}.${Orm.getColumnName(aliasSchema, params.sort)}`), order]];
    }
    return [[params.sort, order]];
  };
}

module.exports = QueryBuilder;
