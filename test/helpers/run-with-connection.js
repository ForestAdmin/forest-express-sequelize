/**
 * @param {import("../databases").ConnectionManager} connectionManager
 * @param {(connection: import("sequelize").Sequelize) => Promise<void>} testCallback
 */
async function runWithConnection(connectionManager, testCallback) {
  try {
    await testCallback(connectionManager.createConnection());
  } finally {
    connectionManager.closeConnection();
  }
}

module.exports = runWithConnection;
