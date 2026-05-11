const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const aiRoutes = require("./routes/ai");
const mlRoutes = require("./routes/ml");
const errorHandler = require("./middleware/errorHandler");
const { ensureDatabaseSchema } = require("../db/initializeSchema");
const { ensureProductionDefaultUsers } = require("../db/bootstrapProductionUsers");

const app = express();
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/ml", mlRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await ensureDatabaseSchema();
  } catch (err) {
    console.error("[schema] Database schema init failed:", err.message || err);
  }

  try {
    await ensureProductionDefaultUsers();
  } catch (err) {
    console.error("[bootstrap] Default user seed failed:", err.message || err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
