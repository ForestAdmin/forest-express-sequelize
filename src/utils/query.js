import Orm from './orm';

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
