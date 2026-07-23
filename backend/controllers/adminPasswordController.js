const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/userModel");
const transporter = require("../config/mailer");

// Send OTP
const sendAdminPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const admin = await User.findOne({
      email: email.toLowerCase(),
      role: "admin",
    }).select("+resetOtp +resetOtpExpire +isOtpVerified");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    // Store a hashed version of OTP
    const hashedOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    admin.resetOtp = hashedOtp;
    admin.resetOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
    admin.isOtpVerified = false;

    await admin.save({ validateBeforeSave: false });

    await transporter.sendMail({
      from: `"Ki Aspire Abroad" <${process.env.EMAIL_USER}>`,
      to: admin.email,
      subject: "Admin Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Password Reset Request</h2>
          <p>Hello ${admin.name},</p>
          <p>Your password reset OTP is:</p>

          <h1 style="letter-spacing: 6px;">${otp}</h1>

          <p>This OTP is valid for 10 minutes.</p>
          <p>If you did not request this change, ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to the admin email",
    });
  } catch (error) {
    console.error("Send admin OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send OTP",
      error: error.message,
    });
  }
};

// Verify OTP
const verifyAdminPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const hashedOtp = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    const admin = await User.findOne({
      email: email.toLowerCase(),
      role: "admin",
      resetOtp: hashedOtp,
      resetOtpExpire: { $gt: new Date() },
    }).select("+resetOtp +resetOtpExpire +isOtpVerified");

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    admin.isOtpVerified = true;

    await admin.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify admin OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP",
      error: error.message,
    });
  }
};

// Change password
const changeAdminPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, new password and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    const admin = await User.findOne({
      email: email.toLowerCase(),
      role: "admin",
    }).select(
      "+password +resetOtp +resetOtpExpire +isOtpVerified"
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    if (!admin.isOtpVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify the OTP before changing the password",
      });
    }

    admin.password = await bcrypt.hash(newPassword, 12);

    admin.resetOtp = undefined;
    admin.resetOtpExpire = undefined;
    admin.isOtpVerified = false;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin password changed successfully",
    });
  } catch (error) {
    console.error("Change admin password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
      error: error.message,
    });
  }
};

module.exports = {
  sendAdminPasswordOtp,
  verifyAdminPasswordOtp,
  changeAdminPassword,
};