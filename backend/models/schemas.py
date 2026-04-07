from pydantic import BaseModel, Field
from typing import List, Dict, Any, Union, Optional

class DatasetInfo(BaseModel):
    filename: str
    num_rows: int
    num_columns: int
    columns: List[str]
    dtypes: Dict[str, str]
    head: List[Dict[str, Any]]

class ColumnStats(BaseModel):
    name: str
    col_type: str
    missing_count: int
    missing_percent: float
    unique_values: int
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None

class AnalysisResponse(BaseModel):
    stats: List[ColumnStats]
    correlation_matrix: Dict[str, Dict[str, Optional[float]]]

class TrainRequest(BaseModel):
    target_column: str

class TrainResponse(BaseModel):
    model_type: str
    features: List[str]
    score: float
    metric_name: str
    feature_importances: Dict[str, float]

class PredictRequest(BaseModel):
    features: Dict[str, Union[float, int, str]]

class PredictResponse(BaseModel):
    prediction: Union[float, int, str]
    model_type: str
