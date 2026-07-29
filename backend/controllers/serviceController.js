const serviceModel = require("../models/serviceModel");
const { rowToCamel, rowsToCamel } = require("../utils/caseConvert");

const createSlug = (name) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// POST /api/services
// Admin only
const createService = async (req, res) => {
  try {
    let { name, description, icon, sortOrder, kind, redirectUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service name is required",
      });
    }

    const resolvedKind = kind === "external_redirect" ? "external_redirect" : "form";

    if (resolvedKind === "external_redirect" && !redirectUrl) {
      return res.status(400).json({
        success: false,
        message: "redirectUrl is required when kind is external_redirect",
      });
    }

    name = name.trim();
    const slug = createSlug(name);

    const existingService = await serviceModel.findByNameOrSlug(name, slug);

    if (existingService) {
      return res.status(409).json({
        success: false,
        message: "Service already exists",
      });
    }

    const service = await serviceModel.create({
      name,
      slug,
      description: description?.trim() || "",
      icon: icon?.trim() || "",
      kind: resolvedKind,
      redirect_url: resolvedKind === "external_redirect" ? redirectUrl.trim() : null,
      sort_order: Number(sortOrder) || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service: rowToCamel(service),
    });
  } catch (error) {
    console.error("Create service error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Service already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// GET /api/services
// Public
const getAllServices = async (req, res) => {
  try {
    const services = await serviceModel.findActive();

    return res.status(200).json({
      success: true,
      count: services.length,
      services: rowsToCamel(services),
    });
  } catch (error) {
    console.error("Get services error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// GET /api/services/admin/all
// Admin only
const getAllServicesForAdmin = async (req, res) => {
  try {
    const services = await serviceModel.findAll();

    return res.status(200).json({
      success: true,
      count: services.length,
      services: rowsToCamel(services),
    });
  } catch (error) {
    console.error("Get admin services error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// PATCH /api/services/:id
// Admin only
const updateService = async (req, res) => {
  try {
    const { name, description, icon, isActive, sortOrder, kind, redirectUrl } =
      req.body;

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Service name cannot be empty",
        });
      }

      updateData.name = name.trim();
      updateData.slug = createSlug(name);
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (icon !== undefined) {
      updateData.icon = icon.trim();
    }

    if (typeof isActive === "boolean") {
      updateData.is_active = isActive;
    }

    if (sortOrder !== undefined) {
      const parsedSortOrder = Number(sortOrder);

      if (!Number.isFinite(parsedSortOrder) || parsedSortOrder < 0) {
        return res.status(400).json({
          success: false,
          message: "sortOrder must be a non-negative number",
        });
      }

      updateData.sort_order = parsedSortOrder;
    }

    if (kind !== undefined) {
      if (!["form", "external_redirect"].includes(kind)) {
        return res.status(400).json({
          success: false,
          message: "kind must be 'form' or 'external_redirect'",
        });
      }

      updateData.kind = kind;

      if (kind === "external_redirect" && !redirectUrl) {
        return res.status(400).json({
          success: false,
          message: "redirectUrl is required when kind is external_redirect",
        });
      }

      updateData.redirect_url = kind === "external_redirect" ? redirectUrl.trim() : null;
    } else if (redirectUrl !== undefined) {
      updateData.redirect_url = redirectUrl ? redirectUrl.trim() : null;
    }

    const service = await serviceModel.update(req.params.id, updateData);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service: rowToCamel(service),
    });
  } catch (error) {
    console.error("Update service error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Another service already uses this name",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// DELETE /api/services/:id
// Admin only
const deleteService = async (req, res) => {
  try {
    const deletedCount = await serviceModel.deleteById(req.params.id);

    if (!deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Delete service error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

module.exports = {
  createService,
  getAllServices,
  getAllServicesForAdmin,
  updateService,
  deleteService,
};
