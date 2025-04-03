import numpy as np
from sklearn.ensemble import RandomForestClassifier

class SimpleModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        
    def fit(self, X, y):
        self.model.fit(X, y)
        
    def predict(self, X):
        return self.model.predict(X)
        
    def predict_proba(self, X):
        return self.model.predict_proba(X)
        
    def __getstate__(self):
        state = self.model.__getstate__()
        return {'model_state': state}
        
    def __setstate__(self, state):
        if isinstance(state, dict) and 'model_state' in state:
            self.model = RandomForestClassifier()
            self.model.__setstate__(state['model_state'])
        else:
            # Handle legacy state format
            self.model = RandomForestClassifier()
            self.model.__setstate__(state) 