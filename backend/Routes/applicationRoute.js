const express = require("express");

const {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
} = require("../controllers/applicationController");

const { protect, adminOnly } = require("../middlewares/authMiddleware");

const router = express.Router();

// Everything here is admin-only.
router.use(protect, adminOnly);

router.get("/", listApplications);
router.post("/", createApplication);
router.get("/:id", getApplication);
router.patch("/:id", updateApplication);
router.delete("/:id", deleteApplication);

module.exports = router;
