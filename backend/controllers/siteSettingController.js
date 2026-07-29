const siteSettingModel = require("../models/siteSettingModel");
const { rowsToCamel } = require("../utils/caseConvert");

// GET /api/site-settings
// Public — the About page reads the country/university counts from here.
const getSiteSettings = async (req, res) => {
  try {
    const settings = await siteSettingModel.findAll();

    // Flat { key: value } map — simplest shape for the frontend to consume
    // (e.g. settings.about_countries_count) without hunting through an array.
    const asMap = {};
    for (const row of settings) {
      asMap[row.key] = row.value;
    }

    return res.status(200).json({
      success: true,
      settings: asMap,
    });
  } catch (error) {
    console.error("Get site settings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// GET /api/admin/site-settings
// Admin only — full rows (with labels) for an admin edit form.
const getSiteSettingsForAdmin = async (req, res) => {
  try {
    const settings = await siteSettingModel.findAll();

    return res.status(200).json({
      success: true,
      settings: rowsToCamel(settings),
    });
  } catch (error) {
    console.error("Get admin site settings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// PATCH /api/admin/site-settings/:key
// Admin only. Update-only by design (see ARCHITECTURE.md section 4b) —
// the set of valid keys is fixed and seeded, not admin-creatable.
// body: { value }
const updateSiteSetting = async (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined || value === null || `${value}`.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "value is required",
      });
    }

    const existing = await siteSettingModel.findByKey(req.params.key);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }

    const updated = await siteSettingModel.updateValue(
      req.params.key,
      `${value}`.trim()
    );

    return res.status(200).json({
      success: true,
      message: "Setting updated successfully",
      setting: {
        key: updated.key,
        value: updated.value,
        label: updated.label,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    console.error("Update site setting error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

module.exports = {
  getSiteSettings,
  getSiteSettingsForAdmin,
  updateSiteSetting,
};
