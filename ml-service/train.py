import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
import joblib
import os
import json

LABEL_MAP = {
    0: "At Risk",
    1: "Average",
    2: "Good"
}

# ---------------- MOCK DATA ---------------- #
def generate_mock_data(n_samples=2500):
    np.random.seed(42)
    y = np.random.choice([0, 1, 2], size=n_samples, p=[0.2, 0.5, 0.3])

    data = []
    for label in y:
        if label == 2:
            values = [88, 86, 91, 89, 87, 84]
        elif label == 1:
            values = [68, 70, 66, 69, 74, 67]
        else:
            values = [48, 52, 45, 50, 61, 54]

        noise = np.random.normal(0, 4, size=6)
        row = list(np.array(values) + noise)
        row.append(label)
        data.append(row)

    cols = [
        'assignment_score', 'exam_score', 'final_marks', 'avg_marks',
        'attendance', 'past_performance', 'target'
    ]

    return pd.DataFrame(data, columns=cols)


# ---------------- TRAIN ---------------- #
def train_model(use_real_data=False):

    if use_real_data:
        print("Using real dataset (implement mapping here)")
        # 👉 Replace this with actual dataset processing
        df = generate_mock_data(2000)  # fallback for now
    else:
        df = generate_mock_data(2000)

    X = df.drop('target', axis=1)
    y = df['target']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    model = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=250,
                    max_depth=14,
                    min_samples_split=4,
                    random_state=42,
                ),
            ),
        ]
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)

    print(f"Accuracy: {acc}")

    os.makedirs("models", exist_ok=True)

    joblib.dump(model, "models/rf_model.pkl")

    # ✅ Save metrics
    with open("models/metrics.json", "w") as f:
        json.dump({
            "accuracy": acc,
            "report": report
        }, f, indent=4)

    print("Model + metrics saved!")


if __name__ == "__main__":
    train_model()
