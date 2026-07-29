const express = require("express");

const {
  getPublishedCountries,
  getPublishedCountryBySlug,
  getAllCountriesForAdmin,
  createCountry,
  updateCountry,
  deleteCountry,
} = require("../controllers/freeStudyController");

const { protect, adminOnly } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getPublishedCountries);
router.get("/admin/all", protect, adminOnly, getAllCountriesForAdmin);
router.get("/:slug", getPublishedCountryBySlug);

// Admin routes
router.post("/", protect, adminOnly, createCountry);
router.patch("/:id", protect, adminOnly, updateCountry);
router.delete("/:id", protect, adminOnly, deleteCountry);

module.exports = router;
