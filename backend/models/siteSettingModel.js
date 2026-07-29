const db = require("../db/knex");

const TABLE = "site_settings";

function findAll() {
  return db(TABLE).orderBy("key");
}

function findByKey(key) {
  return db(TABLE).where({ key }).first();
}

// Deliberately update-only (no create/delete via the API): the valid set of
// setting keys is fixed and seeded. See ARCHITECTURE.md section 4b — this
// is "an edit endpoint," not full settings CRUD.
async function updateValue(key, value) {
  const [row] = await db(TABLE)
    .where({ key })
    .update({ value, updated_at: db.fn.now() })
    .returning("*");

  return row;
}

module.exports = {
  findAll,
  findByKey,
  updateValue,
};
