import sys
import numpy as np
from ml_core.indosbert_umap import get_indosbert

def test_encode():
    print("Testing IndoSBERT Encoding...")
    extractor = get_indosbert("firqaaa/indo-sentence-bert-base")
    texts = ["Ini adalah contoh kalimat berita hoax."]
    
    embeddings = extractor.get_embeddings(texts)
    
    assert len(embeddings) == 1
    assert len(embeddings[0]) == 768
    print(f"Success! Output dimension: {len(embeddings[0])}")
    print(f"Sample embedding (first 5 elements): {embeddings[0][:5]}")

if __name__ == "__main__":
    test_encode()
