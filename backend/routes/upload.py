from fastapi import APIRouter, File, UploadFile, HTTPException
from backend.services.data_processing import save_uploaded_file, get_dataset_info
from backend.models.schemas import DatasetInfo
from backend.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.post("/", response_model=DatasetInfo)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        logger.warning(f"Invalid file format uploaded: {file.filename}")
        raise HTTPException(status_code=400, detail="Invalid file format. Only CSV files are allowed.")
    
    try:
        contents = await file.read()
        logger.info(f"Processing uploaded file: {file.filename}")
        dataset_info = save_uploaded_file(contents, file.filename)
        return dataset_info
    except Exception as e:
        logger.error(f"Error processing CSV: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error reading CSV file: {str(e)}")

@router.get("/info", response_model=DatasetInfo)
async def get_info():
    try:
        return get_dataset_info("uploaded_dataset.csv")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No dataset uploaded.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
