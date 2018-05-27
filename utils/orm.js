'use strict';
var semver = require('semver');

var REGEX_VERSION = /(\d+\.)?(\d+\.)?(\*|\d+)/;

var getVersion = function (sequelize) {
  var version = sequelize.version.match(REGEX_VERSION);
  if (version && version[0]) {
    return version[0];
  }
  return null;
};

var isVersionLessThan4 = function (sequelize) {
  try {
    return semver.lt(getVersion(sequelize), '4.0.0');
  } catch (error) {
    return true;
  }
};

exports.getVersion = getVersion;
exports.isVersionLessThan4 = isVersionLessThan4;
