const express = require("express");

const {
  sendAdminPasswordOtp,
  verifyAdminPasswordOtp,
  changeAdminPassword,
} = require("../controllers/adminPasswordController");

const router = express.Router();

router.post("/forgot-password", sendAdminPasswordOtp);
router.post("/verify-otp", verifyAdminPasswordOtp);
router.patch("/change-password", changeAdminPassword);

module.exports = router;