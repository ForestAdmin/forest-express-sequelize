const { SchemaUtils } = require('forest-express');

const semver = require('semver');

const REGEX_VERSION = /(\d+\.)?(\d+\.)?(\*|\d+)/;

const getVersion = (sequelize) => {
  const version = sequelize.version.match(REGEX_VERSION);
  if (version && version[0]) {
    return version[0];
  }
  return null;
};

const isVersionLessThan = (sequelize, target) => {
  try {
    return semver.lt(getVersion(sequelize), target);
  } catch (error) {
    return true;
  }
};

const findRecord = (model, recordId, options) => {
  if (model.findByPk) {
    return model.findByPk(recordId, options);
  }
  return model.findById(recordId, options);
};

const getColumnName = (schema, fieldName) => {
  const schemaField = SchemaUtils.getField(schema, fieldName);
  return (schemaField && schemaField.columnName) ? schemaField.columnName : fieldName;
};

const isUUID = (DataTypes, fieldType) =>
  fieldType instanceof DataTypes.UUID
    || fieldType instanceof DataTypes.UUIDV1
    || fieldType instanceof DataTypes.UUIDV4;

exports.getVersion = getVersion;
exports.isVersionLessThan = isVersionLessThan;
exports.findRecord = findRecord;
exports.getColumnName = getColumnName;
exports.isUUID = isUUID;
