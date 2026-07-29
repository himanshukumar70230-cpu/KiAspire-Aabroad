const bcrypt = require("bcryptjs");
const validator = require("validator");

const db = require("../db/knex");
const userModel = require("../models/userModel");
const serviceModel = require("../models/serviceModel");
const serviceFieldModel = require("../models/serviceFieldModel");
const pipelineStageModel = require("../models/pipelineStageModel");
const applicationModel = require("../models/applicationModel");
const generateToken = require("../utils/token");
const { validateFieldValues } = require("../utils/validateFieldValues");
const { rowToCamel, rowsToCamel } = require("../utils/caseConvert");
const { setAuthCookie, clearAuthCookie } = require("../utils/authCookie");

function validateContactFields(name, email, phone) {
  if (!name || !email || !phone) {
    return "Name, email and phone are required";
  }

  if (name.trim().length < 3) {
    return "Name must contain at least 3 characters";
  }

  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
    return "Name can contain only letters, spaces, hyphens and apostrophes";
  }

  if (!validator.isEmail(email.trim().toLowerCase())) {
    return "Please enter a valid email address";
  }

  if (!validator.isMobilePhone(phone.trim(), "en-IN")) {
    return "Please enter a valid Indian phone number";
  }

  return null;
}

// POST /api/user/register
// body: { name, email, phone, password?, serviceId, fieldValues? }
const registerStudent = async (req, res) => {
  try {
    let { name, email, phone, password, serviceId, fieldValues } = req.body;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "serviceId is required",
      });
    }

    const contactError = validateContactFields(name, email, phone);
    if (contactError) {
      return res.status(400).json({ success: false, message: contactError });
    }

    name = name.trim();
    email = email.trim().toLowerCase();
    phone = phone.trim();

    const service = await serviceModel.findById(serviceId);

    if (!service || !service.is_active) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const firstStage = await pipelineStageModel.findFirst();
    if (!firstStage) {
      // Should never happen in a correctly-seeded environment.
      return res.status(500).json({
        success: false,
        message: "Server is not configured correctly. Please try again later.",
      });
    }

    // --- Book a Consultation / any external_redirect service ---
    // Captures the lead first (per ARCHITECTURE.md section 5), then hands
    // back a redirect URL with name/email prefilled — no password, no
    // dynamic fields.
    if (service.kind === "external_redirect") {
      let user = await userModel.findByEmailOrPhone(email, phone);

      if (!user) {
        user = await userModel.create({ name, email, phone, role: "student" });
      }

      const application = await applicationModel.create({
        userId: user.id,
        serviceId: service.id,
        fieldValues: null,
        currentStageId: firstStage.id,
      });

      const redirectUrl =
        service.redirect_url +
        `?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;

      return res.status(201).json({
        success: true,
        message: "Redirecting to booking",
        redirectUrl,
        application: rowToCamel(application),
      });
    }

    // --- Regular form-based service ---
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await userModel.findByEmailOrPhone(email, phone);

    if (existingUser && existingUser.password_hash) {
      const duplicateField = existingUser.email === email ? "Email" : "Phone";
      return res.status(409).json({
        success: false,
        message: `${duplicateField} is already registered. Please log in instead.`,
      });
    }

    const activeFields = await serviceFieldModel.findActiveByServiceId(
      service.id
    );

    const { errors, cleaned } = validateFieldValues(activeFields, fieldValues);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(", ") });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.transaction(async (trx) => {
      let user = existingUser;

      if (user) {
        // Lead-only row (no password yet) converting into a full account.
        user = await userModel.setPassword(user.id, passwordHash, trx);
      } else {
        user = await userModel.create(
          { name, email, phone, passwordHash, role: "student" },
          trx
        );
      }

      const application = await applicationModel.create(
        {
          userId: user.id,
          serviceId: service.id,
          fieldValues: cleaned,
          currentStageId: firstStage.id,
        },
        trx
      );

      return { user, application };
    });

    const token = generateToken(result.user.id, result.user.role);
    setAuthCookie(req, res, "student_token", token);

    return res.status(201).json({
      success: true,
      message: "Registered successfully",
      token,
      user: rowToCamel(userModel.toPublicUser(result.user)),
      application: rowToCamel(result.application),
    });
  } catch (error) {
    console.error("Register student error:", error);

    if (error.code === "23505") {
      // Postgres unique_violation
      return res.status(409).json({
        success: false,
        message: "Email or phone is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

<<<<<<< HEAD
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
=======
// POST /api/user/login
// body: { email, password }
const loginStudent = async (req, res) => {
  try {
    let { email, password } = req.body;
>>>>>>> 1e4a74a0c1b78c51cec3232e6ba0d5eda2ce50c1

    if (!email || !password) {
      return res.status(400).json({
        success: false,
<<<<<<< HEAD
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    }).select("+password");
=======
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

    const user = await userModel.findByEmailAndRole(email, "student");
>>>>>>> 1e4a74a0c1b78c51cec3232e6ba0d5eda2ce50c1

    if (!user) {
      return res.status(401).json({
        success: false,
<<<<<<< HEAD
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
=======
        message: "Invalid email or password",
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message:
          "This account doesn't have a password set yet. Please complete your registration for a service.",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    await userModel.updateLastLogin(user.id);

    const token = generateToken(user.id, user.role);
    setAuthCookie(req, res, "student_token", token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: rowToCamel(userModel.toPublicUser(user)),
    });
  } catch (error) {
    console.error("Student login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// POST /api/user/logout
// Clears the httpOnly page-guard cookie set on login/register. The bearer
// token itself can't be revoked server-side (stateless JWT), so the
// frontend also drops it from localStorage — this only needs to handle
// the cookie half.
const logoutStudent = (req, res) => {
  clearAuthCookie(res, "student_token");

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// GET /api/user/dashboard
// Protected (studentOnly). Returns the grouped, 5-phase progress view —
// full stage history/notes stay admin-only (see ARCHITECTURE.md section 3).
const getMyDashboard = async (req, res) => {
  try {
    const [applications, phaseOrder] = await Promise.all([
      applicationModel.listForUser(req.user.id),
      pipelineStageModel.findPhaseSummary(),
    ]);

    const phases = phaseOrder.map((row) => ({
      phase: row.phase,
      label: row.student_label,
    }));

    const applicationsView = applications.map((application) => {
      const currentPhaseIndex = phases.findIndex(
        (phase) => phase.phase === application.stage_phase
      );

      return {
        ...rowToCamel(application),
        currentPhaseIndex,
      };
    });

    return res.status(200).json({
      success: true,
      phases,
      applications: applicationsView,
    });
  } catch (error) {
    console.error("Get dashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
>>>>>>> 1e4a74a0c1b78c51cec3232e6ba0d5eda2ce50c1
    });
  }
};

module.exports = {
<<<<<<< HEAD
  createUser,
  loginUser,
=======
  registerStudent,
  loginStudent,
  logoutStudent,
  getMyDashboard,
>>>>>>> 1e4a74a0c1b78c51cec3232e6ba0d5eda2ce50c1
};
