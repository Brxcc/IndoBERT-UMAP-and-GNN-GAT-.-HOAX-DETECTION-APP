from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from database import Base


class Admin(Base):
    __tablename__ = "admins"
    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)


class SearchHistory(Base):
    __tablename__ = "search_history"
    id          = Column(Integer, primary_key=True, index=True)
    input_text  = Column(String)
    is_url      = Column(Integer, default=0)
    prediction  = Column(String)
    probability = Column(Float)
    timestamp   = Column(DateTime, default=datetime.utcnow)


class Dataset(Base):
    __tablename__ = "datasets"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String)           # original filename
    dataset_label = Column(String, nullable=True)  # user-supplied friendly name
    total_entries = Column(Integer)
    filepath      = Column(String)
    timestamp     = Column(DateTime, default=datetime.utcnow)


class PreprocessedLog(Base):
    __tablename__ = "preprocessed_logs"
    id           = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String)
    version      = Column(String)
    filepath     = Column(String)
    timestamp    = Column(DateTime, default=datetime.utcnow)


class ModelTrainingResult(Base):
    __tablename__ = "model_training_results"
    id              = Column(Integer, primary_key=True, index=True)
    model_name      = Column(String, default="Model Baru")
    dataset_id      = Column(Integer)
    split_ratio     = Column(String)
    accuracy        = Column(Float)
    precision       = Column(Float)
    recall          = Column(Float)
    f1_score        = Column(Float)
    mcc             = Column(Float, nullable=True)
    macro_average   = Column(Float, nullable=True)
    weighted_average= Column(Float, nullable=True)
    roc_auc         = Column(Float, nullable=True)
    mean_std        = Column(Float, nullable=True)
    algorithm_mode  = Column(String, default="hybrid")
    settings_json   = Column(Text)
    epoch_logs_json = Column(Text, nullable=True)   # per-epoch log array as JSON
    best_model_path = Column(String, nullable=True)
    timestamp       = Column(DateTime, default=datetime.utcnow)


class TestingHistory(Base):
    __tablename__ = "testing_history"
    id           = Column(Integer, primary_key=True, index=True)
    input_type   = Column(String)          # "text" | "file"
    filename     = Column(String, nullable=True)
    model_id     = Column(Integer, nullable=True)
    model_name   = Column(String)
    total_rows   = Column(Integer, default=1)
    result_json  = Column(Text, nullable=True)     # JSON array of predictions
    accuracy     = Column(Float, nullable=True)
    precision    = Column(Float, nullable=True)
    recall       = Column(Float, nullable=True)
    f1_score     = Column(Float, nullable=True)
    mcc          = Column(Float, nullable=True)
    macro_average= Column(Float, nullable=True)
    weighted_average= Column(Float, nullable=True)
    roc_auc      = Column(Float, nullable=True)
    mean_std     = Column(Float, nullable=True)
    timestamp    = Column(DateTime, default=datetime.utcnow)
