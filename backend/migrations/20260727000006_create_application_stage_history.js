exports.up = function (knex) {
  return knex.schema.createTable("application_stage_history", (table) => {
    table.increments("id").primary();
    table
      .uuid("application_id")
      .notNullable()
      .references("id")
      .inTable("applications")
      .onDelete("CASCADE");
    table
      .integer("stage_id")
      .notNullable()
      .references("id")
      .inTable("pipeline_stages")
      .onDelete("RESTRICT");
    table.text("note").nullable();
    table
      .uuid("changed_by")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT");
    table
      .timestamp("changed_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.index(["application_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("application_stage_history");
};
