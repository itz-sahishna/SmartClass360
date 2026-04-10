const express = require("express");
const cors = require("cors");

const app = express();

// ================================
// Middleware
// ================================
app.use(cors());
app.use(express.json());

// ================================
// Routes Import
// ================================
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");
const teacherRoutes = require("./routes/teacher");
const aiRoutes = require("./routes/ai");
const mlRoutes = require("./routes/ml");

// ================================
// Routes Usage
// ================================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/ai", aiRoutes);

// ✅ ML ROUTES (IMPORTANT)
app.use("/api/ml", mlRoutes);

// ================================
// Root Route
// ================================
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// ================================
// Server
// ================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});