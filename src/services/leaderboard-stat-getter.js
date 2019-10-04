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

  _.each(modelRelationship.associations, (association) => {
    if (association.target.name === model.name && association.as) {
      associationAs = association.as;
    }
  });

  const groupBy = `${associationAs}.${labelField}`;

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
    const fieldName = aggregateField || schemaRelationship.primaryKeys[0] ||
      schemaRelationship.fields[0].field;
    return `${schemaRelationship.name}.${Orm.getColumnName(schema, fieldName)}`;
  }

  this.perform = () => modelRelationship
    .unscoped()
    .findAll({
      attributes: [
        [options.sequelize.fn(aggregate, options.sequelize.col(getAggregateField())), 'value'],
      ],
      include: [{
        model,
        attributes: [labelField],
        as: associationAs,
        required: true,
      }],
      group: groupBy,
      order: [[options.sequelize.literal('value'), 'DESC']],
      limit,
      raw: true,
    })
    .then((records) => {
      records = records.map((data) => {
        data.key = data[groupBy];
        delete data[groupBy];
        return data;
      });

      return { value: records };
    });
}

module.exports = LeaderboardStatGetter;
