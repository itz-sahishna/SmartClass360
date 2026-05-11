/**
 * First-time database setup for empty Postgres (e.g. new Render DB).
 *
 * Reads `schema.sql`, removes every `DROP TABLE …` line (never run those in
 * production), then runs the remaining DDL in a single transaction.
 *
 * Idempotent: if `public.users` already exists, does nothing.
 * Set SKIP_AUTO_SCHEMA_INIT=true to disable.
 */
const fs = require("fs");
const path = require("path");
const { pool } = require("../src/db");

function stripDropTableStatements(sqlText) {
  return sqlText
    .split(/\r?\n/)
    .filter((line) => !/^\s*DROP TABLE IF EXISTS\b/i.test(line))
    .join("\n")
    .trim();
}

async function publicUsersTableExists(client) {
  const { rows } = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'users'
     ) AS ok`
  );
  return Boolean(rows[0]?.ok);
}

async function ensureDatabaseSchema() {
  if (process.env.SKIP_AUTO_SCHEMA_INIT === "true") {
    console.log("[schema] SKIP_AUTO_SCHEMA_INIT=true — skipping auto schema");
    return;
  }

  const schemaPath = path.join(__dirname, "schema.sql");
  const client = await pool.connect();

  try {
    if (await publicUsersTableExists(client)) {
      return;
    }

    const raw = fs.readFileSync(schemaPath, "utf8");
    const ddl = stripDropTableStatements(raw);
    if (!ddl) {
      throw new Error("schema.sql is empty after stripping DROP statements");
    }

    console.log(
      "[schema] public.users not found — applying schema.sql (DROP lines omitted, single transaction)"
    );

    await client.query("BEGIN");
    await client.query(ddl);
    await client.query("COMMIT");
    console.log("[schema] Schema initialization finished.");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  ensureDatabaseSchema()
    .then(() => {
      console.log("[schema] Done");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[schema] Failed:", err);
      process.exit(1);
    });
}

module.exports = {
  ensureDatabaseSchema,
};
