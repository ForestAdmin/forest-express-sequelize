import Orm from './orm';
import Recursion from './recursion';

exports.getReferenceSchema = (schemas, modelSchema, associationName) => {
  const schemaField = modelSchema.fields.find((field) => field.field === associationName);

  // NOTICE: No reference field found, no name transformation tried.
  if (!schemaField || !schemaField.reference) { return null; }

  const [tableName] = schemaField.reference.split('.');
  return schemas[tableName];
};

exports.getReferenceField = (schemas, modelSchema, associationName, fieldName) => {
  function getDefaultValue() { return `${associationName}.${fieldName}`; }

  const associationSchema = exports.getReferenceSchema(
    schemas, modelSchema, associationName, fieldName,
  );

  // NOTICE: No association schema found, no name transformation tried.
  if (!associationSchema) { return getDefaultValue(); }

  const belongsToColumnName = Orm.getColumnName(associationSchema, fieldName);
  return `${associationName}.${belongsToColumnName}`;
};

/**
* Extract all where conditions along the include tree, and bubbles them up to the top.
* This allows to work around a sequelize quirk that cause nested 'where' to fail when they
* refer to relation fields from an intermediary include (ie '$book.id$').
*
* This happens when forest admin filters on relations are used.
*
* @see https://sequelize.org/master/manual/eager-loading.html#complex-where-clauses-at-the-top-level
* @see https://github.com/ForestAdmin/forest-express-sequelize/blob/7d7ad0/src/services/filters-parser.js#L104
*/
const bubbleWheresInPlace = (options, operators) => {
  (options.include ?? []).forEach((include) => {
    bubbleWheresInPlace(include, operators);

    const newWhere = Recursion.mapKeysDeep(include.where, (key) => (
      key[0] === '$' && key[key.length - 1] === '$'
        ? `$${include.as}.${key.substring(1)}`
        : `$${include.as}.${key}$`
    ));

    delete include.where;
    if (newWhere) {
      options.where = { [operators.AND]: [options.where, newWhere] };
    }
  });
};

exports.bubbleWheresInPlace = bubbleWheresInPlace;
