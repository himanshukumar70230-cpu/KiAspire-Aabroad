exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
    table.uuid("id").primary();
    table.text("name").notNullable();
    table.text("email").notNullable().unique();
    table.text("phone").notNullable().unique();
    // Nullable: a consultation "lead" has no password until they complete
    // a full registration. See ARCHITECTURE.md section 2.
    table.text("password_hash").nullable();
    table
      .enu("role", ["student", "counsellor", "admin"], { useNative: false })
      .notNullable()
      .defaultTo("student");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("last_login", { useTz: true }).nullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("users");
};
