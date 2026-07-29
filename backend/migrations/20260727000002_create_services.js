exports.up = function (knex) {
  return knex.schema.createTable("services", (table) => {
    table.increments("id").primary();
    table.text("name").notNullable().unique();
    table.text("slug").notNullable().unique();
    table.text("description").notNullable().defaultTo("");
    table.text("icon").notNullable().defaultTo("");
    // "external_redirect" services (Book a Consultation) skip the dynamic
    // field form and send the student to redirect_url instead.
    table
      .enu("kind", ["form", "external_redirect"], { useNative: false })
      .notNullable()
      .defaultTo("form");
    table.text("redirect_url").nullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.integer("sort_order").notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("services");
};
