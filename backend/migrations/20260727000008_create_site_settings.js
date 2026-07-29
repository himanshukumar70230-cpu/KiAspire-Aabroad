exports.up = function (knex) {
  return knex.schema.createTable("site_settings", (table) => {
    table.text("key").primary();
    table.text("value").notNullable();
    table.text("label").notNullable().defaultTo("");
    table
      .timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("site_settings");
};
