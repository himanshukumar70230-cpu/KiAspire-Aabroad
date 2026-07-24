const validator = require("validator");
const User = require("../models/userModel");

const createUser = async (req, res) => {
  try {
    let { name, email, phone } = req.body;

    // Required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    // Normalize values
    name = name.trim();
    email = email.trim().toLowerCase();
    phone = phone.trim();

    // Name validation
    if (name.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 3 characters",
      });
    }

    // FIX: previously "/^[a-zA-Z\s]+$/" rejected valid names like
    // "Anne-Marie" or "O'Brien". Now allows letters, spaces, hyphens
    // and apostrophes.
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      return res.status(400).json({
        success: false,
        message: "Name can contain only letters, spaces, hyphens and apostrophes",
      });
    }

    // Email validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Indian mobile number validation
    if (!validator.isMobilePhone(phone, "en-IN")) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Indian phone number",
      });
    }

    // Check duplicate email or phone
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      const duplicateField =
        existingUser.email === email ? "Email" : "Phone";

      return res.status(409).json({
        success: false,
        message: `${duplicateField} is already registered`,
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      role: "user",
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];

      return res.status(409).json({
        success: false,
        message: `${field} is already registered`,
      });
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((item) => item.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled."
      });
    }

    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful.",

      token: generateToken(user._id),

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
      error: error.message
    });
  }
};

module.exports = {
  createUser,
  loginUser,
};
