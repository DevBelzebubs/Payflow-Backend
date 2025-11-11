const sql = require("mssql");
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "payflow",
  port: parseInt(process.env.DB_PORT || "1433"),

  authentication: {
    type: "default",
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
  },

  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true" || true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

const getPool = async () => {
  if (!pool) {
    try {
      console.log(
        `Attempting to connect to ${config.server} as ${config.authentication.options.userName}...`
      );
      pool = await sql.connect(config);
      console.log("Successfully connected to SQL Server.");
    } catch (err) {
      console.error("Database connection failed:", err);
      throw err;
    }
  }
  return pool;
};

const closePool = async () => {
  if (pool) {
    await pool.close();
    pool = null;
    console.log("Database connection pool closed.");
  }
};

module.exports = {
  sql,
  getPool,
  closePool,
  config,
};
