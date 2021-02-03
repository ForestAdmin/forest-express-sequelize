import _ from 'lodash';
import { Schemas } from 'forest-express';
import Orm from '../utils/orm';
import { InvalidParameterError } from './errors';

function getAggregateField({
  aggregateField, schemaRelationship, modelRelationship,
}) {
  // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
  const fieldName = aggregateField
    || schemaRelationship.primaryKeys[0]
    || schemaRelationship.fields[0].field;
  return `${modelRelationship.name}.${Orm.getColumnName(schemaRelationship, fieldName)}`;
}

/**
 * @param {import('sequelize').Model} model
 * @param {import('sequelize').Model} modelRelationship
 * @param {{
 *  label_field: string;
 *  aggregate: string;
 *  aggregate_field: string;
 * }} params
 * @param {*} options
 */
function LeaderboardStatGetter(model, modelRelationship, params, options) {
  const labelField = params.label_field;
  const aggregate = params.aggregate.toUpperCase();
  const { limit } = params;
  const schema = Schemas.schemas[model.name];
  const schemaRelationship = Schemas.schemas[modelRelationship.name];
  let associationAs = schema.name;
  const associationFound = _.find(
    modelRelationship.associations,
    (association) => association.target.name === model.name,
  );

  const aggregateField = getAggregateField({
    aggregateField: params.aggregate_field,
    schemaRelationship,
    modelRelationship,
  });

  if (!associationFound) {
    throw new InvalidParameterError(`Association ${model.name} not found`);
  }

  if (associationFound.as) {
    associationAs = associationFound.as;
  }

  const labelColumn = Orm.getColumnName(schema, labelField);
  const groupBy = `${associationAs}.${labelColumn}`;

  this.perform = async () => {
    const records = await modelRelationship
      .unscoped()
      .findAll({
        attributes: [
          options.sequelize.col(groupBy),
          [options.sequelize.fn(aggregate, options.sequelize.col(aggregateField)), 'value'],
        ],
        includeIgnoreAttributes: false,
        include: [{
          model,
          attributes: [labelField],
          as: associationAs,
          required: true,
        }],
        subQuery: false,
        group: groupBy,
        order: [[options.sequelize.literal('value'), 'DESC']],
        limit,
        raw: true,
      });

    return {
      value: records.map((data) => ({
        key: data[labelColumn],
        value: Number(data.value),
      })),
    };
  };
}

module.exports = LeaderboardStatGetter;
