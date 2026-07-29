const db = require("../db/knex");

const TABLE = "service_fields";

function findActiveByServiceId(serviceId) {
  return db(TABLE)
    .where({ service_id: serviceId })
    .whereNull("deleted_at")
    .orderBy("sort_order");
}

function findActiveById(id) {
  return db(TABLE).where({ id }).whereNull("deleted_at").first();
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

async function softDelete(id) {
  const [row] = await db(TABLE)
    .where({ id })
    .update({ deleted_at: db.fn.now(), updated_at: db.fn.now() })
    .returning("*");

  return row;
}

module.exports = {
  findActiveByServiceId,
  findActiveById,
  create,
  update,
  softDelete,
};
