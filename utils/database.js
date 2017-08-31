'use strict';

function optionsInvalid(options) {
  return !(options && options.connections && options.connections[0] &&
    options.connections[0].options && options.connections[0].options.dialect);
}

exports.isMySQL = function(options) {
  if (optionsInvalid(options)) { return false; }
  return ['mysql', 'mariadb'].indexOf(options.connections[0].options.dialect) > -1;
};

exports.isMSSQL = function(options) {
  if (optionsInvalid(options)) { return false; }
  return options.connections[0].options.dialect === 'mssql';
};
