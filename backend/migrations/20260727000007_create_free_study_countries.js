exports.up = function (knex) {
  return knex.schema.createTable("free_study_countries", (table) => {
    table.increments("id").primary();
    table.text("country_name").notNullable();
    table.text("country_slug").notNullable().unique();
    table.text("summary").notNullable().defaultTo("");
    // Authored as Markdown, rendered + sanitized at request time.
    // See ARCHITECTURE.md section 4a.
    table.text("content_markdown").notNullable().defaultTo("");
    table.text("hero_image_url").nullable();
    table.boolean("is_published").notNullable().defaultTo(false);
    table.integer("sort_order").notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("free_study_countries");
};
