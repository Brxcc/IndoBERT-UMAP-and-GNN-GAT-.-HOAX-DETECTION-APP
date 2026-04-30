from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import models, schemas, database

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    if token != "fake-super-secret-token":
        raise HTTPException(status_code=401, detail="Invalid token")
    # Using mock super admin
    return {"username": "admin"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # Check DB - Initialize default admin if completely empty
    admin = db.query(models.Admin).first()
    if not admin:
        default_admin = models.Admin(username="admin", password="admin123")
        db.add(default_admin)
        db.commit()
        db.refresh(default_admin)
        admin = default_admin

    if admin.username != form_data.username or admin.password != form_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kredensial tidak valid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"access_token": "fake-super-secret-token", "token_type": "bearer"}

@router.put("/admin")
def update_admin(user: schemas.AdminUpdate, db: Session = Depends(database.get_db), current_user = Depends(get_current_user)):
    admin = db.query(models.Admin).first()
    if not admin:
        admin = models.Admin(username="admin", password="admin123")
        db.add(admin)
        
    # Check if the desired username is already taken by a different row (if we had multi-admin)
    existing = db.query(models.Admin).filter(models.Admin.username == user.username, models.Admin.id != admin.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah dipakai.")
        
    admin.username = user.username
    if user.password:  # Only update password if provided
        admin.password = user.password
        
    db.commit()
    return {"message": "Pengaturan admin berhasil diperbarui"}
