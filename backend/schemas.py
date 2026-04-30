from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class SearchRequest(BaseModel):
    text: str
    is_url: bool = False


class SearchResponse(BaseModel):
    id: int
    input_text: str
    is_url: int
    prediction: str
    probability: float
    timestamp: datetime

    class Config:
        from_attributes = True


class AdminLogin(BaseModel):
    username: str
    password: str


class AdminUpdate(BaseModel):
    username: str
    password: Optional[str] = None


class DatasetInfo(BaseModel):
    id: int
    name: str
    dataset_label: Optional[str] = None
    total_entries: int
    filepath: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ProcessRequest(BaseModel):
    dataset_id: int


class TrainingSettings(BaseModel):
    dataset_id: int
    model_name: str = "Model Baru"

    # ── Algorithm Mode ────────────────────────────────────────────────
    # "indobert_only" | "indobert_umap" | "hybrid" (IndoBERT+UMAP+GAT)
    algorithm_mode: str = "hybrid"

    # ── IndoBERT Parameters ───────────────────────────────────────────
    indo_model_name: str = "indobenchmark/indobert-base-p2"
    max_seq_length: int = 128
    indo_learning_rate: float = 2e-5
    indo_epochs: int = 5               # Fine-tuning epochs
    indo_batch_size: int = 16
    weight_decay: float = 0.01
    warmup_ratio: float = 0.1
    indo_dropout: float = 0.1
    early_stop_patience: int = 3       # epochs without improvement before stop
    gradient_accumulation_steps: int = 4
    use_class_weights: bool = True     # auto class weight for imbalance

    # ── NEW: Anti-Overfitting & Reproducibility Parameters ────────────
    dropout_rate: float = 0.1          # classifier head dropout rate
    random_seed: int = 42              # global random seed for reproducibility
    indobert_hidden_dim: int = 768     # custom hidden dim for projection layers
    indobert_num_heads: int = 12       # custom attention heads for adapter layers

    # ── UMAP Parameters ───────────────────────────────────────────────
    use_umap: bool = True
    umap_n_components: int = 64
    umap_n_neighbors: int = 15
    umap_min_dist: float = 0.1
    umap_metric: str = "cosine"        # "cosine" | "euclidean" | "manhattan"
    umap_random_state: int = 42

    # ── GAT Parameters ────────────────────────────────────────────────
    use_gat: bool = True
    gat_hidden_dim: int = 256
    gat_num_heads: int = 8
    gat_dropout: float = 0.3
    gat_learning_rate: float = 1e-3
    gat_epochs: int = 50
    gat_num_layers: int = 2
    graph_construction: str = "knn"    # "knn" | "threshold"
    knn_k: int = 5

    # ── Split & Validation ────────────────────────────────────────────
    train_ratio: int = 80              # percentage
    test_ratio: int = 20              # percentage
    data_split_ratio: str = "80/20"   # legacy compat

    # Legacy fields kept for backward compatibility
    indo_fold: int = 5
    knn_k_neighbors: int = 10
    gat_hidden_channels: int = 64
    gat_num_heads_legacy: int = 4
    indo_epoch: int = 50


class PredictTextRequest(BaseModel):
    text: str
    model_id: Optional[int] = None


class PredictTextResponse(BaseModel):
    predicted_label: str
    predicted_class: int
    probabilities: List[float]
    model_name: str
    model_accuracy: float


class BulkPredictRequest(BaseModel):
    model_id: Optional[int] = None


class SinglePrediction(BaseModel):
    row_index: int
    text: str
    predicted_label: str
    predicted_class: int
    confidence: float          # max probability (0-100%)
    probabilities: List[float]


class BulkPredictResponse(BaseModel):
    total: int
    model_name: str
    model_accuracy: float
    predictions: List[SinglePrediction]
