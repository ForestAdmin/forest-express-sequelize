function getConnectionDialect(connection) {
  return connection.options.dialect;
}

exports.isMySQL = (connection) => ['mysql', 'mariadb'].includes(getConnectionDialect(connection));

exports.isMSSQL = (connection) => getConnectionDialect(connection) === 'mssql';

exports.isSQLite = (connection) => getConnectionDialect(connection) === 'sqlite';
