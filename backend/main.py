from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AntiHOAX Admin API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import auth, public, admin_data, admin_pipeline

app.include_router(auth.router)
app.include_router(public.router)
app.include_router(admin_data.router)
app.include_router(admin_pipeline.router)

@app.get("/")
def read_root():
    return {"message": "AntiHOAX API Backend Up"}
