
/**
 * @param {Record<string, string>} fields
 * @param {*} modelOrAssociation
 * @returns {string[]}
 */
function extractRequestedFields(fields, modelOrAssociation) {
  if (!fields || !fields[modelOrAssociation.name]) { return null; }

  // NOTICE: Force the primaryKey retrieval to store the records properly in
  //         the client.
  const primaryKeyArray = [Object.keys(modelOrAssociation.primaryKeys)[0]];

  const allAssociationFields = Object.keys(modelOrAssociation.associations)
    // NOTICE: Remove fields for which attributes are not explicitely set
    //         in the requested fields
    .filter((associationName) => fields[associationName])
    .map((associationName) => {
      const associationFields = fields[associationName].split(',');
      return associationFields.map((fieldName) => `${associationName}.${fieldName}`);
    })
    .flat();

  const modelFields = fields[modelOrAssociation.name].split(',')
    .filter((fieldName) => !fields[fieldName]);

  return Array.from(new Set([
    ...primaryKeyArray,
    ...modelFields,
    ...allAssociationFields,
  ]));
}


module.exports = extractRequestedFields;
