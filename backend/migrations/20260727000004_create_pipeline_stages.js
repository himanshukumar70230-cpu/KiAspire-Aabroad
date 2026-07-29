exports.up = function (knex) {
  return knex.schema.createTable("pipeline_stages", (table) => {
    table.increments("id").primary();
    table
      .enu(
        "phase",
        [
          "lead",
          "profile_planning",
          "application_process",
          "visa",
          "post_arrival",
        ],
        { useNative: false }
      )
      .notNullable();
    table.text("code").notNullable().unique();
    table.text("label").notNullable();
    table.text("student_label").notNullable();
    table.integer("sort_order").notNullable().unique();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("pipeline_stages");
};
