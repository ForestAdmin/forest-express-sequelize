import _ from 'lodash';
import { Schemas } from 'forest-express';
import Orm from '../utils/orm';
import Database from '../utils/database';

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
    _.values(modelForIncludes.associations).forEach((association) => {
      if (!fieldNamesRequested ||
        (fieldNamesRequested.indexOf(association.as) !== -1)) {
        if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
          includes.push({
            model: association.target.unscoped(),
            as: association.associationAccessor,
          });
        }
      }
    });

    return includes;
  };

  this.getOrder = (aliasName, aliasSchema) => {
    if (params.sort) {
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
        const [associationName, fieldName] = params.sort.split('.');
        const schemaField = (aliasSchema || schema).fields
          .find(field => field.field === associationName);
        const [tableName] = schemaField.reference.split('.');
        const associationSchema = Schemas.schemas[tableName];
        const belongsToColumnName = Orm.getColumnName(associationSchema, fieldName);
        return [[opts.sequelize.col(`${associationName}.${belongsToColumnName}`), order]];
      } else if (aliasName) {
        return [[opts.sequelize.col(`${aliasName}.${Orm.getColumnName(aliasSchema, params.sort)}`), order]];
      }
      return [[params.sort, order]];
    }

    return null;
  };
}

module.exports = QueryBuilder;
