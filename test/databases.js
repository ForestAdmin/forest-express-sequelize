const Sequelize = require('sequelize');

const databaseOptions = {
  logging: false,
  pool: { maxConnections: 10, minConnections: 1 },
};

const sequelizePostgres = new Sequelize(
  'postgres://forest:secret@localhost:5436/forest-express-sequelize-test',
  databaseOptions,
);

const sequelizeMySQLMin = new Sequelize(
  'mysql://forest:secret@localhost:8998/forest-express-sequelize-test',
  databaseOptions,
);

const sequelizeMySQLMax = new Sequelize(
  'mysql://forest:secret@localhost:8999/forest-express-sequelize-test',
  databaseOptions,
);

module.exports = {
  sequelizePostgres,
  sequelizeMySQLMin,
  sequelizeMySQLMax,
};
