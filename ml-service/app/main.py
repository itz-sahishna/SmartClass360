from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
import numpy as np
import joblib
import os
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SmartClass 360 ML Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LABEL_MAP = {
    0: "At Risk",
    1: "Average",
    2: "Good"
}

MODEL_PATH = "models/rf_model.pkl"
model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None

# ---------------- REQUEST MODELS ---------------- #

class StudentData(BaseModel):
    roll_no: str
    assignment_score: float = Field(..., ge=0, le=100)
    exam_score: float = Field(..., ge=0, le=100)
    final_marks: float = Field(..., ge=0, le=100)
    avg_marks: float = Field(..., ge=0, le=100)
    attendance: float = Field(..., ge=0, le=100)
    past_performance: float = Field(..., ge=0, le=100)


class BatchRequest(BaseModel):
    students: List[StudentData]


# ---------------- RESPONSE ---------------- #

def get_factors(s, prediction):
    factors = []
    if s.attendance < 75:
        factors.append("Low attendance")
    if s.assignment_score < 60:
        factors.append("Weak assignment score")
    if s.exam_score < 60:
        factors.append("Low mid-term performance")
    if s.final_marks < 60:
        factors.append("Final marks trend needs improvement")
    if s.avg_marks < 60:
        factors.append("Low marks")
    return factors or ["General performance trend"]


def predict_grade(avg_marks: float) -> str:
    if avg_marks >= 90:
        return "A+"
    if avg_marks >= 80:
        return "A"
    if avg_marks >= 70:
        return "B"
    if avg_marks >= 60:
        return "C"
    if avg_marks >= 50:
        return "D"
    return "F"


# ---------------- ENDPOINTS ---------------- #

@app.get("/")
def root():
    return {"status": "ok"}


# ✅ Individual prediction
@app.post("/predict")
def predict(student: StudentData):

    features = [[
        student.assignment_score,
        student.exam_score,
        student.final_marks,
        student.avg_marks,
        student.attendance,
        student.past_performance,
    ]]

    pred = model.predict(features)[0]
    prob = np.max(model.predict_proba(features)[0])
    predicted_grade = predict_grade(student.avg_marks)

    return {
        "roll_no": student.roll_no,
        "prediction": LABEL_MAP[pred],
        "confidence": float(prob),
        "predicted_grade": predicted_grade,
        "pass_prediction": predicted_grade != "F",
        "factors": get_factors(student, LABEL_MAP[pred])
    }


# ✅ Batch prediction
@app.post("/predict/batch")
def predict_batch(req: BatchRequest):

    results = []

    for s in req.students:
        features = [[
            s.assignment_score,
            s.exam_score,
            s.final_marks,
            s.avg_marks,
            s.attendance,
            s.past_performance,
        ]]

        pred = model.predict(features)[0]
        prob = np.max(model.predict_proba(features)[0])
        predicted_grade = predict_grade(s.avg_marks)

        results.append({
            "roll_no": s.roll_no,
            "prediction": LABEL_MAP[pred],
            "confidence": float(prob),
            "predicted_grade": predicted_grade,
            "pass_prediction": predicted_grade != "F",
            "factors": get_factors(s, LABEL_MAP[pred])
        })

    return {"results": results}


# ✅ Metrics endpoint
@app.get("/metrics")
def get_metrics():
    if os.path.exists("models/metrics.json"):
        with open("models/metrics.json") as f:
            return json.load(f)
    return {"error": "No metrics found"}
