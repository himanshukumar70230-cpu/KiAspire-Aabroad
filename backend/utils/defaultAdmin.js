const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await userModel.findByEmailAndRole(
      process.env.ADMIN_EMAIL,
      "admin"
    );

    if (existingAdmin) {
      console.log("Default admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

    await userModel.create({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      phone: process.env.ADMIN_PHONE,
      passwordHash: hashedPassword,
      role: "admin",
    });

    console.log("Default admin created successfully");
  } catch (error) {
    console.error("Error creating default admin:", error.message);
  }
};

module.exports = createDefaultAdmin;
