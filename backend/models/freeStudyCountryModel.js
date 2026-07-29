const db = require("../db/knex");

const TABLE = "free_study_countries";

function findPublished() {
  return db(TABLE).where({ is_published: true }).orderBy("sort_order");
}

function findPublishedBySlug(slug) {
  return db(TABLE).where({ country_slug: slug, is_published: true }).first();
}

function findAll() {
  return db(TABLE).orderBy("sort_order");
}

function findById(id) {
  return db(TABLE).where({ id }).first();
}

function findBySlug(slug) {
  return db(TABLE).where({ country_slug: slug }).first();
}

function findBySlugExcludingId(slug, excludeId) {
  return db(TABLE).where({ country_slug: slug }).andWhereNot({ id: excludeId }).first();
}

async function create(data) {
  const [row] = await db(TABLE).insert(data).returning("*");
  return row;
}

async function update(id, data) {
  const [row] = await db(TABLE)
    .where({ id })
    .update({ ...data, updated_at: db.fn.now() })
    .returning("*");

  return row;
}

function deleteById(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = {
  findPublished,
  findPublishedBySlug,
  findAll,
  findById,
  findBySlug,
  findBySlugExcludingId,
  create,
  update,
  deleteById,
};
