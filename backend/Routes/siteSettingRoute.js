const express = require("express");

const {
  getSiteSettings,
  getSiteSettingsForAdmin,
  updateSiteSetting,
} = require("../controllers/siteSettingController");

const { protect, adminOnly } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public
router.get("/", getSiteSettings);

// Admin
router.get("/admin/all", protect, adminOnly, getSiteSettingsForAdmin);
router.patch("/admin/:key", protect, adminOnly, updateSiteSetting);

module.exports = router;
