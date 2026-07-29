exports.up = function (knex) {
  return knex.schema.createTable("applications", (table) => {
    table.uuid("id").primary();
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("service_id")
      .notNullable()
      .references("id")
      .inTable("services")
      .onDelete("RESTRICT");
    // Submitted dynamic answers keyed by service_fields.field_key.
    // See ARCHITECTURE.md section 3 for why this is JSONB, not an EAV table.
    table.jsonb("field_values").nullable();
    table
      .integer("current_stage_id")
      .notNullable()
      .references("id")
      .inTable("pipeline_stages")
      .onDelete("RESTRICT");
    table
      .timestamp("current_stage_since", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.boolean("is_closed").notNullable().defaultTo(false);
    table.text("closed_reason").nullable();
    table.timestamp("closed_at", { useTz: true }).nullable();
    table.timestamps(true, true);

    table.index(["user_id"]);
    table.index(["service_id"]);
    table.index(["current_stage_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("applications");
};
