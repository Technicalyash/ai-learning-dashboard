import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, r2_score
from backend.services.data_processing import get_dataframe
from backend.utils.logger import get_logger

logger = get_logger(__name__)

MODELS_DIR = Path("backend/data/models")
CURRENT_MODEL_FILE = MODELS_DIR / "pipeline.joblib"
CURRENT_FEATURES_FILE = MODELS_DIR / "features.joblib" # To store the exact features expected

def train_model(target_column: str) -> dict:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    df = get_dataframe()
    
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in dataset.")
        
    y = df[target_column]
    X = df.drop(columns=[target_column])
    
    # Identify feature types
    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()
    
    logger.info(f"Numeric features: {numeric_features}")
    logger.info(f"Categorical features: {categorical_features}")

    # Determine problem type based on task requirements: "IF numeric -> regression ELSE -> classification"
    is_numeric_target = pd.api.types.is_numeric_dtype(y)
    
    # If target has very few unique values but is numeric, it might be classification, but let's stick to prompt literal
    problem_type = "regression" if is_numeric_target else "classification"
    
    # Build preprocessing pipeline
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='mean')),
        ('scaler', StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])

    # Select Model
    if problem_type == "regression":
        model = LinearRegression()
    else:
        model = DecisionTreeClassifier(random_state=42)

    # Full Pipeline
    clf_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('model', model)
    ])

    # Train test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    logger.info(f"Training {problem_type} pipeline...")
    clf_pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = clf_pipeline.predict(X_test)
    if problem_type == "regression":
        score = r2_score(y_test, y_pred)
        metric_name = "R²"
    else:
        score = accuracy_score(y_test, y_pred)
        metric_name = "Accuracy"
        
    logger.info(f"Model trained. {metric_name}: {score}")

    # Save pipeline and expected features to ensure feature consistency
    joblib.dump(clf_pipeline, CURRENT_MODEL_FILE)
    
    feature_info = {
        "features": X.columns.tolist(),
        "numeric": numeric_features,
        "categorical": categorical_features,
        "problem_type": problem_type,
        "target_column": target_column
    }
    joblib.dump(feature_info, CURRENT_FEATURES_FILE)

    # Extract feature importance if available
    importances = {}
    if problem_type == "classification":
        # For decision tree
        try:
            # We have to get feature names after one hot encoding
            # This can be tricky, but we can try:
            ohe = clf_pipeline.named_steps['preprocessor'].named_transformers_['cat'].named_steps['encoder']
            cat_feature_names = ohe.get_feature_names_out(categorical_features)
            all_features = numeric_features + list(cat_feature_names)
            
            tree_model = clf_pipeline.named_steps['model']
            importances_arr = tree_model.feature_importances_
            
            for name, imp in zip(all_features, importances_arr):
                importances[name] = float(imp)
                
            # Sort top 10
            importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True)[:10])
        except Exception as e:
            logger.error(f"Could not extract feature importances: {e}")
    elif problem_type == "regression":
        # For linear regression, we use coefficients as importance (absolute value)
        try:
            ohe = clf_pipeline.named_steps['preprocessor'].named_transformers_['cat'].named_steps['encoder']
            cat_feature_names = ohe.get_feature_names_out(categorical_features)
            all_features = numeric_features + list(cat_feature_names)
            
            lin_model = clf_pipeline.named_steps['model']
            coefs = np.abs(lin_model.coef_)
            
            for name, imp in zip(all_features, coefs):
                importances[name] = float(imp)
                
            importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True)[:10])
        except Exception as e:
            logger.error(f"Could not extract coefficients: {e}")

    return {
        "model_type": problem_type,
        "features": X.columns.tolist(),
        "score": score,
        "metric_name": metric_name,
        "feature_importances": importances
    }

def predict(input_features: dict) -> dict:
    if not CURRENT_MODEL_FILE.exists() or not CURRENT_FEATURES_FILE.exists():
        raise Exception("Model not trained yet. Please train the model first.")
        
    pipeline = joblib.load(CURRENT_MODEL_FILE)
    feature_info = joblib.load(CURRENT_FEATURES_FILE)
    
    expected_features = feature_info["features"]
    
    # Feature Consistency checks
    for feature in expected_features:
        if feature not in input_features:
            raise ValueError(f"Missing expected feature: '{feature}'")
            
    # Input may have extra keys, keep only expected features exactly in order
    ordered_input = {k: [input_features[k]] for k in expected_features}
    
    input_df = pd.DataFrame(ordered_input)
    logger.info(f"Received prediction input for {len(expected_features)} features.")
    
    try:
        prediction = pipeline.predict(input_df)[0]
    except Exception as e:
        logger.error(f"Prediction failed inside pipeline: {str(e)}")
        raise ValueError(f"Wrong data types or format in prediction inputs: {str(e)}")
        
    # Cast numpy types to native Python types for JSON serialization
    if isinstance(prediction, (np.integer, np.int64, np.int32)):
        prediction = int(prediction)
    elif isinstance(prediction, (np.floating, np.float64, np.float32)):
        prediction = float(prediction)
        
    return {
        "prediction": prediction,
        "model_type": feature_info["problem_type"],
        "score": None # score is computed during training
    }
