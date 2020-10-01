import _ from 'lodash';
import { Schemas } from 'forest-express';
import Orm from '../utils/orm';

function LeaderboardStatGetter(model, modelRelationship, params, options) {
  const labelField = params.label_field;
  const aggregate = params.aggregate.toUpperCase();
  const aggregateField = params.aggregate_field;
  const { limit } = params;
  const schema = Schemas.schemas[model.name];
  const schemaRelationship = Schemas.schemas[modelRelationship.name];
  let associationAs = schema.name;
  const associationFound = _.find(
    modelRelationship.associations,
    (association) => association.target.name === model.name,
  );

  if (associationFound && associationFound.as) {
    associationAs = associationFound.as;
  }

  const groupBy = `${associationAs}.${labelField}`;

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
    const fieldName = aggregateField
      || schemaRelationship.primaryKeys[0]
      || schemaRelationship.fields[0].field;
    return `"${modelRelationship.tableName}"."${Orm.getColumnName(schema, fieldName)}"`;
  }

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
    SELECT ${aggregate}(${getAggregateField()}) as "value", ${groupBy} as "key"
    FROM "${modelRelationship.tableName}"
    ${joinQuery}
    GROUP BY ${groupBy}
    ORDER BY "value" DESC
    LIMIT ${limit}
  `;


  this.perform = () => options.connections[0].query(query, {
    type: model.sequelize.QueryTypes.SELECT,
  })
    .then((records) => ({ value: records }));
}

module.exports = LeaderboardStatGetter;
