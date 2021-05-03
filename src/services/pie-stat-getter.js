import { Schemas } from 'forest-express';
import _ from 'lodash';
import moment from 'moment';
import { isMSSQL } from '../utils/database';
import Orm, { isVersionLessThan4 } from '../utils/orm';
import QueryOptions from './query-options';

// NOTICE: These aliases are not camelcased to prevent issues with Sequelize.
const ALIAS_GROUP_BY = 'forest_alias_groupby';
const ALIAS_AGGREGATE = 'forest_alias_aggregate';

function PieStatGetter(model, params, options) {
  const needsDateOnlyFormating = isVersionLessThan4(options.Sequelize);

  const schema = Schemas.schemas[model.name];
  let associationSplit;
  let associationCollection;
  let associationField;
  let associationSchema;
  let field;

  if (params.group_by_field.indexOf(':') === -1) {
    field = _.find(schema.fields, (currentField) => currentField.field === params.group_by_field);
  } else {
    associationSplit = params.group_by_field.split(':');
    associationCollection = model.associations[associationSplit[0]].target.name;
    [, associationField] = associationSplit;
    associationSchema = Schemas.schemas[associationCollection];
    field = _.find(
      associationSchema.fields,
      (currentField) => currentField.field === associationField,
    );
  }

  function getGroupByField() {
    if (params.group_by_field.includes(':')) {
      const [associationName, fieldName] = params.group_by_field.split(':');
      return `${associationName}.${Orm.getColumnName(associationSchema, fieldName)}`;
    }
    return `${schema.name}.${Orm.getColumnName(schema, params.group_by_field)}`;
  }

  const groupByField = getGroupByField();

  function getAggregate() {
    return params.aggregate.toLowerCase();
  }

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
    const fieldName = params.aggregate_field
      || schema.primaryKeys[0]
      || schema.fields[0].field;
    return `${schema.name}.${Orm.getColumnName(schema, fieldName)}`;
  }

  function getGroupBy() {
    return isMSSQL(model.sequelize) ? [options.Sequelize.col(groupByField)] : [ALIAS_GROUP_BY];
  }

  function formatResults(records) {
    return records.map((record) => {
      let key;

      if (field.type === 'Date') {
        key = moment(record[ALIAS_GROUP_BY]).format('DD/MM/YYYY HH:mm:ss');
      } else if (field.type === 'Dateonly' && needsDateOnlyFormating) {
        const offsetServer = moment().utcOffset() / 60;
        const dateonly = moment.utc(record[ALIAS_GROUP_BY])
          .add(offsetServer, 'h');
        key = dateonly.format('DD/MM/YYYY');
      } else {
        key = String(record[ALIAS_GROUP_BY]);
      }

      return {
        key,
        value: record[ALIAS_AGGREGATE],
      };
    });
  }

  this.perform = async () => {
    const { filters, timezone } = params;
    const queryOptions = new QueryOptions(model, { includeRelations: true });
    await queryOptions.filterByConditionTree(filters, timezone);

    const { include, where } = queryOptions.sequelizeOptions;
    const records = await model.unscoped().findAll({
      include: include ? include.map((i) => ({ ...i, attributes: [] })) : undefined,
      where,
      attributes: [
        [
          options.Sequelize.col(groupByField),
          ALIAS_GROUP_BY,
        ],
        [
          options.Sequelize.fn(
            getAggregate(),
            options.Sequelize.col(getAggregateField()),
          ),
          ALIAS_AGGREGATE,
        ],
      ],
      group: getGroupBy(),
      order: [[options.Sequelize.literal(ALIAS_AGGREGATE), 'DESC']],
      raw: true,
    });

    return { value: formatResults(records) };
  };
}

module.exports = PieStatGetter;
