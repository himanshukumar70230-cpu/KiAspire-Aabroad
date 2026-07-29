const express = require("express");

const {
  adminLogin,
  logoutAdmin,
  getAdminProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
} = require("../controllers/adminController");

const { listPipelineStages } = require("../controllers/applicationController");

const { protect, adminOnly } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public admin route
router.post("/login", adminLogin);
router.post("/logout", logoutAdmin);

// Protected admin routes
router.get("/profile", protect, adminOnly, getAdminProfile);

router.get("/pipeline-stages", protect, adminOnly, listPipelineStages);

router.get("/users", protect, adminOnly, getAllUsers);

router.get("/users/:id", protect, adminOnly, getUserById);

router.patch("/users/:id/status", protect, adminOnly, updateUserStatus);

router.delete("/users/:id", protect, adminOnly, deleteUser);

module.exports = router;
