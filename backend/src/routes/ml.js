const express = require("express");
const router = express.Router();
const axios = require("axios");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");

const getMlApi = () => process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

router.use(auth, roleGuard("teacher"));

// ==========================================
// 🔹 Individual Prediction
// ==========================================
router.post("/predict", async (req, res) => {
  try {
    const response = await axios.post(`${getMlApi()}/predict`, req.body);

    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error("ML Predict Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to get prediction from ML service"
    });
  }
});

// ==========================================
// 🔹 Batch Prediction
// ==========================================
router.post("/predict/batch", async (req, res) => {
  try {
    const response = await axios.post(`${getMlApi()}/predict/batch`, req.body);

    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error("ML Batch Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Batch prediction failed"
    });
  }
});

// ==========================================
// 🔹 Get Model Metrics
// ==========================================
router.get("/metrics", async (req, res) => {
  try {
    const response = await axios.get(`${getMlApi()}/metrics`);

    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error("ML Metrics Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch metrics"
    });
  }
});

module.exports = router;
