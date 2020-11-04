const Sequelize = require('sequelize');

class ConnectionManager {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.databaseOptions = {
      logging: false,
      pool: { maxConnections: 10, minConnections: 1 },
    };
    this.connection = null;
  }

  getDialect() {
    return this.connection && this.connection.options && this.connection.options.dialect;
  }

  getPort() {
    return this.connection && this.connection.options && this.connection.options.port;
  }

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

module.exports = {
  sequelizePostgres: new ConnectionManager('postgres://forest:secret@localhost:5436/forest-express-sequelize-test'),
  sequelizeMySQLMin: new ConnectionManager('mysql://forest:secret@localhost:8998/forest-express-sequelize-test'),
  sequelizeMySQLMax: new ConnectionManager('mysql://forest:secret@localhost:8999/forest-express-sequelize-test'),
};
