const db = require("../db/knex");

const TABLE = "stories";

function findActive() {
  return db(TABLE)
    .where({ is_active: true })
    .orderBy([{ column: "sort_order" }, { column: "created_at", order: "desc" }]);
}

function findById(id) {
  return db(TABLE).where({ id }).first();
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
  findById,
  create,
  update,
  deleteById,
};
