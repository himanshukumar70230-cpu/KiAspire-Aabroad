// Not one of the 8 tables enumerated in ARCHITECTURE.md — that doc's list
// covered only the newly-designed features and missed carrying over the
// pre-existing Story feature. Added here so the full DB cutover has
// somewhere for it to live; shape mirrors the previous Mongoose StoryModel.
exports.up = function (knex) {
  return knex.schema.createTable("stories", (table) => {
    table.increments("id").primary();
    table.text("student_name").notNullable();
    table.text("country").notNullable();
    table.text("university").notNullable();
    table.text("course").notNullable();
    table.text("title").notNullable();
    table.text("description").notNullable().defaultTo("");
    table.text("youtube_url").notNullable();
    table.text("thumbnail").notNullable().defaultTo("");
    table.boolean("is_featured").notNullable().defaultTo(false);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.integer("sort_order").notNullable().defaultTo(0);
    table
      .uuid("created_by")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("stories");
};
