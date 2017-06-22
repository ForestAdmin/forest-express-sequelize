'use strict';

function optionsInvalid(options) {
  return !(options && options.sequelize && options.sequelize.options &&
    options.sequelize.options.dialect);
}

exports.isMySQL = function(options) {
  if (optionsInvalid(options)) { return false; }
  return ['mysql', 'mariadb'].indexOf(options.sequelize.options.dialect) > -1;
};

exports.isMSSQL = function(options) {
  if (optionsInvalid(options)) { return false; }
  return options.sequelize.options.dialect === 'mssql';
};
