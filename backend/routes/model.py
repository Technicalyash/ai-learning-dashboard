from fastapi import APIRouter, HTTPException
from backend.services.ml_engine import train_model, predict
from backend.models.schemas import TrainRequest, TrainResponse, PredictRequest, PredictResponse
from backend.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.post("/train", response_model=TrainResponse)
async def api_train_model(request: TrainRequest):
    try:
        result = train_model(request.target_column)
        return TrainResponse(**result)
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/predict", response_model=PredictResponse)
async def api_predict(request: PredictRequest):
    try:
        result = predict(request.features)
        return PredictResponse(**result)
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
