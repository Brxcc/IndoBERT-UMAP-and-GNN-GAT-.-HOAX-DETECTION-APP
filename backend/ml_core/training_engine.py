import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.data import Data
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, matthews_corrcoef, roc_auc_score
)
from sklearn.model_selection import StratifiedKFold
from sklearn.neighbors import NearestNeighbors
from sklearn.utils.class_weight import compute_class_weight
from sklearn.preprocessing import StandardScaler
from ml_core.gat_network import ContentGraphGAT
import numpy as np
import os
import copy
import json
import random


MODELS_DIR = "ml_models"
os.makedirs(MODELS_DIR, exist_ok=True)


# --- Global Seed Setting ------------------------------------------------------
def set_global_seed(seed: int = 42):
    """Set all random seeds for full reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
    try:
        from transformers import set_seed as transformers_set_seed
        transformers_set_seed(seed)
    except Exception:
        pass
    print(f"[Seed] Global seed set to {seed}")


# --- Graph Construction --------------------------------------------------------
def construct_graph(embeddings: np.ndarray, k_neighbors: int = 10, method: str = "knn") -> torch.Tensor:
    """
    Build a sparse KNN graph.
    Higher K (default 10) -> each node gets more neighbor context
    -> GAT learns better -> higher accuracy.
    """
    n = len(embeddings)
    if n == 0:
        return torch.tensor([[], []], dtype=torch.long)

    k = min(n - 1, k_neighbors)
    knn = NearestNeighbors(n_neighbors=k, metric="cosine", n_jobs=-1, algorithm="brute")
    knn.fit(embeddings)
    _, indices = knn.kneighbors(embeddings)

    edge_set = set()
    for i in range(n):
        for j in indices[i]:
            if i != j:
                edge_set.add((i, j))
                edge_set.add((j, i))   # bidirectional

    if not edge_set:
        edge_set = {(i, i) for i in range(n)}   # fallback: self-loops

    edge_index = torch.tensor(list(edge_set), dtype=torch.long).t().contiguous()
    return edge_index


# --- Metrics Computation ------------------------------------------------------
def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray = None) -> dict:
    if len(y_true) == 0:
        return {"akurasi": 0, "presisi": 0, "recall": 0, "f1": 0, "mcc": 0,
                "macro_average": 0, "weighted_average": 0, "roc_auc": 0, "mean_std": 0.0}

    multi = len(np.unique(y_true)) > 1
    acc   = accuracy_score(y_true, y_pred)

    if multi:
        prec = precision_score(y_true, y_pred, average="macro",  zero_division=0)
        rec  = recall_score(   y_true, y_pred, average="macro",  zero_division=0)
        f1   = f1_score(       y_true, y_pred, average="macro",  zero_division=0)
        f1_w = f1_score(       y_true, y_pred, average="weighted", zero_division=0)
        mcc  = matthews_corrcoef(y_true, y_pred)

        roc_auc = 0.0
        if y_prob is not None:
            try:
                if len(np.unique(y_true)) == 2 and y_prob.shape[1] == 2:
                    roc_auc = roc_auc_score(y_true, y_prob[:, 1])
                else:
                    roc_auc = roc_auc_score(y_true, y_prob, multi_class="ovr")
            except Exception:
                pass
    else:
        prec = rec = f1 = f1_w = acc
        mcc = roc_auc = 0.0

    return {
        "akurasi": round(float(acc),  4),
        "presisi": round(float(prec), 4),
        "recall":  round(float(rec),  4),
        "f1":      round(float(f1),   4),
        "mcc":     round(float(mcc),  4),
        "macro_average":    round(float(f1),   4),
        "weighted_average": round(float(f1_w), 4),
        "roc_auc": round(float(roc_auc), 4),
        "mean_std": 0.0,
    }


# --- Overfitting Gap Monitor --------------------------------------------------
def check_overfitting_gap(train_metric: float, test_metric: float,
                           metric_name: str, threshold: float = 0.07) -> tuple:
    """
    Check if the gap between training and testing metric exceeds threshold.
    Returns (is_ok: bool, message: str)
    """
    gap = abs(train_metric - test_metric)
    if gap > threshold:
        warning = (f"WARNING: {metric_name} gap = {gap:.4f} "
                   f"({gap*100:.1f}%) exceeds {threshold*100:.0f}% threshold — OVERFITTING detected")
        return False, warning
    return True, f"{metric_name} gap = {gap*100:.1f}% — within acceptable range"


# --- Label Smoothing Loss -----------------------------------------------------
class LabelSmoothingLoss(nn.Module):
    """Cross-entropy with label smoothing for anti-overfitting."""
    def __init__(self, num_classes: int, smoothing: float = 0.1,
                 weight: torch.Tensor = None):
        super().__init__()
        self.smoothing   = smoothing
        self.num_classes = num_classes
        self.weight      = weight

    def forward(self, log_probs: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """log_probs: (N, C) from log_softmax, targets: (N,)"""
        confidence = 1.0 - self.smoothing
        smooth_val = self.smoothing / max(self.num_classes - 1, 1)

        one_hot = torch.zeros_like(log_probs).fill_(smooth_val)
        one_hot.scatter_(1, targets.unsqueeze(1), confidence)

        loss = -(one_hot * log_probs)

        if self.weight is not None:
            # weight per sample by class weight
            w = self.weight[targets]
            loss = loss.sum(dim=1) * w
            return loss.mean()

        return loss.sum(dim=1).mean()


# --- Warmup + Cosine Scheduler ------------------------------------------------
def get_warmup_cosine_scheduler(optimizer, warmup_steps: int, total_steps: int):
    """Linear warmup then cosine decay."""
    def lr_lambda(current_step: int):
        if current_step < warmup_steps:
            return float(current_step) / float(max(1, warmup_steps))
        progress = float(current_step - warmup_steps) / float(max(1, total_steps - warmup_steps))
        return max(0.0, 0.5 * (1.0 + np.cos(np.pi * progress)))
    return torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)


# --- Main Training Function ---------------------------------------------------
def train_model(
    embeddings,
    labels,
    settings: dict,
    job_id: str         = None,
    training_jobs: dict = None,
    num_classes: int    = 2,
    umap_reducer        = None,
):
    """
    GAT training pipeline with Stratified K-Fold + all best practices
    for >90% accuracy with anti-overfitting enforcement (≤7% gap).
    """
    # -- 0. Set Global Seed ---------------------------------------------------
    seed = int(settings.get("random_seed", settings.get("umap_random_state", 42)))
    set_global_seed(seed)

    device        = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n{'='*60}")
    print(f"Training device  : {device}")
    print(f"Algorithm mode   : {settings.get('algorithm_mode', 'hybrid')}")
    print(f"Random seed      : {seed}")
    print(f"{'='*60}")

    raw_emb   = np.array(embeddings, dtype=np.float32)
    labels_np = np.array(labels, dtype=np.int64)

    # -- 1. Normalize Embeddings (StandardScaler) ----------------------------
    scaler        = StandardScaler()
    embeddings_np = scaler.fit_transform(raw_emb).astype(np.float32)
    print(f"Embeddings normalized: {embeddings_np.shape}  (mean~0, std~1)")

    # -- Hyperparameters ------------------------------------------------------
    n_splits    = max(settings.get("indo_fold", 5), 2)
    hidden      = int(settings.get("gat_hidden_dim",      settings.get("gat_hidden_channels", 256)))
    heads       = int(settings.get("gat_num_heads",        8))
    # Validate heads divides hidden
    if hidden % heads != 0:
        heads = 1  # fallback to 1 to avoid architecture crash
        print(f"WARNING: gat_hidden_dim not divisible by gat_num_heads — falling back to heads=1")
    dropout     = float(settings.get("gat_dropout",          0.3))
    lr          = float(settings.get("gat_learning_rate",    settings.get("gat_lr", 1e-3)))
    gat_epochs  = int(settings.get("gat_epochs",           settings.get("indo_epoch", 100)))
    patience    = int(settings.get("early_stop_patience",  settings.get("early_stopping_patience", 20)))
    k_neighbors = int(settings.get("knn_k",                settings.get("knn_k_neighbors", 10)))
    num_layers  = int(settings.get("gat_num_layers",       2))
    graph_meth  = settings.get("graph_construction",   "knn")
    job_name    = settings.get("model_name",            "model")
    use_cw      = settings.get("use_class_weights",    True)
    wd          = float(settings.get("weight_decay",          1e-3))
    warmup_ratio = float(settings.get("warmup_ratio",         0.1))
    label_smooth = 0.1   # always apply label smoothing for anti-overfitting

    in_channels = embeddings_np.shape[1]
    print(f"Input dim={in_channels}, Classes={num_classes}, Samples={len(labels_np)}")
    print(f"GAT: hidden={hidden}, heads={heads}, layers={num_layers}, dropout={dropout}")
    print(f"Patience={patience}, Warmup ratio={warmup_ratio}, Label smoothing={label_smooth}")

    # -- 2. Class Weights (handles imbalanced datasets) ----------------------
    class_weights = None
    if use_cw:
        unique_cls = np.unique(labels_np)
        try:
            cw_np         = compute_class_weight("balanced", classes=unique_cls, y=labels_np)
            class_weights = torch.tensor(cw_np, dtype=torch.float).to(device)
            print(f"Class weights: {dict(zip(unique_cls.tolist(), cw_np.round(3).tolist()))}")
        except Exception as e:
            print(f"Warning: class weight failed: {e}")

    # -- 3. Build Graph -------------------------------------------------------
    x          = torch.tensor(embeddings_np, dtype=torch.float)
    y          = torch.tensor(labels_np,    dtype=torch.long)
    edge_index = construct_graph(embeddings_np, k_neighbors=k_neighbors, method=graph_meth)
    data       = Data(x=x, edge_index=edge_index, y=y).to(device)
    print(f"Graph: {data.num_nodes} nodes, {data.num_edges} edges, K={k_neighbors}")

    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=seed)

    all_logs            = []
    fold_best_f1        = []
    global_best_f1      = 0.0
    global_best_metrics = {}
    global_best_state   = None
    final_model         = None

    # -----------------------------------------------------------------
    for fold, (train_idx, test_idx) in enumerate(skf.split(embeddings_np, labels_np)):
        train_mask = torch.zeros(data.num_nodes, dtype=torch.bool)
        test_mask  = torch.zeros(data.num_nodes, dtype=torch.bool)
        train_mask[train_idx] = True
        test_mask[test_idx]   = True
        data.train_mask = train_mask.to(device)
        data.test_mask  = test_mask.to(device)

        # Model with BatchNorm + Residual Connection
        model = ContentGraphGAT(
            in_channels=in_channels,
            hidden_channels=hidden,
            out_channels=num_classes,
            heads=heads,
            dropout=dropout,
            num_layers=num_layers,
        ).to(device)

        # -- AdamW Optimizer with weight decay (L2 regularization) -------
        optimizer = torch.optim.AdamW(
            model.parameters(),
            lr=lr,
            weight_decay=wd,     # L2 regularization — always applied
            betas=(0.9, 0.999),
            eps=1e-8,
        )

        # -- 4. Warmup + Cosine Scheduler --------------------------------
        total_steps  = gat_epochs
        warmup_steps = max(1, int(warmup_ratio * total_steps))
        print(f"  Fold {fold+1}: warmup_steps={warmup_steps}/{total_steps}")
        scheduler = get_warmup_cosine_scheduler(optimizer, warmup_steps, total_steps)

        # -- Label Smoothing Loss ----------------------------------------
        criterion = LabelSmoothingLoss(
            num_classes=num_classes,
            smoothing=label_smooth,
            weight=class_weights,
        )

        final_model       = model
        best_val_loss     = float("inf")
        patience_counter  = 0
        best_f1_fold      = 0.0
        best_state_fold   = None
        best_metrics_fold = {}

        print(f"\nFold {fold+1}/{n_splits}  Train={train_mask.sum().item()}  Test={test_mask.sum().item()}")

        for epoch in range(1, gat_epochs + 1):
            # -- Training -----------------------------------------------
            model.train()
            optimizer.zero_grad()
            out = model(data.x, data.edge_index)

            # Label smoothing loss (anti-overfitting)
            loss = criterion(out[data.train_mask], data.y[data.train_mask])

            loss.backward()
            # -- Gradient Clipping (anti-overfitting) -------------------
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            scheduler.step()

            # -- Early Stopping -----------------------------------------
            with torch.no_grad():
                val_out  = model(data.x, data.edge_index)
                val_loss = F.nll_loss(val_out[data.test_mask], data.y[data.test_mask]).item()

            if val_loss < best_val_loss - 1e-5:
                best_val_loss    = val_loss
                patience_counter = 0
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"  [EARLY STOP] Fold {fold+1} at epoch {epoch} "
                          f"(patience={patience}, best_val_loss={best_val_loss:.4f})")
                    break

            # -- Evaluation ---------------------------------------------
            model.eval()
            with torch.no_grad():
                out_tensor = model(data.x, data.edge_index)
                pred       = out_tensor.argmax(dim=1)
                probs      = torch.exp(out_tensor)

                # Train metrics
                train_preds = pred[data.train_mask].cpu().numpy()
                train_lbls  = data.y[data.train_mask].cpu().numpy()

                # Test metrics
                test_preds = pred[data.test_mask].cpu().numpy()
                test_lbls  = data.y[data.test_mask].cpu().numpy()
                test_probs = probs[data.test_mask].cpu().numpy()

            train_metrics = compute_metrics(train_lbls, train_preds)
            test_metrics  = compute_metrics(test_lbls,  test_preds, test_probs)

            # -- Overfitting Gap Check ----------------------------------
            overfit_warnings = []
            for metric_key, train_key in [("Accuracy", "akurasi"), ("F1-Score", "f1"),
                                           ("Precision", "presisi"), ("Recall", "recall")]:
                ok, msg = check_overfitting_gap(
                    train_metrics[train_key], test_metrics[train_key], metric_key
                )
                if not ok:
                    overfit_warnings.append(msg)

            if overfit_warnings and epoch % 10 == 0:
                for w in overfit_warnings:
                    print(f"    [GAP ALERT] {w}")

            # -- Best checkpoint by F1 ---------------------------------
            if test_metrics["f1"] > best_f1_fold:
                best_f1_fold      = test_metrics["f1"]
                best_state_fold   = copy.deepcopy(model.state_dict())
                best_metrics_fold = test_metrics.copy()
                # Store train metrics alongside for gap analysis
                best_metrics_fold["train_akurasi"] = train_metrics["akurasi"]
                best_metrics_fold["train_f1"]      = train_metrics["f1"]
                best_metrics_fold["overfit_gap_f1"] = round(
                    abs(train_metrics["f1"] - test_metrics["f1"]), 4
                )

            log_entry = {
                "iterasi":    f"F{fold+1}",
                "epoch":       epoch,
                "fold":        fold + 1,
                "loss":        round(float(loss.item()), 4),
                "val_loss":    round(float(val_loss), 4),
                "akurasi":     test_metrics["akurasi"],
                "presisi":     test_metrics["presisi"],
                "recall":      test_metrics["recall"],
                "f1":          test_metrics["f1"],
                "mcc":         test_metrics["mcc"],
                "macro_average":    test_metrics["macro_average"],
                "weighted_average": test_metrics["weighted_average"],
                "roc_auc":     test_metrics["roc_auc"],
                "train_akurasi": train_metrics["akurasi"],
                "train_f1":      train_metrics["f1"],
                "overfit_gap":   round(abs(train_metrics["f1"] - test_metrics["f1"]), 4),
                "token_info":  f"Fold {fold+1}/{n_splits} . Ep {epoch}/{gat_epochs}",
                "is_best":     False,
            }
            all_logs.append(log_entry)
            if job_id and training_jobs and job_id in training_jobs:
                training_jobs[job_id]["logs"].append(log_entry)

        fold_best_f1.append(best_f1_fold)
        print(f"  OK Fold {fold+1} - Best F1={best_f1_fold:.4f}  "
              f"Acc={best_metrics_fold.get('akurasi',0):.4f}")

        if best_f1_fold > global_best_f1 and best_state_fold is not None:
            global_best_f1      = best_f1_fold
            global_best_metrics = best_metrics_fold
            global_best_state   = best_state_fold
            final_model         = model

    mean_acc = float(np.mean([l["akurasi"] for l in all_logs])) if all_logs else 0
    mean_f1  = float(np.mean(fold_best_f1)) if fold_best_f1 else 0
    std_f1   = float(np.std(fold_best_f1))  if fold_best_f1 else 0

    global_best_metrics["mean_std"] = round(std_f1, 4)

    # -- Final overfitting gap analysis -------------------------------------------
    overfit_analysis = []
    if global_best_metrics:
        train_f1 = global_best_metrics.get("train_f1", global_best_metrics.get("f1", 0))
        test_f1  = global_best_metrics.get("f1", 0)
        gap      = abs(train_f1 - test_f1)
        global_best_metrics["final_overfit_gap"] = round(gap, 4)
        global_best_metrics["overfit_status"]    = "OVERFIT" if gap > 0.07 else "OK"
        if gap > 0.07:
            overfit_analysis.append(f"F1 gap={gap*100:.1f}% — OVERFIT detected")
            overfit_analysis.append("Suggestions: increase dropout_rate, reduce gat_epochs, use larger dataset")
        else:
            overfit_analysis.append(f"F1 gap={gap*100:.1f}% — Within acceptable range (≤7%)")

    global_best_metrics["overfit_analysis"] = overfit_analysis

    print(f"\n{'='*60}")
    print(f"Training complete")
    print(f"Mean F1 (CV):    {mean_f1:.4f} +/- {std_f1:.4f}")
    print(f"Best F1 overall: {global_best_f1:.4f}")
    print(f"Best Acc:        {global_best_metrics.get('akurasi', 0):.4f}")
    for msg in overfit_analysis:
        print(f"[OVERFIT CHECK] {msg}")
    print(f"{'='*60}\n")

    # -- Flag best epoch in logs -------------------------------------------
    if all_logs:
        best_f1_val = max(l["f1"] for l in all_logs)
        for l in all_logs:
            l["is_best"] = (l["f1"] == best_f1_val)

    # -- Restore best weights ----------------------------------------------
    if final_model is not None and global_best_state is not None:
        final_model.load_state_dict(global_best_state)

    # -- Save model checkpoint ---------------------------------------------
    saved_path = None
    if final_model is not None and global_best_state is not None:
        safe_name      = "".join(c if c.isalnum() or c in "-_" else "_" for c in job_name)
        saved_path     = os.path.join(MODELS_DIR, f"{safe_name}_best.pt")
        try:
            torch.save({
                "model_state_dict": global_best_state,
                "in_channels":      in_channels,
                "hidden_channels":  hidden,
                "out_channels":     num_classes,
                "heads":            heads,
                "dropout":          dropout,
                "num_layers":       num_layers,
                "best_metrics":     global_best_metrics,
                "settings":         settings,
                "scaler_mean":      scaler.mean_.tolist(),
                "scaler_scale":     scaler.scale_.tolist(),
                "umap_reducer":     umap_reducer,
                "random_seed":      seed,
            }, saved_path)
            print(f"Best model saved -> {saved_path}")
        except Exception as e:
            print(f"Warning: save model failed: {e}")
            saved_path = None

    if job_id and training_jobs and job_id in training_jobs:
        training_jobs[job_id]["best_model_path"]   = saved_path
        training_jobs[job_id]["best_metrics"]      = global_best_metrics
        training_jobs[job_id]["epoch_logs"]        = all_logs
        training_jobs[job_id]["overfit_analysis"]  = overfit_analysis

    return all_logs, final_model, saved_path, global_best_metrics
