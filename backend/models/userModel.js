const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // FIX: select:false so password hashes are never returned by default.
    // Anywhere that actually needs it (e.g. admin login) must explicitly
    // call .select("+password").
    password: {
      type: String,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin", "counsellor"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

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

// FIX (defense in depth): even if some future query explicitly selects
// +password, strip it before the document is ever serialized to JSON.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
