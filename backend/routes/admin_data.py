import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import pandas as pd
from typing import Optional

router = APIRouter(prefix="/admin", tags=["Admin Data Collector"])

UPLOAD_DIR = "datasets"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


def read_file_to_df(filepath: str) -> pd.DataFrame:
    """Read CSV or Excel file with automatic encoding fallback."""
    ext = os.path.splitext(filepath)[1].lower()
    if ext in (".xlsx", ".xls"):
        return pd.read_excel(filepath, engine="openpyxl")
    else:
        for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']:
            try:
                return pd.read_csv(filepath, encoding=encoding)
            except (UnicodeDecodeError, Exception):
                continue
        return pd.read_csv(filepath, encoding='latin-1', errors='replace')


@router.post("/dataset/upload", response_model=schemas.DatasetInfo)
def upload_dataset(
    file: UploadFile = File(...),
    dataset_name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Save file to disk
    filepath = os.path.join(UPLOAD_DIR, file.filename)
    with open(filepath, "wb") as buffer:
        buffer.write(file.file.read())

    # Count rows
    try:
        df = read_file_to_df(filepath)
        total_rows = len(df)
    except Exception:
        total_rows = 0

    dataset = models.Dataset(
        name=file.filename,
        dataset_label=dataset_name.strip() if dataset_name and dataset_name.strip() else None,
        total_entries=total_rows,
        filepath=filepath
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("/dataset/history", response_model=list[schemas.DatasetInfo])
def get_datasets(db: Session = Depends(get_db)):
    return db.query(models.Dataset).order_by(models.Dataset.timestamp.desc()).all()


@router.get("/dataset/{dataset_id}/download")
def download_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Download the raw dataset file."""
    dataset = db.query(models.Dataset).filter(models.Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if not dataset.filepath or not os.path.exists(dataset.filepath):
        raise HTTPException(status_code=404, detail="File not found on server")
    filename = os.path.basename(dataset.filepath)
    ext = os.path.splitext(filename)[1].lower()
    if ext in (".xlsx", ".xls"):
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        media_type = "text/csv"
    return FileResponse(dataset.filepath, media_type=media_type, filename=filename)


@router.delete("/dataset/{dataset_id}")
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(models.Dataset).filter(models.Dataset.id == dataset_id).first()
    if dataset:
        if os.path.exists(dataset.filepath):
            os.remove(dataset.filepath)
        db.delete(dataset)
        db.commit()
    return {"message": "Dataset deleted successfully"}
