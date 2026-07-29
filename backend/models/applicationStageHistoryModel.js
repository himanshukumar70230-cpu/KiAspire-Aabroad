const db = require("../db/knex");

const TABLE = "application_stage_history";

async function create({ applicationId, stageId, note, changedBy }, trx = db) {
  const [row] = await trx(TABLE)
    .insert({
      application_id: applicationId,
      stage_id: stageId,
      note: note || null,
      changed_by: changedBy,
    })
    .returning("*");

  return row;
}

function listByApplication(applicationId) {
  return db(TABLE)
    .where("application_stage_history.application_id", applicationId)
    .join(
      "pipeline_stages",
      "pipeline_stages.id",
      "application_stage_history.stage_id"
    )
    .join("users", "users.id", "application_stage_history.changed_by")
    .select(
      "application_stage_history.id",
      "application_stage_history.note",
      "application_stage_history.changed_at",
      "pipeline_stages.code as stage_code",
      "pipeline_stages.label as stage_label",
      "pipeline_stages.phase as stage_phase",
      "users.name as changed_by_name"
    )
    .orderBy("application_stage_history.changed_at", "asc");
}

module.exports = {
  create,
  listByApplication,
};
