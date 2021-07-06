import ObjectTools from './object-tools';
import Orm from './orm';

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
 * When they don't have common keys, merge objects together.
 * This is used to avoid having too many nested 'AND' conditions on sequelize queries, which
 * makes debugging and testing more painful than it could be.
 */
exports.mergeWhere = (operators, ...wheres) => wheres
  .filter(Boolean)
  .reduce((where1, where2) => (ObjectTools.plainObjectsShareNoKeys(where1, where2)
    ? { ...where1, ...where2 }
    : { [operators.AND]: [where1, where2] }));
