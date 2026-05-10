"""
Build CLIP embedding database từ ảnh đã crawl.

Pipeline:
  1. Đọc tất cả ảnh trong data/gallery/<dish>/
  2. Encode bằng CLIP → vector 512-dim
  3. Normalize L2 (cho cosine similarity)
  4. Lưu thành:
     - data/embeddings/index.faiss   (FAISS index)
     - data/embeddings/labels.json    (label cho mỗi vector)

Usage:
    python scripts/build_embeddings.py
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Optional

import numpy as np
import torch
from PIL import Image, ImageOps

# Path setup
sys.path.insert(0, str(Path(__file__).parent.parent))

import faiss
from transformers import CLIPModel, CLIPProcessor

CLIP_MODEL_NAME = "openai/clip-vit-base-patch32"
EMBEDDING_DIM = 512
BATCH_SIZE = 32
VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def load_image_safe(path: Path) -> Optional[Image.Image]:
    """Load + preprocess giống production (EXIF, center crop). Skip ảnh < 100x100."""
    try:
        img = Image.open(path).convert("RGB")
        img = ImageOps.exif_transpose(img)
        w, h = img.size
        if w < 100 or h < 100:
            return None  # Ảnh quá nhỏ, skip
        # Center crop vuông
        side = min(w, h)
        img = img.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
        return img
    except Exception as e:
        print(f"  ⚠️  Skip {path.name}: {e}")
        return None


def main():
    project_root = Path(__file__).parent.parent
    gallery_dir = project_root / "data" / "gallery"
    output_dir = project_root / "data" / "embeddings"
    output_dir.mkdir(parents=True, exist_ok=True)

    if not gallery_dir.exists() or not any(gallery_dir.iterdir()):
        print("❌ Chưa có ảnh trong data/gallery. Chạy: python scripts/crawl_food_images.py")
        sys.exit(1)

    # ─── Load CLIP ───
    print(f"📦 Loading CLIP model {CLIP_MODEL_NAME}...")
    model = CLIPModel.from_pretrained(CLIP_MODEL_NAME)
    processor = CLIPProcessor.from_pretrained(CLIP_MODEL_NAME)
    model.eval()
    print("✅ CLIP loaded.\n")

    # ─── Collect images ───
    image_paths: list[tuple[Path, str]] = []
    for dish_dir in sorted(gallery_dir.iterdir()):
        if not dish_dir.is_dir():
            continue
        dish_name = dish_dir.name.replace("_", " ")
        files = [f for f in dish_dir.iterdir() if f.suffix.lower() in VALID_EXTS]
        for f in files:
            image_paths.append((f, dish_name))
        print(f"  📁 {dish_name}: {len(files)} ảnh")

    print(f"\n🎯 Total: {len(image_paths)} ảnh từ {len(set(l for _, l in image_paths))} món")
    if not image_paths:
        print("❌ Không có ảnh hợp lệ.")
        sys.exit(1)

    # ─── Encode in batches ───
    print(f"\n🔧 Encoding {len(image_paths)} ảnh (batch={BATCH_SIZE})...")
    start = time.time()
    all_embeddings: list[np.ndarray] = []
    all_labels: list[str] = []
    all_paths: list[str] = []

    for batch_start in range(0, len(image_paths), BATCH_SIZE):
        batch = image_paths[batch_start:batch_start + BATCH_SIZE]
        batch_imgs = []
        batch_labels = []
        batch_paths = []
        for path, label in batch:
            img = load_image_safe(path)
            if img is None:
                continue
            batch_imgs.append(img)
            batch_labels.append(label)
            batch_paths.append(str(path.relative_to(project_root)))

        if not batch_imgs:
            continue

        inputs = processor(images=batch_imgs, return_tensors="pt")
        with torch.no_grad():
            features = model.get_image_features(**inputs)
            # L2 normalize → cosine similarity = dot product
            features = features / features.norm(dim=-1, keepdim=True)
        embeddings = features.cpu().numpy().astype("float32")

        all_embeddings.append(embeddings)
        all_labels.extend(batch_labels)
        all_paths.extend(batch_paths)

        progress = (batch_start + len(batch)) / len(image_paths) * 100
        elapsed = time.time() - start
        print(f"  → {batch_start + len(batch)}/{len(image_paths)} ({progress:.1f}%) - {elapsed:.1f}s")

    embeddings_np = np.vstack(all_embeddings)
    print(f"\n✅ Encoded shape: {embeddings_np.shape} (took {time.time() - start:.1f}s)")

    # ─── Build FAISS index ───
    print("\n🏗️  Building FAISS index (IndexFlatIP for cosine sim)...")
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    index.add(embeddings_np)
    print(f"✅ FAISS index: {index.ntotal} vectors")

    # ─── Save ───
    index_path = output_dir / "index.faiss"
    labels_path = output_dir / "labels.json"
    faiss.write_index(index, str(index_path))
    with open(labels_path, "w", encoding="utf-8") as f:
        json.dump({
            "labels": all_labels,
            "paths": all_paths,
            "model": CLIP_MODEL_NAME,
            "dim": EMBEDDING_DIM,
        }, f, ensure_ascii=False, indent=2)

    print(f"\n💾 Saved:")
    print(f"   - {index_path}")
    print(f"   - {labels_path}")
    print(f"\n📊 Distribution:")
    from collections import Counter
    dist = Counter(all_labels)
    for label, count in sorted(dist.items(), key=lambda x: -x[1]):
        print(f"   {label}: {count}")
    print("\n🚀 Restart server để dùng k-NN retrieval mới!")


if __name__ == "__main__":
    main()
