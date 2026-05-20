require('dotenv').config();

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Validate database connectivity during boot so deployment failures are visible immediately.
    const connection = await pool.getConnection();
    connection.release();

    app.listen(PORT, () => {
      console.log(`Executive Dashboard API is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
