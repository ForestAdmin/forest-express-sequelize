const HAS_ONE = 'HasOne';
const BELONGS_TO = 'BelongsTo';

/**
 * @param {string[]} values
 * @returns {string[]}
 */
function uniqueValues(values) {
  return Array.from(new Set(values));
}

/**
 * @param {string} key
 * @param {import('sequelize').Association} association
 * @returns {string}
 */
function getTargetFieldName(key, association) {
  // Defensive programming
  if (key && association.target.tableAttributes[key]) {
    return association.target.tableAttributes[key].fieldName;
  }

  return undefined;
}

/**
 * @param {import('sequelize').HasOne|import('sequelize').BelongsTo} association
 * @returns {string[]}
 */
function getMandatoryFields(association) {
  return association.target.primaryKeyAttributes
    .map((attribute) => getTargetFieldName(attribute, association));
}

/**
 * Compute "includes" parameter which is expected by sequelize from a list of fields.
 * The list of fields can contain fields from relations in the form 'author.firstname'
 *
 * @param {string[]} fieldNames model and relationship field names
 */
function QueryBuilder() {
  this.getIncludes = (modelForIncludes, fieldNamesRequested) => {
    const includes = [];

    Object.values(modelForIncludes.associations)
      .filter((association) => [HAS_ONE, BELONGS_TO].includes(association.associationType))
      .forEach((association) => {
        const targetFields = Object.values(association.target.tableAttributes)
          .map((attribute) => attribute.fieldName);

        const explicitAttributes = (fieldNamesRequested || [])
          .filter((name) => name.startsWith(`${association.as}.`))
          .map((name) => name.replace(`${association.as}.`, ''))
          .filter((fieldName) => targetFields.includes(fieldName));

        if (!fieldNamesRequested
        || fieldNamesRequested.includes(association.as)
        || explicitAttributes.length) {
          // NOTICE: For performance reasons, we only request the keys
          //         as they're the only needed fields for the interface
          const uniqueExplicitAttributes = uniqueValues([
            ...getMandatoryFields(association),
            ...explicitAttributes,
          ].filter(Boolean));

          const attributes = explicitAttributes.length
            ? uniqueExplicitAttributes
            : undefined;

          includes.push({
            model: association.target.unscoped(),
            as: association.associationAccessor,
            attributes,
          });
        }
      });

    return includes;
  };
}

module.exports = QueryBuilder;
