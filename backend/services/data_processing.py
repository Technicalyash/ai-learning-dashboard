import pandas as pd
import numpy as np
from pathlib import Path
from backend.models.schemas import DatasetInfo, ColumnStats
from backend.utils.logger import get_logger

logger = get_logger(__name__)

UPLOAD_DIR = Path("backend/data/uploads")
CURRENT_DATASET_FILE = UPLOAD_DIR / "dataset.csv"

def save_uploaded_file(contents: bytes, filename: str):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    with open(CURRENT_DATASET_FILE, "wb") as f:
        f.write(contents)
    
    # Read to validate and get basic info
    df = pd.read_csv(CURRENT_DATASET_FILE)
    
    # Clean duplicates as required by instructions
    initial_shape = df.shape
    df.drop_duplicates(inplace=True)
    if df.shape != initial_shape:
        logger.info(f"Dropped duplicates: {initial_shape[0] - df.shape[0]} rows removed.")
        df.to_csv(CURRENT_DATASET_FILE, index=False) # store cleaned data
    
    return get_dataset_info(filename, df)

def get_dataframe() -> pd.DataFrame:
    if not CURRENT_DATASET_FILE.exists():
        raise FileNotFoundError("No dataset uploaded.")
    return pd.read_csv(CURRENT_DATASET_FILE)

def get_dataset_info(original_filename: str, df: pd.DataFrame = None) -> DatasetInfo:
    if df is None:
        df = get_dataframe()
        
    dtypes_dict = {col: str(dtype) for col, dtype in df.dtypes.items()}
    head_preview = df.head(5).replace({np.nan: None}).to_dict(orient="records")
    
    return DatasetInfo(
        filename=original_filename,
        num_rows=df.shape[0],
        num_columns=df.shape[1],
        columns=df.columns.tolist(),
        dtypes=dtypes_dict,
        head=head_preview
    )

def get_analysis_stats() -> tuple[list[ColumnStats], dict]:
    df = get_dataframe()
    stats_list = []
    
    # We will compute stats for each column
    for col in df.columns:
        col_series = df[col]
        missing_count = int(col_series.isnull().sum())
        missing_percent = float(missing_count / len(col_series) * 100)
        unique_values = int(col_series.nunique())
        
        is_numeric = pd.api.types.is_numeric_dtype(col_series)
        col_type = "numeric" if is_numeric else "categorical"
        
        mean_val, median_val, std_val = None, None, None
        if is_numeric:
            mean_val = float(col_series.mean()) if pd.notnull(col_series.mean()) else None
            median_val = float(col_series.median()) if pd.notnull(col_series.median()) else None
            std_val = float(col_series.std()) if pd.notnull(col_series.std()) else None
            
        stats_list.append(ColumnStats(
            name=col,
            col_type=col_type,
            missing_count=missing_count,
            missing_percent=missing_percent,
            unique_values=unique_values,
            mean=mean_val,
            median=median_val,
            std=std_val
        ))
        
    numeric_df = df.select_dtypes(include=[np.number])
    corr_matrix = numeric_df.corr().replace({np.nan: None}).to_dict()
    
    return stats_list, corr_matrix
