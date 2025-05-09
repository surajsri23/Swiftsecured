from flask import Flask, request, jsonify, Response, send_from_directory
import pandas as pd
import pickle
import sqlite3
from datetime import datetime
import os
import logging
from flask_cors import CORS
import time
import json
import numpy as np

app = Flask(__name__, static_folder='.', template_folder='.')
CORS(app)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_PATH = os.path.join(BASE_DIR, 'swiftsecure.log')
DB_PATH = os.path.join(BASE_DIR, 'database/transactions.db')

# Setup logging
logging.basicConfig(filename=LOG_PATH, level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load model and scaler
try:
    with open(os.path.join(BASE_DIR, 'model/fraud_model_final.pkl'), 'rb') as f:
        model = pickle.load(f)
    with open(os.path.join(BASE_DIR, 'model/scaler.pkl'), 'rb') as f:
        scaler = pickle.load(f)
    logger.info("Model and scaler loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model or scaler: {str(e)}")
    raise

# Initialize database
def init_db():
    try:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS predictions
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      timestamp TEXT,
                      prediction INTEGER,
                      probability REAL)''')
        conn.commit()
        conn.close()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise

# Home Route
@app.route('/')
def home():
    init_db()
    logger.info("Home endpoint accessed")
    return send_from_directory('.', 'index.html')

# Static File Serving
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# Predict Single Transaction
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or not isinstance(data, dict):
            raise ValueError("Invalid JSON data")
        
        logger.info(f"Incoming prediction request: {data}")
        
        feature_order = ['Time', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9',
                         'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18',
                         'V19', 'V20', 'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27',
                         'V28', 'Amount']

        # Ensure order and missing columns
        ordered_data = {key: float(data.get(key, 0)) for key in feature_order}
        missing = set(feature_order) - set(data.keys())
        if missing:
            logger.warning(f"Missing features filled with 0: {missing}")

        df = pd.DataFrame([ordered_data])

        X_scaled = scaler.transform(df)
        pred = model.predict(X_scaled)[0]
        prob = model.predict_proba(X_scaled)[0][1]

        # Save to database
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO predictions (timestamp, prediction, probability) VALUES (?, ?, ?)",
                  (datetime.now().isoformat(), int(pred), float(prob)))
        conn.commit()
        conn.close()

        logger.info(f"Prediction completed: {pred}, Probability: {prob}")
        return jsonify({'prediction': int(pred), 'probability': float(prob)})
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': f"Prediction failed: {str(e)}"}), 400

# Upload and Batch Predict CSV
@app.route('/upload', methods=['POST'])
def upload():
    try:
        if 'file' not in request.files:
            raise ValueError("No file uploaded")

        file = request.files['file']
        if file.filename == '':
            raise ValueError("No selected file")
        if file.content_length > 200 * 1024 * 1024:
            raise ValueError("File too large - max 200MB")

        logger.debug(f"File uploaded: {file.filename}")
        df = pd.read_csv(file)

        if df.empty:
            raise ValueError("CSV file is empty")
        if len(df) > 300000:
            raise ValueError("Too many rows - maximum 300,000 allowed")

        feature_order = ['Time', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9',
                         'V10', 'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18',
                         'V19', 'V20', 'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27',
                         'V28', 'Amount']

        if 'Class' in df.columns:
            df = df.drop(columns=['Class'])

        if list(df.columns) != feature_order:
            raise ValueError(f"CSV columns must match (after dropping 'Class' if present): {feature_order}")

        X_scaled = scaler.transform(df)
        preds = model.predict(X_scaled)
        probs = model.predict_proba(X_scaled)[:, 1]

        # Save batch predictions
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        for pred, prob in zip(preds, probs):
            c.execute("INSERT INTO predictions (timestamp, prediction, probability) VALUES (?, ?, ?)",
                      (datetime.now().isoformat(), int(pred), float(prob)))
        conn.commit()
        conn.close()

        logger.info(f"Batch prediction completed: {len(preds)} records")
        return jsonify({'predictions': preds.tolist(), 'probabilities': probs.tolist()})
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'error': f"Upload failed: {str(e)}"}), 400

# History Route
@app.route('/history', methods=['GET'])
def history():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT id, timestamp, prediction, probability FROM predictions ORDER BY timestamp DESC LIMIT 10")
        rows = c.fetchall()

        c.execute("SELECT COUNT(*) FROM predictions WHERE prediction = 1")
        fraud_count = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM predictions")
        total_count = c.fetchone()[0]

        conn.close()

        fraud_rate = fraud_count / total_count if total_count else 0

        history_list = [{'id': row[0], 'timestamp': row[1], 'prediction': row[2], 'probability': row[3]}
                        for row in rows]

        logger.info("Fetched history")
        return jsonify({'history': history_list, 'fraud_rate': fraud_rate})
    except Exception as e:
        logger.error(f"History fetch error: {str(e)}")
        return jsonify({'error': f"History fetch failed: {str(e)}"}), 400

# Tips and Alerts
@app.route('/alerts', methods=['GET'])
def alerts():
    try:
        alert_list = [
            {"id": 1, "tip": "Watch for suspicious patterns like rapid small transactions."},
            {"id": 2, "tip": "Skimming devices on ATMs can steal your card data—check before use."},
            {"id": 3, "tip": "Unexpected merchant charges? Could be fraud—report it fast."},
            {"id": 4, "tip": "Phishing emails trick you into giving card info—verify sources."}
        ]
        logger.info("Alerts fetched")
        return jsonify(alert_list)
    except Exception as e:
        logger.error(f"Alerts error: {str(e)}")
        return jsonify({'error': f"Alerts fetch failed: {str(e)}"}), 400

# Clear Database
@app.route('/clear_db', methods=['POST'])
def clear_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("DELETE FROM predictions")
        conn.commit()
        conn.close()
        logger.info("Database cleared")
        return jsonify({'message': 'Database cleared successfully'})
    except Exception as e:
        logger.error(f"Clear DB error: {str(e)}")
        return jsonify({'error': f"Clear DB failed: {str(e)}"}), 400

# Real-time Alerts
@app.route('/realtime_alerts')
def realtime_alerts():
    def event_stream():
        while True:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("""SELECT id, timestamp, prediction, probability
                         FROM predictions
                         WHERE timestamp > datetime('now', '-5 minutes') AND prediction = 1""")
            frauds = c.fetchall()
            conn.close()
            if frauds:
                data = [{'id': row[0], 'timestamp': row[1], 'probability': row[3]} for row in frauds]
                yield f"data: {json.dumps(data)}\n\n"
            else:
                yield "data: []\n\n"
            time.sleep(5)

    logger.info("Real-time alert stream started")
    return Response(event_stream(), mimetype="text/event-stream")

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
