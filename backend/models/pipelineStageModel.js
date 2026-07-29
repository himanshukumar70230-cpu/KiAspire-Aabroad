const db = require("../db/knex");

const TABLE = "pipeline_stages";

function findAll() {
  return db(TABLE).orderBy("sort_order");
}

function findById(id) {
  return db(TABLE).where({ id }).first();
}

function findFirst() {
  return db(TABLE).orderBy("sort_order").first();
}

// One row per distinct phase (phase + its shared student_label), in the
// order phases occur in the pipeline. Lets the student dashboard render a
// 5-step progress bar without hardcoding the phase list a second time.
function findPhaseSummary() {
  return db(TABLE)
    .select("phase", "student_label")
    .min({ min_sort_order: "sort_order" })
    .groupBy("phase", "student_label")
    .orderBy("min_sort_order");
}

module.exports = {
  findAll,
  findById,
  findFirst,
  findPhaseSummary,
};
