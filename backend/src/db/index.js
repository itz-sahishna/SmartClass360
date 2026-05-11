const { Pool } = require("pg");
require("dotenv").config();

const debugEndpoint = "http://127.0.0.1:7586/ingest/52c81873-b59d-4be5-b957-ad89573d8c54";
const sendDebugLog = (payload) => {
  // #region agent log
  fetch(debugEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "667dd8",
    },
    body: JSON.stringify({
      sessionId: "667dd8",
      runId: "pre-fix",
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT || 5432),
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

sendDebugLog({
  hypothesisId: "H1",
  location: "backend/src/db/index.js:31",
  message: "Database configuration mode selected",
  data: {
    usingDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasPgHost: Boolean(process.env.PG_HOST),
    hasPgDatabase: Boolean(process.env.PG_DATABASE),
  },
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction,
};
