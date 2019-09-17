import { Schemas } from 'forest-express';
import Orm from './orm';

exports.getReferenceField = (schema, associationName, fieldName) => {
  const schemaField = schema.fields.find(field => field.field === associationName);
  const [tableName] = schemaField.reference.split('.');
  const associationSchema = Schemas.schemas[tableName];
  const belongsToColumnName = Orm.getColumnName(associationSchema, fieldName);
  return `${associationName}.${belongsToColumnName}`;
};
