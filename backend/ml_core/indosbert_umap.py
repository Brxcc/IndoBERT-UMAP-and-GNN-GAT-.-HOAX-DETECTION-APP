import torch
import torch.nn as nn
import torch.nn.functional as F
from sentence_transformers import SentenceTransformer
import umap
import numpy as np


# --- IndoSBERT Extractor --------------------------------------------------------
class IndoSBERTExtractor:
    """
    Ekstraksi embedding dari IndoSBERT pretrained model.
    Model dimuat sekali dan di-cache (singleton).
    """
    def __init__(self, model_name: str = "firqaaa/indo-sentence-bert-base"):
        print(f"Loading IndoSBERT: {model_name} ...")
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)

    def get_embeddings(
        self,
        texts: list,
        batch_size: int = 16,
        max_length: int = 128,
        pooling: str = "cls"           # Diabaikan, IndoSBERT mengurus pooling secara internal
    ) -> list:
        """
        Mengekstrak embedding dari teks menggunakan IndoSBERT.

        Args:
            texts:      List teks input.
            batch_size: Jumlah teks per batch.
            max_length: Panjang token maksimum.
            pooling:    (Diabaikan untuk IndoSBERT, model menghasilkan fixed sentence embedding).

        Returns:
            List numpy array embedding (shape: [len(texts), 768])
        """
        print(f"  IndoSBERT: Memproses {len(texts)} teks...")
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_tensor=False
        )
        return embeddings.tolist()


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
_extractor_cache: dict = {}     # model_name -> IndoSBERTExtractor instance


def get_indosbert(model_name: str = "firqaaa/indo-sentence-bert-base") -> IndoSBERTExtractor:
    """
    Mengembalikan instance IndoSBERTExtractor yang di-cache per model_name.
    Mencegah reload model berkali-kali saat penggunaan berulang.
    """
    global _extractor_cache
    if model_name not in _extractor_cache:
        _extractor_cache[model_name] = IndoSBERTExtractor(model_name=model_name)
    return _extractor_cache[model_name]
