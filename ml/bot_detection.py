import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
from scipy.stats import pearsonr
import traceback

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests

# Create a directory for model storage if it doesn't exist
os.makedirs('models', exist_ok=True)

# Path to save the trained model and scaler
MODEL_PATH = 'models/bot_detection_rf_model.pkl'
SCALER_PATH = 'models/bot_detection_scaler.pkl'

def print_dataframe_info(df, title="DataFrame Info"):
    """
    Print comprehensive information about a DataFrame for debugging
    """
    print(f"\n{title}")
    print("-" * 50)
    print("Columns:", list(df.columns))
    print("Data Types:\n", df.dtypes)
    print("First few rows:\n", df.head())
    print("-" * 50)

def train_random_forest_model():
    """
    Train a Random Forest model on the provided dataset
    """
    try:
        # Load the training data
        data = pd.read_csv('behaviour1.csv')
        
        # Print initial dataframe info for debugging
        print_dataframe_info(data, "Original Training Data")
        
        # Remove any unnamed index columns
        data.drop(['Unnamed: 0'], axis=1, inplace=True)
        
        # Print dataframe info after column removal
        print_dataframe_info(data, "Cleaned Training Data")
        
        # Verify columns before splitting
        print("Columns before splitting:", list(data.columns))
        
        # Split features and target
        X = data.drop(['isBot'], axis=1)
        y = data['isBot']
        
        # Print feature information
        print_dataframe_info(X, "Features Before Scaling")
        
        # Scale the features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train the Random Forest model with optimized hyperparameters
        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'  # Handle class imbalance
        )
        
        # Fit the model
        model.fit(X_scaled, y)
        
        # Save the model and scaler for future use
        joblib.dump(model, MODEL_PATH)
        joblib.dump(scaler, SCALER_PATH)
        
        # Save feature names for reference
        with open('models/feature_names.txt', 'w') as f:
            f.write('\n'.join(X.columns))
        
        return model, scaler, X.columns
    except Exception as e:
        print(f"Error in model training: {e}")
        traceback.print_exc()
        raise

def load_or_train_model():
    """
    Load the model if it exists, otherwise train a new one
    """
    try:
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            model = joblib.load(MODEL_PATH)
            scaler = joblib.load(SCALER_PATH)
            
            # Load feature names
            with open('models/feature_names.txt', 'r') as f:
                feature_names = f.read().splitlines()
            
            print("Loaded existing model and scaler")
            return model, scaler, feature_names
        else:
            print("Training new model...")
            return train_random_forest_model()
    except Exception as e:
        print(f"Error loading/training model: {e}")
        traceback.print_exc()
        return train_random_forest_model()

def preprocess_mouse_data(data, expected_features):
    """
    Process mouse movement data to extract features for bot detection
    """
    # Extract x and y coordinates
    x_coords = data.get('xCoordinates', [])
    y_coords = data.get('yCoordinates', [])
    
    # Ensure we have enough data points
    if len(x_coords) < 10 or len(y_coords) < 10:
        return None, "Insufficient mouse movement data"
    
    # Calculate x-y correlation (a strong bot indicator)
    try:
        corr, _ = pearsonr(x_coords, y_coords)
        xyCorrelation = corr
    except:
        xyCorrelation = 0  # Default if calculation fails
    
    # Prepare features dictionary
    features_dict = {
        'sessionDuration': data.get('sessionDuration', 0),
        'xyCorrelation': xyCorrelation,
        'typingSpeed': data.get('typingSpeed', 0),
        'interKeyDelayAvg': data.get('interKeyDelayAvg', 0),
        'totalKeystrokes': data.get('totalKeystrokes', 0),
        'typingSpeedCPM': data.get('typingSpeedCPM', 0)
    }
    
    # Ensure all expected features are present
    features = pd.DataFrame({col: [features_dict.get(col, 0)] for col in expected_features})
    
    print("Preprocessed Features:")
    print(features)
    
    return features, None

# Load or train the model when the application starts
model, scaler, feature_names = load_or_train_model()

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    API endpoint to receive mouse data and return bot prediction
    """
    try:
        # Get data from request
        data = request.get_json()
        
        # Print received data for debugging
        print("Received Data:", data)
        
        # Preprocess the data
        features, error = preprocess_mouse_data(data, feature_names)
        
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        # Scale the features
        features_scaled = scaler.transform(features)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        prediction_proba = model.predict_proba(features_scaled)[0][1]  # Probability of being a bot
        
        # Return prediction
        return jsonify({
            'success': True,
            'isBot': int(prediction),
            'botProbability': float(prediction_proba),
            'features': features.to_dict(orient='records')[0]
        })
    
    except Exception as e:
        print(f"Prediction error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)