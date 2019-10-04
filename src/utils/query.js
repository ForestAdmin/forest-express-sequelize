import Orm from './orm';

exports.getReferenceField = (schemas, modelSchema, associationName, fieldName) => {
  function getDefaultValue() { return `${associationName}.${fieldName}`; }

  const schemaField = modelSchema.fields.find(field => field.field === associationName);

  // NOTICE: No reference field found, no name transformation tried.
  if (!schemaField || !schemaField.reference) { return getDefaultValue(); }

  const [tableName] = schemaField.reference.split('.');
  const associationSchema = schemas[tableName];

  // NOTICE: No association schema found, no name transformation tried.
  if (!associationSchema) { return getDefaultValue(); }

  const belongsToColumnName = Orm.getColumnName(associationSchema, fieldName);
  return `${associationName}.${belongsToColumnName}`;
};
