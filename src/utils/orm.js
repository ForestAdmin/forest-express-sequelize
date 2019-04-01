const semver = require('semver');

const REGEX_VERSION = /(\d+\.)?(\d+\.)?(\*|\d+)/;

const getVersion = (sequelize) => {
  const version = sequelize.version.match(REGEX_VERSION);
  if (version && version[0]) {
    return version[0];
  }
  return null;
};

const isVersionLessThan4 = (sequelize) => {
  try {
    return semver.lt(getVersion(sequelize), '4.0.0');
  } catch (error) {
    return true;
  }
};

exports.getVersion = getVersion;
exports.isVersionLessThan4 = isVersionLessThan4;
