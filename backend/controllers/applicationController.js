const validator = require("validator");

const db = require("../db/knex");
const userModel = require("../models/userModel");
const serviceModel = require("../models/serviceModel");
const serviceFieldModel = require("../models/serviceFieldModel");
const pipelineStageModel = require("../models/pipelineStageModel");
const applicationModel = require("../models/applicationModel");
const applicationStageHistoryModel = require("../models/applicationStageHistoryModel");
const { validateFieldValues } = require("../utils/validateFieldValues");
const { rowToCamel, rowsToCamel } = require("../utils/caseConvert");

// GET /api/admin/pipeline-stages
// Admin only — supporting lookup so the admin UI knows valid stageId values
// to advance an application to.
const listPipelineStages = async (req, res) => {
  try {
    const stages = await pipelineStageModel.findAll();

    return res.status(200).json({
      success: true,
      stages: rowsToCamel(stages),
    });
  } catch (error) {
    console.error("List pipeline stages error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// GET /api/admin/applications?serviceId=&stageId=&isClosed=&page=&pageSize=
// Admin only
const listApplications = async (req, res) => {
  try {
    const { serviceId, stageId, isClosed } = req.query;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 25, 1), 100);

    const filters = {
      serviceId: serviceId ? Number(serviceId) : undefined,
      stageId: stageId ? Number(stageId) : undefined,
      isClosed:
        isClosed === "true" ? true : isClosed === "false" ? false : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };

    const [applications, countResult] = await Promise.all([
      applicationModel.listForAdmin(filters),
      applicationModel.countForAdmin(filters),
    ]);

    return res.status(200).json({
      success: true,
      page,
      pageSize,
      total: Number(countResult.count),
      applications: rowsToCamel(applications),
    });
  } catch (error) {
    console.error("List applications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// GET /api/admin/applications/:id
// Admin only
const getApplication = async (req, res) => {
  try {
    const application = await applicationModel.findByIdWithDetails(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const history = await applicationStageHistoryModel.listByApplication(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      application: rowToCamel(application),
      history: rowsToCamel(history),
    });
  } catch (error) {
    console.error("Get application error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// POST /api/admin/applications
// Admin only — for staff-entered leads (e.g. walk-ins, phone calls) that
// didn't come through the public registration form.
// body: { userId? , name?, email?, phone?, serviceId, fieldValues? }
const createApplication = async (req, res) => {
  try {
    const { userId, name, email, phone, serviceId, fieldValues } = req.body;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "serviceId is required",
      });
    }

    const service = await serviceModel.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    let user;

    if (userId) {
      user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
    } else {
      if (!name || !email || !phone) {
        return res.status(400).json({
          success: false,
          message:
            "Provide either userId, or name, email and phone for a new lead",
        });
      }

      const trimmedEmail = email.trim().toLowerCase();

      if (!validator.isEmail(trimmedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address",
        });
      }

      user = await userModel.findByEmailOrPhone(trimmedEmail, phone.trim());

      if (!user) {
        user = await userModel.create({
          name: name.trim(),
          email: trimmedEmail,
          phone: phone.trim(),
          role: "student",
        });
      }
    }

    let cleanedFieldValues = null;

    if (service.kind === "form" && fieldValues) {
      const activeFields = await serviceFieldModel.findActiveByServiceId(
        service.id
      );
      const { errors, cleaned } = validateFieldValues(activeFields, fieldValues);

      if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join(", ") });
      }

      cleanedFieldValues = cleaned;
    }

    const firstStage = await pipelineStageModel.findFirst();

    const application = await applicationModel.create({
      userId: user.id,
      serviceId: service.id,
      fieldValues: cleanedFieldValues,
      currentStageId: firstStage.id,
    });

    return res.status(201).json({
      success: true,
      message: "Application created successfully",
      application: rowToCamel(application),
    });
  } catch (error) {
    console.error("Create application error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email or phone is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// PATCH /api/admin/applications/:id
// Admin only. Accepts any combination of:
//   fieldValues: object              — corrects the submitted answers
//   stageId + note                   — advances/moves the pipeline stage
//   isClosed + closedReason          — closes/reopens the lead
const updateApplication = async (req, res) => {
  try {
    const application = await applicationModel.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const { fieldValues, stageId, note, isClosed, closedReason } = req.body;

    let updated = application;

    if (fieldValues !== undefined) {
      const activeFields = await serviceFieldModel.findActiveByServiceId(
        application.service_id
      );
      const { errors, cleaned } = validateFieldValues(activeFields, fieldValues);

      if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join(", ") });
      }

      updated = await applicationModel.updateFieldValues(application.id, cleaned);
    }

    if (stageId !== undefined) {
      const stage = await pipelineStageModel.findById(stageId);

      if (!stage) {
        return res.status(400).json({
          success: false,
          message: "Invalid stageId",
        });
      }

      if (stage.id !== application.current_stage_id) {
        updated = await db.transaction(async (trx) => {
          const applicationRow = await applicationModel.updateStage(
            application.id,
            stage.id,
            trx
          );

          await applicationStageHistoryModel.create(
            {
              applicationId: application.id,
              stageId: stage.id,
              note: note || null,
              changedBy: req.user.id,
            },
            trx
          );

          return applicationRow;
        });
      }
    }

    if (typeof isClosed === "boolean") {
      updated = await applicationModel.setClosed(application.id, isClosed, closedReason);
    }

    return res.status(200).json({
      success: true,
      message: "Application updated successfully",
      application: rowToCamel(updated),
    });
  } catch (error) {
    console.error("Update application error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// DELETE /api/admin/applications/:id
// Admin only
const deleteApplication = async (req, res) => {
  try {
    const deletedCount = await applicationModel.deleteById(req.params.id);

    if (!deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Delete application error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

module.exports = {
  listPipelineStages,
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
};
