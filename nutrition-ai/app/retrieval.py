"""
k-NN retrieval: tìm ảnh tương tự trong gallery + vote-based classification.

Workflow runtime:
  1. User upload ảnh → encode bằng CLIP
  2. FAISS search top-k ảnh tương tự
  3. Vote: đếm label nào xuất hiện nhiều nhất trong top-k
  4. Score = weighted vote (similarity cao → vote nặng hơn)
  5. Trả về top dishes + similar images

Lợi ích so với zero-shot CLIP:
  - Không phụ thuộc text prompt → robust hơn
  - Update dễ: thêm món mới chỉ cần thêm folder + re-build embeddings
  - Bonus: hiển thị "ảnh tương tự" cho user verify
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import torch
from PIL import Image

# Lazy-loaded resources
_clip_model: Any = None
_clip_processor: Any = None
_faiss_index: Any = None
_labels: List[str] = []
_paths: List[str] = []


def _project_root() -> Path:
    return Path(__file__).parent.parent


def is_available() -> bool:
    """Check xem embeddings đã được build chưa."""
    root = _project_root()
    return (
        (root / "data" / "embeddings" / "index.faiss").exists()
        and (root / "data" / "embeddings" / "labels.json").exists()
    )


def _load_resources():
    """Lazy load FAISS index + CLIP model."""
    global _clip_model, _clip_processor, _faiss_index, _labels, _paths

    if _faiss_index is not None:
        return

    import faiss
    from transformers import CLIPModel, CLIPProcessor

    root = _project_root()
    index_path = root / "data" / "embeddings" / "index.faiss"
    labels_path = root / "data" / "embeddings" / "labels.json"

    print(f"[retrieval] Loading FAISS index from {index_path}...")
    _faiss_index = faiss.read_index(str(index_path))
    with open(labels_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    _labels = meta["labels"]
    _paths = meta.get("paths", [])
    print(f"[retrieval] {_faiss_index.ntotal} vectors, {len(set(_labels))} dishes")

    print("[retrieval] Loading CLIP for encoding...")
    _clip_model = CLIPModel.from_pretrained(meta.get("model", "openai/clip-vit-base-patch32"))
    _clip_processor = CLIPProcessor.from_pretrained(meta.get("model", "openai/clip-vit-base-patch32"))
    _clip_model.eval()
    print("[retrieval] Ready.")


def encode_image(image: Image.Image) -> np.ndarray:
    """Encode 1 ảnh thành CLIP vector L2-normalized."""
    _load_resources()
    inputs = _clip_processor(images=[image], return_tensors="pt")
    with torch.no_grad():
        features = _clip_model.get_image_features(**inputs)
        features = features / features.norm(dim=-1, keepdim=True)
    return features.cpu().numpy().astype("float32")


def retrieve(
    image: Image.Image,
    top_k_neighbors: int = 15,
    top_n_dishes: int = 5,
) -> Dict[str, Any]:
    """k-NN retrieval với vote-based classification.

    Returns:
        {
            "predictions": [{"label", "score", "votes", "source": "knn"}],
            "similar_images": [{"path", "label", "similarity"}],   # top-5 ảnh tương tự
            "total_neighbors": int,
        }
    """
    _load_resources()

    # 1. Encode query image
    query_emb = encode_image(image)

    # 2. FAISS search (Inner Product = cosine vì đã normalize)
    similarities, indices = _faiss_index.search(query_emb, top_k_neighbors)
    similarities = similarities[0]
    indices = indices[0]

    # 3. Weighted vote: similarity cao → trọng số lớn
    label_scores: Dict[str, float] = defaultdict(float)
    label_votes: Dict[str, int] = defaultdict(int)
    for sim, idx in zip(similarities, indices):
        if idx < 0 or idx >= len(_labels):
            continue
        label = _labels[idx]
        # softmax-like weighting: e^sim
        weight = float(np.exp(sim * 4))  # scale 4x để gap giữa các sim rõ hơn
        label_scores[label] += weight
        label_votes[label] += 1

    # Normalize → softmax probabilities
    total_score = sum(label_scores.values())
    if total_score > 0:
        for k in label_scores:
            label_scores[k] /= total_score

    # 4. Sort by score
    ranked = sorted(label_scores.items(), key=lambda x: x[1], reverse=True)
    predictions = [
        {
            "label": label,
            "score": float(score),
            "votes": label_votes[label],
            "source": "knn",
        }
        for label, score in ranked[:top_n_dishes]
    ]

    # 5. Top similar images (cho UI hiển thị "ảnh tương tự")
    similar_images = []
    seen_labels = set()
    for sim, idx in zip(similarities, indices):
        if idx < 0 or idx >= len(_labels):
            continue
        label = _labels[idx]
        # Mỗi món chỉ lấy 1 ảnh đại diện top similarity
        if label in seen_labels:
            continue
        seen_labels.add(label)
        similar_images.append({
            "path": _paths[idx] if idx < len(_paths) else None,
            "label": label,
            "similarity": float(sim),
        })
        if len(similar_images) >= 5:
            break

    return {
        "predictions": predictions,
        "similar_images": similar_images,
        "total_neighbors": int(top_k_neighbors),
    }
