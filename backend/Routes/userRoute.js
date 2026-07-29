const express = require("express");

const {
  registerStudent,
  loginStudent,
  logoutStudent,
  getMyDashboard,
} = require("../controllers/userController");

const { protect, studentOnly } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", loginStudent);
router.post("/logout", logoutStudent);
router.get("/dashboard", protect, studentOnly, getMyDashboard);

module.exports = router;
