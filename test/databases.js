const Sequelize = require('sequelize');

/** @typedef {ConnectionManager} ConnectionManager */
class ConnectionManager {
  constructor(dialect, connectionString) {
    this.dialect = dialect;
    this.connectionString = connectionString;
    this.databaseOptions = {
      logging: false,
      pool: { maxConnections: 10, minConnections: 1 },
    };
    this.connection = null;
  }

  getDialect() {
    return this.dialect;
  }

  getPort() {
    return /:(\d+)\//g.exec(this.connectionString)[1];
  }

  /**
   * @returns {import('sequelize').Sequelize}
   */
  createConnection() {
    if (!this.connection) {
      this.connection = new Sequelize(this.connectionString, this.databaseOptions);
    }
    return this.connection;
  }

  closeConnection() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }
}

/**
 * @type {Record<string, ConnectionManager>}
 */
module.exports = {
  sequelizePostgres: new ConnectionManager('Postgresql 9.4', 'postgres://forest:secret@localhost:5436/forest-express-sequelize-test'),
  sequelizeMySQLMin: new ConnectionManager('MySQL 5.6', 'mysql://forest:secret@localhost:8998/forest-express-sequelize-test'),
  sequelizeMySQLMax: new ConnectionManager('MySQL 8.0', 'mysql://forest:secret@localhost:8999/forest-express-sequelize-test'),
};
