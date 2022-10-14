import _ from 'lodash';
import { Schemas, scopeManager } from 'forest-express';
import Orm from '../utils/orm';
import SequelizeCompatibility from '../utils/sequelize-compatibility';
import { InvalidParameterError } from './errors';
import QueryOptions from './query-options';

function getAggregateField({
  aggregateField, parentSchema, parentModel,
}) {
  // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
  const fieldName = aggregateField
    || parentSchema.primaryKeys[0]
    || parentSchema.fields[0].field;
  return `${parentModel.name}.${Orm.getColumnName(parentSchema, fieldName)}`;
}

async function getSequelizeOptionsForModel(model, user, timezone) {
  const queryOptions = new QueryOptions(model);
  const scopeFilters = await scopeManager.getScopeForUser(user, model.name, true);
  await queryOptions.filterByConditionTree(scopeFilters, timezone);
  return queryOptions.sequelizeOptions;
}

/**
 * @param {import('sequelize').Model} childModel
 * @param {import('sequelize').Model} parentModel
 * @param {{
 *  labelFieldName: string;
 *  aggregator: string;
 *  aggregateFieldName: string;
 *  limit: number;
 * }} params
 */
function LeaderboardStatGetter(childModel, parentModel, params, user) {
  const labelField = params.labelFieldName;
  const aggregate = params.aggregator.toUpperCase();
  const { limit } = params;
  const childSchema = Schemas.schemas[childModel.name];
  const parentSchema = Schemas.schemas[parentModel.name];
  let associationAs = childSchema.name;
  const associationFound = _.find(
    parentModel.associations,
    (association) => association.target.name === childModel.name,
  );

  const aggregateField = getAggregateField({
    aggregateField: params.aggregateFieldName,
    parentSchema,
    parentModel,
  });

  if (!associationFound) {
    throw new InvalidParameterError(`Association ${childModel.name} not found`);
  }

  if (associationFound.as) {
    associationAs = associationFound.as;
  }

  const labelColumn = Orm.getColumnName(childSchema, labelField);
  const groupBy = `${associationAs}.${labelColumn}`;

  this.perform = async () => {
    const { timezone } = params;
    const parentSequelizeOptions = await getSequelizeOptionsForModel(parentModel, user, timezone);
    const childSequelizeOptions = await getSequelizeOptionsForModel(childModel, user, timezone);

    const queryOptions = SequelizeCompatibility.postProcess(parentModel, {
      attributes: [
        [childModel.sequelize.col(groupBy), 'key'],
        [childModel.sequelize.fn(aggregate, childModel.sequelize.col(aggregateField)), 'value'],
      ],
      where: parentSequelizeOptions.where,
      includeIgnoreAttributes: false,
      include: [{
        model: childModel,
        attributes: [labelField],
        as: associationAs,
        required: true,
        where: childSequelizeOptions.where,
        include: childSequelizeOptions.include || [],
      }, ...(parentSequelizeOptions.include || [])],
      subQuery: false,
      group: groupBy,
      order: [[childModel.sequelize.literal('value'), 'DESC']],
      limit,
      raw: true,
    });

    const records = await parentModel.findAll(queryOptions);

    return {
      value: records.map((data) => ({
        key: data.key,
        value: Number(data.value),
      })),
    };
  };
}

module.exports = LeaderboardStatGetter;
