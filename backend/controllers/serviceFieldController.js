const serviceModel = require("../models/serviceModel");
const serviceFieldModel = require("../models/serviceFieldModel");
const { rowToCamel, rowsToCamel } = require("../utils/caseConvert");

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "select",
  "radio",
  "checkbox",
];

function validateOptions(fieldType, options) {
  if (!["select", "radio", "checkbox"].includes(fieldType)) return null;

  if (!Array.isArray(options) || options.length === 0) {
    return "options is required for select/radio/checkbox fields";
  }

  const isValidShape = options.every(
    (option) =>
      option &&
      typeof option.label === "string" &&
      typeof option.value === "string"
  );

  if (!isValidShape) {
    return "each option must have a string label and value";
  }

  return null;
}

// GET /api/services/:serviceId/fields
// Public — the registration form needs this to render dynamic fields.
const getServiceFields = async (req, res) => {
  try {
    const fields = await serviceFieldModel.findActiveByServiceId(
      req.params.serviceId
    );

    return res.status(200).json({
      success: true,
      count: fields.length,
      fields: rowsToCamel(fields),
    });
  } catch (error) {
    console.error("Get service fields error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// POST /api/services/:serviceId/fields
// Admin only
const createServiceField = async (req, res) => {
  try {
    const service = await serviceModel.findById(req.params.serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    let {
      fieldKey,
      label,
      fieldType,
      allowMultiple,
      isOrdered,
      options,
      isRequired,
      placeholder,
      helpText,
      sortOrder,
    } = req.body;

    if (!fieldKey || !/^[a-z][a-z0-9_]*$/.test(fieldKey)) {
      return res.status(400).json({
        success: false,
        message:
          "fieldKey is required and must be lowercase letters, numbers and underscores, starting with a letter",
      });
    }

    if (!label || !label.trim()) {
      return res.status(400).json({
        success: false,
        message: "label is required",
      });
    }

    if (!FIELD_TYPES.includes(fieldType)) {
      return res.status(400).json({
        success: false,
        message: `fieldType must be one of: ${FIELD_TYPES.join(", ")}`,
      });
    }

    const optionsError = validateOptions(fieldType, options);
    if (optionsError) {
      return res.status(400).json({ success: false, message: optionsError });
    }

    const field = await serviceFieldModel.create({
      service_id: service.id,
      field_key: fieldKey,
      label: label.trim(),
      field_type: fieldType,
      allow_multiple: Boolean(allowMultiple),
      is_ordered: Boolean(isOrdered),
      options: ["select", "radio", "checkbox"].includes(fieldType)
        ? JSON.stringify(options)
        : null,
      is_required: Boolean(isRequired),
      placeholder: placeholder ? placeholder.trim() : null,
      help_text: helpText ? helpText.trim() : null,
      sort_order: Number(sortOrder) || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Field created successfully",
      field: rowToCamel(field),
    });
  } catch (error) {
    console.error("Create service field error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This service already has a field with that fieldKey",
      });
    }

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

// PATCH /api/services/fields/:fieldId
// Admin only
const updateServiceField = async (req, res) => {
  try {
    const existing = await serviceFieldModel.findActiveById(req.params.fieldId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Field not found",
      });
    }

    const {
      label,
      fieldType,
      allowMultiple,
      isOrdered,
      options,
      isRequired,
      placeholder,
      helpText,
      sortOrder,
    } = req.body;

    const updateData = {};

    if (label !== undefined) {
      if (!label.trim()) {
        return res.status(400).json({
          success: false,
          message: "label cannot be empty",
        });
      }
      updateData.label = label.trim();
    }

    const resolvedFieldType = fieldType !== undefined ? fieldType : existing.field_type;

    if (fieldType !== undefined) {
      if (!FIELD_TYPES.includes(fieldType)) {
        return res.status(400).json({
          success: false,
          message: `fieldType must be one of: ${FIELD_TYPES.join(", ")}`,
        });
      }
      updateData.field_type = fieldType;
    }

    if (options !== undefined) {
      const optionsError = validateOptions(resolvedFieldType, options);
      if (optionsError) {
        return res.status(400).json({ success: false, message: optionsError });
      }
      updateData.options = ["select", "radio", "checkbox"].includes(
        resolvedFieldType
      )
        ? JSON.stringify(options)
        : null;
    }

    if (allowMultiple !== undefined) updateData.allow_multiple = Boolean(allowMultiple);
    if (isOrdered !== undefined) updateData.is_ordered = Boolean(isOrdered);
    if (isRequired !== undefined) updateData.is_required = Boolean(isRequired);
    if (placeholder !== undefined) updateData.placeholder = placeholder ? placeholder.trim() : null;
    if (helpText !== undefined) updateData.help_text = helpText ? helpText.trim() : null;

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

    const field = await serviceFieldModel.update(req.params.fieldId, updateData);

    return res.status(200).json({
      success: true,
      message: "Field updated successfully",
      field: rowToCamel(field),
    });
  } catch (error) {
    console.error("Update service field error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid field ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// DELETE /api/services/fields/:fieldId
// Admin only — soft delete, see ARCHITECTURE.md section 1.
const deleteServiceField = async (req, res) => {
  try {
    const existing = await serviceFieldModel.findActiveById(req.params.fieldId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Field not found",
      });
    }

    await serviceFieldModel.softDelete(req.params.fieldId);

    return res.status(200).json({
      success: true,
      message: "Field deleted successfully",
    });
  } catch (error) {
    console.error("Delete service field error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid field ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

module.exports = {
  getServiceFields,
  createServiceField,
  updateServiceField,
  deleteServiceField,
};
