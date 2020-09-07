/**
 * @typedef {{
 *  fields: Array<{
 *    field: string;
 *    isVirtual: boolean;
 *  }>
 * }} Schema
 */

/**
 * @param {string} associationName
 * @param {string[]} requestedFields
 * @param {Schema} schema
 * @returns {string[]}
 */
function extractRequestedFieldsForAssociation(associationName, requestedFields, schema) {
  const referencesSmartFields = requestedFields.some(
    (fieldName) => schema.fields.some((field) => field.field === fieldName && field.isVirtual),
  );

  // TODO: have a way of specifying which actual field is used for the computation of a smart field
  //       and use that info to only retrieve fields that are needed
  if (referencesSmartFields) {
    return [`${associationName}`];
  }

  return requestedFields.map((fieldName) => `${associationName}.${fieldName}`);
}

/**
 * @param {Record<string, string>} requestedFields
 * @param {*} modelOrAssociation
 * @param {{
 *  [collection: string]: Schema
 * }} schemas
 * @returns {string[]}
 */
function extractRequestedFields(requestedFields, modelOrAssociation, schemas) {
  if (!requestedFields || !requestedFields[modelOrAssociation.name]) { return null; }

  // NOTICE: Force the primaryKey retrieval to store the records properly in
  //         the client.
  const primaryKeyArray = [Object.keys(modelOrAssociation.primaryKeys)[0]];

  const allAssociationFields = Object.keys(modelOrAssociation.associations)
    // NOTICE: Remove fields for which attributes are not explicitly set
    //         in the requested fields
    .filter((associationName) => requestedFields[associationName])
    .map((associationName) => extractRequestedFieldsForAssociation(
      associationName,
      requestedFields && requestedFields[associationName]
        ? requestedFields[associationName].split(',')
        : [],
      schemas[modelOrAssociation.associations[associationName].target.name],
    ))
    .flat();

  const modelFields = requestedFields[modelOrAssociation.name].split(',')
    .filter((fieldName) => !requestedFields[fieldName]);

  return Array.from(new Set([
    ...primaryKeyArray,
    ...modelFields,
    ...allAssociationFields,
  ]));
}

module.exports = extractRequestedFields;
