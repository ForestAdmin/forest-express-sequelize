import Orm from './orm';
import ObjectTools from './object-tools';

exports.getReferenceSchema = (schemas, modelSchema, associationName) => {
  const schemaField = modelSchema.fields.find((field) => field.field === associationName);

  // NOTICE: No reference field found, no name transformation tried.
  if (!schemaField || !schemaField.reference) { return null; }

  const [tableName] = schemaField.reference.split('.');
  return schemas[tableName];
};

exports.getReferenceField = (schemas, modelSchema, associationName, fieldName) => {
  const associationSchema = exports.getReferenceSchema(
    schemas, modelSchema, associationName, fieldName,
  );

  // NOTICE: No association schema found, no name transformation tried.
  if (!associationSchema) { return `${associationName}.${fieldName}`; }

  const belongsToColumnName = Orm.getColumnName(associationSchema, fieldName);
  return `${associationName}.${belongsToColumnName}`;
};

/**
 * When they don't have common keys, merge two objects together.
 * This is used to avoid having too many nested 'AND' conditions on sequelize queries, which
 * makes debugging and testing more painful than it could be.
 */
const mergeWhere = (operators, ...wheres) => wheres.reduce((where1, where2) => {
  if (!where1) { return where2; }
  if (!where2) { return where1; }

  return ObjectTools.plainObjectsShareNoKeys(where1, where2)
    ? { ...where1, ...where2 }
    : { [operators.AND]: [where1, where2] };
});

exports.mergeWhere = mergeWhere;

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
const bubbleWheresInPlace = (operators, options) => {
  const parentInclude = options.include ?? [];

  parentInclude.forEach((include) => {
    bubbleWheresInPlace(operators, include);

    if (include.where) {
      const newWhere = ObjectTools.mapKeysDeep(include.where, (key) => (
        key[0] === '$' && key[key.length - 1] === '$'
          ? `$${include.as}.${key.substring(1)}`
          : `$${include.as}.${key}$`
      ));

      options.where = mergeWhere(operators, options.where, newWhere);
      delete include.where;
    }
  });

  return options;
};

exports.bubbleWheresInPlace = bubbleWheresInPlace;
