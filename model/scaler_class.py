import numpy as np
from sklearn.preprocessing import StandardScaler

class SimpleScaler:
    def __init__(self):
        self.scaler = StandardScaler()
        
    def fit(self, X):
        self.scaler.fit(X)
        
    def transform(self, X):
        return self.scaler.transform(X)
        
    def __getstate__(self):
        state = self.scaler.__getstate__()
        return {'scaler_state': state}
        
    def __setstate__(self, state):
        if isinstance(state, dict) and 'scaler_state' in state:
            self.scaler = StandardScaler()
            self.scaler.__setstate__(state['scaler_state'])
        else:
            # Handle legacy state format
            self.scaler = StandardScaler()
            self.scaler.__setstate__(state) 