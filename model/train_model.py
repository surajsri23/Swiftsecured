import pandas as pd
import numpy as np
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import pickle
import time

# Load data
X_train = pd.read_csv('X_train_scaled.csv')
y_train = pd.read_csv('y_train.csv').values.ravel()
X_test = pd.read_csv('X_test_scaled.csv')
y_test = pd.read_csv('y_test.csv').values.ravel()

# Final Random Forest
rf_model = RandomForestClassifier(random_state=42, n_estimators=100, n_jobs=-1)
rf_model.fit(X_train, y_train)
start = time.time()
rf_pred = rf_model.predict(X_test)
print("Final Random Forest Results:")
print(confusion_matrix(y_test, rf_pred))
print(classification_report(y_test, rf_pred))
print("Prediction time (seconds):", time.time() - start)

# Save as final
with open('fraud_model_final.pkl', 'wb') as f:
    pickle.dump(rf_model, f)
print("Final model saved: fraud_model_final.pkl")

# Test load
with open('fraud_model_final.pkl', 'rb') as f:
    loaded_model = pickle.load(f)
final_pred = loaded_model.predict(X_test)
print("Load works:", (rf_pred == final_pred).all())