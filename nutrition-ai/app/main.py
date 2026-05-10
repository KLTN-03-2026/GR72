"""
Nutrition AI Service — FastAPI
Endpoints chính:
  GET  /health           — health check
  POST /classify-food    — upload ảnh → trả về món + dinh dưỡng
  GET  /foods            — list món đã hỗ trợ
  GET  /stats            — thống kê DB
"""
from __future__ import annotations

# Fix OpenMP conflict giữa torch + faiss trên macOS — phải set TRƯỚC khi import
import os
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")

from typing import List, Optional

from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .classifier import smart_classify
from .nutrition_db import (
    NUTRITION_DB,
    VIETNAMESE_FOOD_NUTRITION,
    estimate_total_nutrition,
    get_nutrition,
)

app = FastAPI(
    title="Nutrition AI Service",
    description="Smart food classifier: Food-101 ViT + CLIP zero-shot tiếng Việt + image preprocessing",
    version="2.0.0",
)

# CORS — cho FE (port 3001) và BE (port 8009) gọi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:8009"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_IMAGE_SIZE_MB = 10

# Mount gallery để FE có thể xem ảnh similar
GALLERY_DIR = Path(__file__).parent.parent / "data" / "gallery"
if GALLERY_DIR.exists():
    app.mount("/gallery", StaticFiles(directory=str(GALLERY_DIR)), name="gallery")


class FoodPrediction(BaseModel):
    label_raw: str
    label_vi: Optional[str]
    confidence: float
    source: Optional[str] = None  # "food101" | "clip"
    nutrition_per_100g: Optional[dict]
    estimated_total: Optional[dict]
    category: Optional[str]
    tip: Optional[str]
    has_data: bool


class SimilarImage(BaseModel):
    path: Optional[str]
    label: str
    label_vi: Optional[str]
    similarity: float
    url: Optional[str]


class ClassifyResponse(BaseModel):
    top: FoodPrediction
    alternatives: List[FoodPrediction]
    model: str
    method: str  # "food101" | "clip" | "hybrid" | "knn"
    used_fallback: bool
    similar_images: List[SimilarImage] = []


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "nutrition-ai",
        "version": "2.0.0",
        "features": ["food101", "clip-zero-shot", "preprocessing"],
    }


@app.get("/stats")
def stats():
    return {
        "total_foods": len(NUTRITION_DB) + len(VIETNAMESE_FOOD_NUTRITION),
        "food101_mapped": len(NUTRITION_DB),
        "vietnamese_foods": len(VIETNAMESE_FOOD_NUTRITION),
    }


@app.get("/foods")
def list_foods():
    """List tất cả món ăn được hỗ trợ với dinh dưỡng."""
    foods = []
    for label, data in NUTRITION_DB.items():
        foods.append({"label": label, **data})
    for label, data in VIETNAMESE_FOOD_NUTRITION.items():
        foods.append({"label": label, **data})
    return {"total": len(foods), "foods": foods}


def _build_prediction(label: str, score: float, source: Optional[str] = None) -> FoodPrediction:
    nutrition = get_nutrition(label)
    if nutrition:
        per_100g = {
            "calories": nutrition["calories"],
            "protein": nutrition["protein"],
            "carbs": nutrition["carbs"],
            "fat": nutrition["fat"],
        }
        return FoodPrediction(
            label_raw=label,
            label_vi=nutrition["name_vi"],
            confidence=round(score, 4),
            source=source,
            nutrition_per_100g=per_100g,
            estimated_total=estimate_total_nutrition(nutrition),
            category=nutrition.get("category"),
            tip=nutrition.get("tip"),
            has_data=True,
        )
    return FoodPrediction(
        label_raw=label,
        label_vi=label.replace("_", " ").title(),
        confidence=round(score, 4),
        source=source,
        nutrition_per_100g=None,
        estimated_total=None,
        category=None,
        tip=None,
        has_data=False,
    )


@app.post("/classify-food", response_model=ClassifyResponse)
async def classify_food(file: UploadFile = File(...)):
    """Upload ảnh món ăn → trả về top match + dinh dưỡng ước lượng.

    Pipeline:
      1. Image preprocessing (EXIF rotate, center crop, resize 384, autocontrast)
      2. Food-101 ViT classifier
      3. Nếu confidence < 0.55 → fallback CLIP zero-shot tiếng Việt
      4. Re-rank theo confidence
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File phải là ảnh (JPEG, PNG, WEBP).")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"Ảnh tối đa {MAX_IMAGE_SIZE_MB}MB.")

    try:
        result = smart_classify(image_bytes, top_k=5)
    except Exception as e:
        raise HTTPException(500, f"Lỗi phân loại ảnh: {str(e)}")

    raw_predictions = result["predictions"]
    if not raw_predictions:
        raise HTTPException(500, "Không nhận diện được món ăn nào.")

    predictions = [
        _build_prediction(p["label"], p["score"], p.get("source"))
        for p in raw_predictions
    ]

    method = result["method"]
    model_desc = {
        "food101": "Food-101 ViT (nateraw/food)",
        "clip": "CLIP zero-shot tiếng Việt",
        "hybrid": "Food-101 + CLIP (kết hợp)",
        "knn": "k-NN retrieval từ gallery (1500+ ảnh thực)",
    }.get(method, "Smart classifier")

    # Build similar images với URL public
    similar_raw = result.get("similar_images", [])
    similar_images = []
    for s in similar_raw:
        path = s.get("path")
        # path là relative từ project root, vd "data/gallery/phở_bò/000001.jpg"
        # → URL public: /gallery/phở_bò/000001.jpg
        url = None
        if path and path.startswith("data/gallery/"):
            url = "/" + path.replace("data/gallery/", "gallery/", 1)
        nutrition = get_nutrition(s["label"])
        similar_images.append(SimilarImage(
            path=path,
            label=s["label"],
            label_vi=nutrition["name_vi"] if nutrition else s["label"],
            similarity=round(s["similarity"], 4),
            url=url,
        ))

    return ClassifyResponse(
        top=predictions[0],
        alternatives=predictions[1:],
        model=model_desc,
        method=method,
        used_fallback=result["used_fallback"],
        similar_images=similar_images,
    )
