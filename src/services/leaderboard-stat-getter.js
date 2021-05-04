import _ from 'lodash';
import { Schemas, scopeManager } from 'forest-express';
import Orm from '../utils/orm';
import { InvalidParameterError } from './errors';
import QueryOptions from './query-options';

function getAggregateField({
  aggregateField, schemaRelationship, parentModel,
}) {
  // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
  const fieldName = aggregateField
    || schemaRelationship.primaryKeys[0]
    || schemaRelationship.fields[0].field;
  return `${parentModel.name}.${Orm.getColumnName(schemaRelationship, fieldName)}`;
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
 *  label_field: string;
 *  aggregate: string;
 *  aggregate_field: string;
 * }} params
 */
function LeaderboardStatGetter(childModel, parentModel, params, user) {
  const labelField = params.label_field;
  const aggregate = params.aggregate.toUpperCase();
  const { limit } = params;
  const schema = Schemas.schemas[childModel.name];
  const schemaRelationship = Schemas.schemas[parentModel.name];
  let associationAs = schema.name;
  const associationFound = _.find(
    parentModel.associations,
    (association) => association.target.name === childModel.name,
  );

  const aggregateField = getAggregateField({
    aggregateField: params.aggregate_field,
    schemaRelationship,
    parentModel,
  });

  if (!associationFound) {
    throw new InvalidParameterError(`Association ${childModel.name} not found`);
  }

  if (associationFound.as) {
    associationAs = associationFound.as;
  }

  const labelColumn = Orm.getColumnName(schema, labelField);
  const groupBy = `${associationAs}.${labelColumn}`;

  this.perform = async () => {
    const { timezone } = params;

    const parentSequelizeOptions = await getSequelizeOptionsForModel(parentModel, user, timezone);
    const childSequelizeOptions = await getSequelizeOptionsForModel(childModel, user, timezone);

    const records = await parentModel.findAll({
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

    return {
      value: records.map((data) => ({
        key: data.key,
        value: Number(data.value),
      })),
    };
  };
}

module.exports = LeaderboardStatGetter;
