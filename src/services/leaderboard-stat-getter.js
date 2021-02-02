import _ from 'lodash';
import { Schemas } from 'forest-express';
import Orm from '../utils/orm';
import { InvalidParameterError } from './errors';

/**
 * @param {import('sequelize').ModelCtor<any>} tableSchema
 * @param {string} fieldName
 */
function assertThatFieldExists(tableSchema, fieldName) {
  const field = Object.values(tableSchema.tableAttributes)
    .find((tableAttribute) => tableAttribute.field === fieldName);

  if (!field) {
    throw new InvalidParameterError(`Field ${fieldName} does not exist on ${tableSchema.name}`);
  }
}

/**
 * @param {string} aggregate
 */
function assertSupportedAggregation(aggregate) {
  if (!['COUNT', 'SUM'].includes(aggregate)) {
    throw new InvalidParameterError(`Invalid aggregation ${aggregate}`);
  }
}

function getAggregateField({
  aggregateField, schemaRelationship, schema,
}) {
  // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
  const fieldName = aggregateField
    || schemaRelationship.primaryKeys[0]
    || schemaRelationship.fields[0].field;
  return Orm.getColumnName(schema, fieldName);
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
  /** @type {import('sequelize').Association} */
  const associationFound = _.find(
    modelRelationship.associations,
    (association) => association.target.name === model.name,
  );

  const aggregateField = getAggregateField({
    aggregateField: params.aggregate_field,
    schema,
    schemaRelationship,
  });

  if (!associationFound) {
    throw new InvalidParameterError(`Association ${model.name} not found`);
  }

  if (associationFound.as) {
    associationAs = associationFound.as;
  }

  assertThatFieldExists(associationFound.target, labelField);
  assertSupportedAggregation(aggregate);
  assertThatFieldExists(modelRelationship, aggregateField);

  const groupBy = `"${associationAs}"."${labelField}"`;


  let joinQuery;
  if (associationFound.associationType === 'BelongsToMany') {
    const joinTableName = associationFound.through.model.tableName;
    joinQuery = `INNER JOIN "${joinTableName}"
        ON "${modelRelationship.tableName}"."${associationFound.sourceKeyField}" = "${joinTableName}"."${associationFound.foreignKey}"
      INNER JOIN "${model.tableName}" AS "${associationAs}"
        ON "${associationAs}"."${associationFound.targetKeyField}" = "${joinTableName}"."${associationFound.otherKey}"
    `;
  } else {
    const foreignKeyField = associationFound.source
      .rawAttributes[associationFound.foreignKey].field;
    joinQuery = `INNER JOIN "${model.tableName}" AS "${associationAs}"
        ON "${associationAs}"."${associationFound.targetKeyField}" = "${modelRelationship.tableName}"."${foreignKeyField}"
    `;
  }

  const query = `
    SELECT ${aggregate}("${modelRelationship.tableName}"."${aggregateField}") AS "value"
      , ${groupBy} as "key"
    FROM "${modelRelationship.tableName}"
    ${joinQuery}
    GROUP BY ${groupBy}
    ORDER BY "value" DESC
    LIMIT :limit
  `;

  this.perform = async () => options.connections[0].query(query, {
    type: model.sequelize.QueryTypes.SELECT,
    replacements: {
      limit,
    },
  })
    .then((records) => ({ value: records }));
}

module.exports = LeaderboardStatGetter;
