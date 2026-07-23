require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const createDefaultAdmin = require("./utils/defaultAdmin");
const adminPasswordRoutes = require("./Routes/adminPasswordRoute");

const userRoutes = require("./Routes/userRoute");
const adminRoutes = require("./Routes/adminRoute");
const serviceRoutes = require("./Routes/serviceRoute");
const storyRoutes = require("./Routes/storyRoute");

const app = express();

// Connect Database, then ensure the default admin exists
connectDB().then(async () => {
  await createDefaultAdmin();
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:300"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Routes
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/admin/password", adminPasswordRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT =  3300;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
