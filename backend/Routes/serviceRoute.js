const express = require("express");

const {
  createService,
  getAllServices,
  getAllServicesForAdmin,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

const {
  getServiceFields,
  createServiceField,
  updateServiceField,
  deleteServiceField,
} = require("../controllers/serviceFieldController");

const { protect, adminOnly } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getAllServices);
router.get("/:serviceId/fields", getServiceFields);

// Admin routes
router.get("/admin/all", protect, adminOnly, getAllServicesForAdmin);
router.post("/", protect, adminOnly, createService);
router.patch("/:id", protect, adminOnly, updateService);
router.delete("/:id", protect, adminOnly, deleteService);

router.post("/:serviceId/fields", protect, adminOnly, createServiceField);
router.patch("/fields/:fieldId", protect, adminOnly, updateServiceField);
router.delete("/fields/:fieldId", protect, adminOnly, deleteServiceField);

module.exports = router;
