const bcrypt = require("bcryptjs");
const validator = require("validator");

const userModel = require("../models/userModel");
const generateToken = require("../utils/token");
const { rowToCamel, rowsToCamel } = require("../utils/caseConvert");
const { setAuthCookie, clearAuthCookie } = require("../utils/authCookie");

// Admin login
// POST /api/admin/login
const adminLogin = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    email = email.trim().toLowerCase();

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const admin = await userModel.findByEmailAndRole(email, "admin");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password",
      });
    }

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your admin account is inactive",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password",
      });
    }

    const updatedAdmin = await userModel.updateLastLogin(admin.id);

    const token = generateToken(updatedAdmin.id, updatedAdmin.role);
    setAuthCookie(req, res, "admin_token", token);

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: rowToCamel(userModel.toPublicUser(updatedAdmin)),
    });
  } catch (error) {
    console.error("Admin login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// POST /api/admin/logout
// Clears the httpOnly page-guard cookie set on login. The bearer token
// itself can't be revoked server-side (stateless JWT) — the frontend also
// drops it from localStorage; this only needs to handle the cookie half.
const logoutAdmin = (req, res) => {
  clearAuthCookie(res, "admin_token");

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Get logged-in admin profile
// GET /api/admin/profile
const getAdminProfile = async (req, res) => {
  try {
    const admin = await userModel.findByIdAndRole(req.user.id, "admin");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      admin: rowToCamel(userModel.toPublicUser(admin)),
    });
  } catch (error) {
    console.error("Get admin profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// Get all students
// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.listByRole("student");

    return res.status(200).json({
      success: true,
      count: users.length,
      users: rowsToCamel(users.map(userModel.toPublicUser)),
    });
  } catch (error) {
    console.error("Get all users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// Get a single student
// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await userModel.findByIdAndRole(req.params.id, "student");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: rowToCamel(userModel.toPublicUser(user)),
    });
  } catch (error) {
    console.error("Get user error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// Activate or deactivate a student
// PATCH /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const user = await userModel.updateIsActive(req.params.id, "student", isActive);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user: rowToCamel(userModel.toPublicUser(user)),
    });
  } catch (error) {
    console.error("Update user status error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// Delete a student
// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const deletedCount = await userModel.deleteByIdAndRole(req.params.id, "student");

    if (!deletedCount) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

module.exports = {
  adminLogin,
  logoutAdmin,
  getAdminProfile,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
};
