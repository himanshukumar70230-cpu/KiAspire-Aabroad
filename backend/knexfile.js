require("dotenv").config();

// Single config, driven entirely by env vars — dev and production both just
// set DATABASE_URL differently. No separate "environments" block, since this
// app only ever runs as one process against one database at a time.
module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 0, max: 10 },
  migrations: {
    directory: "./migrations",
    tableName: "knex_migrations",
  },
  seeds: {
    directory: "./seeds",
  },
};
