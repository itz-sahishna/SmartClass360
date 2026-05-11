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

const app = express();
const uploadsDir = path.join(__dirname, "..", "uploads");
const debugEndpoint = "http://127.0.0.1:7586/ingest/52c81873-b59d-4be5-b957-ad89573d8c54";

const sendDebugLog = (payload) => {
  // #region agent log
  fetch(debugEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "667dd8",
    },
    body: JSON.stringify({
      sessionId: "667dd8",
      runId: "pre-fix",
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

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

sendDebugLog({
  hypothesisId: "H2",
  location: "backend/src/server.js:49",
  message: "Backend CORS configuration",
  data: {
    frontendUrl: process.env.FRONTEND_URL || null,
    nodeEnv: process.env.NODE_ENV || null,
  },
});

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

app.listen(PORT, () => {
  sendDebugLog({
    hypothesisId: "H2",
    location: "backend/src/server.js:74",
    message: "Backend server started",
    data: { port: PORT },
  });
  console.log(`Server running on http://localhost:${PORT}`);
});
