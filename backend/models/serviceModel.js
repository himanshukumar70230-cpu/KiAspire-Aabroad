const db = require("../db/knex");

const TABLE = "services";

function findActive() {
  return db(TABLE)
    .where({ is_active: true })
    .orderBy([{ column: "sort_order" }, { column: "created_at" }]);
}

function findAll() {
  return db(TABLE).orderBy([{ column: "sort_order" }, { column: "created_at" }]);
}

function findById(id) {
  return db(TABLE).where({ id }).first();
}

function findByNameOrSlug(name, slug) {
  return db(TABLE).where({ name }).orWhere({ slug }).first();
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
  findActive,
  findAll,
  findById,
  findByNameOrSlug,
  create,
  update,
  deleteById,
};
