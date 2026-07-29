const crypto = require("crypto");
const db = require("../db/knex");

const TABLE = "users";

// Never send password_hash back over the API. There's no Mongoose-style
// toJSON transform in a plain knex row, so every controller that returns a
// user must run it through this first.
function toPublicUser(row) {
  if (!row) return row;
  const { password_hash, ...rest } = row;
  return rest;
}

function findByEmailOrPhone(email, phone, trx = db) {
  return trx(TABLE).where({ email }).orWhere({ phone }).first();
}

function findById(id) {
  return db(TABLE).where({ id }).first();
}

function findByIdAndRole(id, role) {
  return db(TABLE).where({ id, role }).first();
}

function findByEmailAndRole(email, role) {
  return db(TABLE).where({ email, role }).first();
}

<<<<<<< HEAD
    lastLogin: {
      type: Date,
      default: null,
    },
    resetOtp: {
      type: String,
      select: false,
    },

    resetOtpExpire: {
      type: Date,
      select: false,
    },

    isOtpVerified: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);
=======
async function create({ name, email, phone, passwordHash, role }, trx = db) {
  const id = crypto.randomUUID();
>>>>>>> 1e4a74a0c1b78c51cec3232e6ba0d5eda2ce50c1

  const [row] = await trx(TABLE)
    .insert({
      id,
      name,
      email,
      phone,
      password_hash: passwordHash || null,
      role: role || "student",
    })
    .returning("*");

  return row;
}

async function setPassword(id, passwordHash, trx = db) {
  const [row] = await trx(TABLE)
    .where({ id })
    .update({ password_hash: passwordHash, updated_at: trx.fn.now() })
    .returning("*");

  return row;
}

async function updateLastLogin(id) {
  const [row] = await db(TABLE)
    .where({ id })
    .update({ last_login: db.fn.now(), updated_at: db.fn.now() })
    .returning("*");

  return row;
}

function listByRole(role) {
  return db(TABLE).where({ role }).orderBy("created_at", "desc");
}

async function updateIsActive(id, role, isActive) {
  const [row] = await db(TABLE)
    .where({ id, role })
    .update({ is_active: isActive, updated_at: db.fn.now() })
    .returning("*");

  return row;
}

function deleteByIdAndRole(id, role) {
  return db(TABLE).where({ id, role }).del();
}

module.exports = {
  toPublicUser,
  findByEmailOrPhone,
  findById,
  findByIdAndRole,
  findByEmailAndRole,
  create,
  setPassword,
  updateLastLogin,
  listByRole,
  updateIsActive,
  deleteByIdAndRole,
};
