import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
import pickle

# Load data
data = pd.read_csv('../dataset/creditcard.csv')
print("Data loaded!")
print("Original class counts:")
print(data['Class'].value_counts())

# Split features and target
X = data.drop('Class', axis=1)
y = data['Class']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print("Train size (before SMOTE):", X_train.shape)

# SMOTE
smote = SMOTE(random_state=42)
X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
print("Train size (after SMOTE):", X_train_smote.shape)
print("New class counts (train):")
print(pd.Series(y_train_smote).value_counts())

# Scale
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_smote)
X_test_scaled = scaler.transform(X_test)
print("Data scaled!")

# Save data
pd.DataFrame(X_train_scaled, columns=X.columns).to_csv('X_train_scaled.csv', index=False)
pd.DataFrame(X_test_scaled, columns=X.columns).to_csv('X_test_scaled.csv', index=False)
y_train_smote.to_csv('y_train.csv', index=False)
y_test.to_csv('y_test.csv', index=False)
print("Data saved!")

# Save scaler
with open('scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
print("Scaler saved as scaler.pkl!")