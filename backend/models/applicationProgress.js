const mongoose = require("mongoose");

const progressStageSchema = new mongoose.Schema(
  {
    stageName: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Completed",
        "Rejected",
        "Not Applicable",
      ],
      default: "Pending",
    },

    adminRemark: {
      type: String,
      trim: true,
    },

    completedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const applicationProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    currentStage: {
      type: String,
      default: "Profile Created",
    },

    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    stages: {
      type: [progressStageSchema],
      default: [
        { stageName: "Profile Created", status: "Completed" },
        { stageName: "Counselling Completed", status: "Pending" },
        { stageName: "Documents Submitted", status: "Pending" },
        { stageName: "University Shortlisting", status: "Pending" },
        { stageName: "Application Submitted", status: "Pending" },
        { stageName: "Offer Letter Received", status: "Pending" },
        { stageName: "Visa Application", status: "Pending" },
        { stageName: "Pre-Departure", status: "Pending" },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ApplicationProgress",
  applicationProgressSchema
);