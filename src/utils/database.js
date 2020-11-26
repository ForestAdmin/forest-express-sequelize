function getConnectionDialect(options) {
  const connection = Object.values(options.connections)[0];
  return connection.options.dialect;
}

exports.isMySQL = (options) => ['mysql', 'mariadb'].includes(getConnectionDialect(options));

exports.isMSSQL = (options) => getConnectionDialect(options) === 'mssql';

exports.isSQLite = (options) => getConnectionDialect(options) === 'sqlite';
