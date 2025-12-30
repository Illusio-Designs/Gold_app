const { db } = require('../config/db');

/**
 * Execute a database query with timeout and error handling
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise} - Promise that resolves with results or rejects with error
 */
const executeQuery = (query, params = [], timeout = 10000) => {
  return new Promise((resolve, reject) => {
    // Set a timeout for the query
    const queryTimeout = setTimeout(() => {
      reject(new Error('Database query timeout'));
    }, timeout);

    db.query(query, params, (err, results) => {
      clearTimeout(queryTimeout);
      
      if (err) {
        // Handle specific database errors
        if (err.code === 'ETIMEDOUT') {
          reject(new Error('Database connection timeout. Please try again.'));
        } else if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          reject(new Error('Database connection lost. Please try again.'));
        } else if (err.code === 'ER_CON_COUNT_ERROR') {
          reject(new Error('Too many database connections. Please try again.'));
        } else {
          reject(new Error(`Database error: ${err.message}`));
        }
      } else {
        resolve(results);
      }
    });
  });
};

/**
 * Check if database is connected
 * @returns {Promise<boolean>} - True if connected, false otherwise
 */
const checkConnection = () => {
  return new Promise((resolve) => {
    db.getConnection((err, connection) => {
      if (err) {
        resolve(false);
        return;
      }
      
      connection.ping((pingErr) => {
        connection.release();
        if (pingErr) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  });
};

module.exports = {
  executeQuery,
  checkConnection
}; 