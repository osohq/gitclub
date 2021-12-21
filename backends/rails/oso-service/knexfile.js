// Update with your config settings.

module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./dev.sqlite3",
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
  test: {
    client: "sqlite3",
    connection: {
      filename: "./test.sqlite3",
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
  production: {
    client: "sqlite3",
    connection: {
      filename: "./production.sqlite3",
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
};
