const crypto = require("crypto");
const db = require("../db/knex");

const TABLE = "applications";

async function create(
  { userId, serviceId, fieldValues, currentStageId },
  trx = db
) {
  const id = crypto.randomUUID();

  const [row] = await trx(TABLE)
    .insert({
      id,
      user_id: userId,
      service_id: serviceId,
      field_values: fieldValues != null ? JSON.stringify(fieldValues) : null,
      current_stage_id: currentStageId,
    })
    .returning("*");

  return row;
}

function findById(id) {
  return db(TABLE).where({ id }).first();
}

function findByIdWithDetails(id) {
  return db(TABLE)
    .where("applications.id", id)
    .join("users", "users.id", "applications.user_id")
    .join("services", "services.id", "applications.service_id")
    .join(
      "pipeline_stages",
      "pipeline_stages.id",
      "applications.current_stage_id"
    )
    .select(
      "applications.*",
      "users.name as user_name",
      "users.email as user_email",
      "users.phone as user_phone",
      "services.name as service_name",
      "services.slug as service_slug",
      "pipeline_stages.code as stage_code",
      "pipeline_stages.label as stage_label",
      "pipeline_stages.student_label as stage_student_label",
      "pipeline_stages.phase as stage_phase"
    )
    .first();
}

function listForAdmin({ serviceId, stageId, isClosed, limit = 50, offset = 0 } = {}) {
  const query = db(TABLE)
    .join("users", "users.id", "applications.user_id")
    .join("services", "services.id", "applications.service_id")
    .join(
      "pipeline_stages",
      "pipeline_stages.id",
      "applications.current_stage_id"
    )
    .select(
      "applications.*",
      "users.name as user_name",
      "users.email as user_email",
      "users.phone as user_phone",
      "services.name as service_name",
      "services.slug as service_slug",
      "pipeline_stages.code as stage_code",
      "pipeline_stages.label as stage_label",
      "pipeline_stages.student_label as stage_student_label",
      "pipeline_stages.phase as stage_phase"
    )
    .orderBy("applications.created_at", "desc")
    .limit(limit)
    .offset(offset);

  if (serviceId) query.andWhere("applications.service_id", serviceId);
  if (stageId) query.andWhere("applications.current_stage_id", stageId);
  if (typeof isClosed === "boolean")
    query.andWhere("applications.is_closed", isClosed);

  return query;
}

function countForAdmin({ serviceId, stageId, isClosed } = {}) {
  const query = db(TABLE);

  if (serviceId) query.andWhere("service_id", serviceId);
  if (stageId) query.andWhere("current_stage_id", stageId);
  if (typeof isClosed === "boolean") query.andWhere("is_closed", isClosed);

  return query.count({ count: "*" }).first();
}

function listForUser(userId) {
  return db(TABLE)
    .where("applications.user_id", userId)
    .join("services", "services.id", "applications.service_id")
    .join(
      "pipeline_stages",
      "pipeline_stages.id",
      "applications.current_stage_id"
    )
    .select(
      "applications.id",
      "applications.field_values",
      "applications.is_closed",
      "applications.closed_reason",
      "applications.current_stage_since",
      "applications.created_at",
      "services.name as service_name",
      "services.slug as service_slug",
      "pipeline_stages.code as stage_code",
      "pipeline_stages.label as stage_label",
      "pipeline_stages.student_label as stage_student_label",
      "pipeline_stages.phase as stage_phase"
    )
    .orderBy("applications.created_at", "desc");
}

async function updateFieldValues(id, fieldValues) {
  const [row] = await db(TABLE)
    .where({ id })
    .update({
      field_values: JSON.stringify(fieldValues),
      updated_at: db.fn.now(),
    })
    .returning("*");

  return row;
}

async function updateStage(id, stageId, trx = db) {
  const [row] = await trx(TABLE)
    .where({ id })
    .update({
      current_stage_id: stageId,
      current_stage_since: trx.fn.now(),
      updated_at: trx.fn.now(),
    })
    .returning("*");

  return row;
}

async function setClosed(id, isClosed, reason) {
  const [row] = await db(TABLE)
    .where({ id })
    .update({
      is_closed: isClosed,
      closed_reason: isClosed ? reason || null : null,
      closed_at: isClosed ? db.fn.now() : null,
      updated_at: db.fn.now(),
    })
    .returning("*");

  return row;
}

function deleteById(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = {
  create,
  findById,
  findByIdWithDetails,
  listForAdmin,
  countForAdmin,
  listForUser,
  updateFieldValues,
  updateStage,
  setClosed,
  deleteById,
};
