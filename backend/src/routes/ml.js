const express = require("express");
const router = express.Router();
const axios = require("axios");
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
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");

const getMlApi = () => process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

router.use(auth, roleGuard("teacher"));

// ==========================================
// 🔹 Individual Prediction
// ==========================================
router.post("/predict", async (req, res) => {
  try {
    const targetUrl = `${getMlApi()}/predict`;
    sendDebugLog({
      hypothesisId: "H4",
      location: "backend/src/routes/ml.js:34",
      message: "Proxying ML predict request",
      data: { targetUrl, bodyKeys: Object.keys(req.body || {}) },
    });
    const response = await axios.post(targetUrl, req.body);

    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    sendDebugLog({
      hypothesisId: "H4",
      location: "backend/src/routes/ml.js:47",
      message: "ML predict proxy failed",
      data: { error: error.message },
    });
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
