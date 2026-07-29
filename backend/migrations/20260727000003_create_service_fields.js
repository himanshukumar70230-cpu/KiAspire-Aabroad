exports.up = function (knex) {
  return knex.schema.createTable("service_fields", (table) => {
    table.increments("id").primary();
    table
      .integer("service_id")
      .notNullable()
      .references("id")
      .inTable("services")
      .onDelete("CASCADE");
    table.text("field_key").notNullable();
    table.text("label").notNullable();
    table
      .enu(
        "field_type",
        ["text", "textarea", "number", "date", "select", "radio", "checkbox"],
        { useNative: false }
      )
      .notNullable();
    // allow_multiple + is_ordered together model "ranked/ordered list"
    // fields (e.g. preferred universities) without a bespoke field type.
    table.boolean("allow_multiple").notNullable().defaultTo(false);
    table.boolean("is_ordered").notNullable().defaultTo(false);
    table.jsonb("options").nullable();
    table.boolean("is_required").notNullable().defaultTo(false);
    table.text("placeholder").nullable();
    table.text("help_text").nullable();
    table.integer("sort_order").notNullable().defaultTo(0);
    // Soft delete: keeps historical applications' field_values renderable
    // even after admin retires a field. See ARCHITECTURE.md section 1.
    table.timestamp("deleted_at", { useTz: true }).nullable();
    table.timestamps(true, true);

    table.unique(["service_id", "field_key"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("service_fields");
};
