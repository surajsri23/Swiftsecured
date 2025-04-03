# models.py
import numpy as np

class SimpleModel:
    def predict(self, X):
        return np.zeros(len(X))
    
    def predict_proba(self, X):
        return np.array([[0.9, 0.1] for _ in range(len(X))])

class SimpleScaler:
    def transform(self, X):
        return X