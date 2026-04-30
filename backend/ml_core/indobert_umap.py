import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel
import umap
import numpy as np


# --- IndoBERT Extractor --------------------------------------------------------
class IndoBERTExtractor:
    """
    Ekstraksi embedding dari IndoBERT pretrained model.
    Mendukung tiga strategi pooling: CLS, Mean, Max.
    Model dimuat sekali dan di-cache (singleton).
    """
    def __init__(self, model_name: str = "indobenchmark/indobert-base-p2"):
        print(f"Loading IndoBERT: {model_name} ...")
        self.model_name = model_name
        self.tokenizer  = AutoTokenizer.from_pretrained(model_name)
        self.model      = AutoModel.from_pretrained(model_name)
        self.model.eval()

    def get_embeddings(
        self,
        texts: list,
        batch_size: int = 16,
        max_length: int = 128,
        pooling: str = "cls"           # "cls" | "mean" | "max"
    ) -> list:
        """
        Mengekstrak embedding dari teks menggunakan IndoBERT.

        Args:
            texts:      List teks input.
            batch_size: Jumlah teks per batch.
            max_length: Panjang token maksimum.
            pooling:    Strategi pooling representasi kalimat.
                        - "cls"  : token [CLS] (default, standar BERT)
                        - "mean" : rata-rata semua token
                        - "max"  : nilai maksimum per dimensi

        Returns:
            List numpy array embedding (shape: [len(texts), hidden_size])
        """
        device     = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self.model.to(device)
        embeddings = []
        total      = len(texts)

        for i in range(0, total, batch_size):
            batch   = texts[i: i + batch_size]
            encoded = self.tokenizer(
                batch,
                padding=True,
                truncation=True,
                max_length=max_length,
                return_tensors="pt",
            ).to(device)

            with torch.no_grad():
                outputs = self.model(**encoded)
                hidden  = outputs.last_hidden_state  # (B, seq_len, hidden)

                if pooling == "mean":
                    # Rata-rata token, exclude padding
                    mask    = encoded["attention_mask"].unsqueeze(-1).float()
                    summed  = (hidden * mask).sum(dim=1)
                    counts  = mask.sum(dim=1).clamp(min=1e-9)
                    batch_emb = (summed / counts).cpu().numpy()
                elif pooling == "max":
                    # Max pooling, exclude padding (set pad to -inf)
                    mask      = (1 - encoded["attention_mask"].unsqueeze(-1).float()) * -1e9
                    pooled, _ = (hidden + mask).max(dim=1)
                    batch_emb = pooled.cpu().numpy()
                else:  # "cls" default
                    batch_emb = hidden[:, 0, :].cpu().numpy()

                embeddings.extend(batch_emb)

            done = min(i + batch_size, total)
            print(f"  IndoBERT [{pooling}]: {done}/{total} teks terproses")

        return embeddings


# --- UMAP Reducer -------------------------------------------------------------
class UMAPReducer:
    """
    Reduksi dimensi menggunakan UMAP.
    Mendukung berbagai distance metric: cosine, euclidean, manhattan, dll.
    """
    def __init__(
        self,
        n_components: int = 64,
        n_neighbors: int  = 15,
        min_dist: float   = 0.1,
        metric: str       = "cosine",
        random_state: int = 42,
    ):
        self.reducer = umap.UMAP(
            n_components=n_components,
            n_neighbors=n_neighbors,
            min_dist=min_dist,
            metric=metric,
            random_state=random_state,
            low_memory=True,
        )

    def fit_transform(self, embeddings: np.ndarray) -> np.ndarray:
        in_dim  = np.array(embeddings).shape[1]
        out_dim = self.reducer.n_components
        print(f"  UMAP: {in_dim}D -> {out_dim}D  (metric={self.reducer.metric})")
        result = self.reducer.fit_transform(embeddings)
        return np.array(result, dtype=np.float32)

    def transform(self, embeddings: np.ndarray) -> np.ndarray:
        """Inferensi tanpa fit ulang."""
        result = self.reducer.transform(embeddings)
        return np.array(result, dtype=np.float32)


# --- Singleton Cache ----------------------------------------------------------
_extractor_cache: dict = {}     # model_name -> IndoBERTExtractor instance


def get_indobert(model_name: str = "indobenchmark/indobert-base-p2") -> IndoBERTExtractor:
    """
    Mengembalikan instance IndoBERTExtractor yang di-cache per model_name.
    Mencegah reload model berkali-kali saat penggunaan berulang.
    """
    global _extractor_cache
    if model_name not in _extractor_cache:
        _extractor_cache[model_name] = IndoBERTExtractor(model_name=model_name)
    return _extractor_cache[model_name]
