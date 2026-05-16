import requests
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import random

router = APIRouter(prefix="/public", tags=["Public"])

@router.post("/predict", response_model=schemas.SearchResponse)
def predict_hoax(request: schemas.SearchRequest, db: Session = Depends(get_db)):
    text_to_process = request.text
    
    # Extract text from URL using BeautifulSoup if it's a URL
    if request.is_url:
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
            res = requests.get(request.text, headers=headers, timeout=15)
            res.raise_for_status()
            soup = BeautifulSoup(res.content, 'html.parser')
            # Extract paragraphs
            paragraphs = soup.find_all('p')
            extracted = " ".join([p.get_text() for p in paragraphs])
            if not extracted.strip():
                raise HTTPException(status_code=400, detail="No text could be extracted from this URL.")
            text_to_process = extracted[:2000] # Limiting size for DB & ML
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process URL: {str(e)}")
            
    # --- Integration Point: ML Core ---
    try:
        from routes.admin_pipeline import _load_model_and_predict
        
        # Get the best trained model
        record = db.query(models.ModelTrainingResult).filter(
            models.ModelTrainingResult.best_model_path != None
        ).order_by(models.ModelTrainingResult.timestamp.desc()).first()

        if not record:
            raise HTTPException(status_code=404, detail="Sistem belum memiliki model AI yang dilatih.")

        preds = _load_model_and_predict([text_to_process], record, db)
        p = preds[0]
        
        # p["predicted_label"] is typically "Hoaks" or "Fakta" (or "Hoax" / "Non-Hoax")
        is_hoax = p["predicted_label"].lower() in ["hoaks", "hoax"]
        label = "Hoax" if is_hoax else "Non-Hoax"
        prob = p["confidence"] / 100.0 # Convert percentage to 0-1 scale
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
    
    # Save History
    db_history = models.SearchHistory(
        input_text=request.text,
        is_url=1 if request.is_url else 0,
        prediction=label,
        probability=prob
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    
    return db_history

@router.get("/history", response_model=list[schemas.SearchResponse])
def get_public_history(db: Session = Depends(get_db), limit: int = 50):
    return db.query(models.SearchHistory).order_by(models.SearchHistory.timestamp.desc()).limit(limit).all()

@router.delete("/history/{history_id}")
def delete_history_item(history_id: int, db: Session = Depends(get_db)):
    """Delete a single history entry by ID."""
    item = db.query(models.SearchHistory).filter(models.SearchHistory.id == history_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="History entry not found.")
    db.delete(item)
    db.commit()
    return {"message": "History entry deleted successfully."}

@router.delete("/history")
def clear_all_history(db: Session = Depends(get_db)):
    """Delete all public search history."""
    deleted = db.query(models.SearchHistory).delete()
    db.commit()
    return {"message": f"{deleted} history entries deleted successfully."}
