from fastapi import APIRouter, HTTPException
from backend.services.data_processing import get_analysis_stats
from backend.models.schemas import AnalysisResponse
from backend.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.get("/", response_model=AnalysisResponse)
async def get_analysis():
    try:
        stats, corr_matrix = get_analysis_stats()
        return AnalysisResponse(stats=stats, correlation_matrix=corr_matrix)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating analysis: {str(e)}")
