"""
Download dataset 30VNFoods (Vietnamese Foods) từ Kaggle dùng kagglehub.

Dataset: https://www.kaggle.com/datasets/quandang/vietnamese-foods
Size: ~1.5GB, 17,581 ảnh, 30 món Việt phổ biến đã được verify.

Yêu cầu:
  1. Tài khoản Kaggle (free): https://www.kaggle.com
  2. API token mới (KGAT_...) tại Settings → API → Create New Token
  3. Set environment variable:
       export KAGGLE_API_TOKEN=KGAT_xxxxxxxxxxxxxxx
     hoặc lưu vào: ~/.kaggle/access_token

Usage:
    export KAGGLE_API_TOKEN=KGAT_xxxxx
    python scripts/download_dataset.py
"""
from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

KAGGLE_DATASET = "quandang/vietnamese-foods"
TARGET_DIR = "data/gallery"


# Mapping từ tên folder dataset (English/no-tone) → tên Việt có dấu
LABEL_MAPPING = {
    "banh beo": "bánh bèo",
    "banh bot loc": "bánh bột lọc",
    "banh can": "bánh căn",
    "banh canh": "bánh canh",
    "banh chung": "bánh chưng",
    "banh cuon": "bánh cuốn",
    "banh duc": "bánh đúc",
    "banh gio": "bánh giò",
    "banh khot": "bánh khọt",
    "banh mi": "bánh mì thịt",
    "banh pia": "bánh pía",
    "banh tet": "bánh tét",
    "banh trang nuong": "bánh tráng nướng",
    "banh xeo": "bánh xèo",
    "bun bo hue": "bún bò Huế",
    "bun dau mam tom": "bún đậu mắm tôm",
    "bun mam": "bún mắm",
    "bun rieu": "bún riêu",
    "bun thit nuong": "bún thịt nướng",
    "ca kho to": "cá kho tộ",
    "canh chua": "canh chua cá",
    "cao lau": "cao lầu",
    "chao long": "cháo lòng",
    "com tam": "cơm tấm",
    "goi cuon": "gỏi cuốn",
    "hu tieu": "hủ tiếu",
    "mi quang": "mì quảng",
    "nem chua": "nem chua",
    "pho": "phở bò",
    "xoi xeo": "xôi xéo",
}


def check_credentials():
    """Verify Kaggle token có sẵn (env var hoặc file)."""
    if os.environ.get("KAGGLE_API_TOKEN"):
        print("✅ Found KAGGLE_API_TOKEN env var")
        return
    token_file = Path.home() / ".kaggle" / "access_token"
    if token_file.exists():
        token = token_file.read_text().strip()
        os.environ["KAGGLE_API_TOKEN"] = token
        print(f"✅ Loaded token từ {token_file}")
        return
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    if kaggle_json.exists():
        print(f"✅ Found legacy {kaggle_json}")
        return

    print("❌ Chưa cấu hình Kaggle API token.")
    print()
    print("📋 Hướng dẫn:")
    print("   1. Đăng nhập https://www.kaggle.com")
    print("   2. Vào Settings → API → 'Create New Token'")
    print("   3. Copy token (dạng KGAT_xxx) và chạy:")
    print("      export KAGGLE_API_TOKEN=KGAT_xxxxxxxxxxxxxxx")
    print("   4. Hoặc lưu vào file:")
    print("      mkdir -p ~/.kaggle")
    print("      echo KGAT_xxxx > ~/.kaggle/access_token")
    print("      chmod 600 ~/.kaggle/access_token")
    sys.exit(1)


def download_dataset() -> Path:
    """Download dataset bằng kagglehub."""
    try:
        import kagglehub
    except ImportError:
        print("❌ Chưa cài kagglehub. Chạy: pip install kagglehub")
        sys.exit(1)

    print(f"📥 Downloading {KAGGLE_DATASET} (~1.5GB)...")
    print("   ⏳ Mất 5-10 phút lần đầu, lần sau dùng cache.")
    print()

    try:
        path = kagglehub.dataset_download(KAGGLE_DATASET)
    except Exception as e:
        print(f"❌ Download lỗi: {e}")
        sys.exit(1)

    print(f"✅ Downloaded to: {path}")
    return Path(path)


def organize_to_gallery(source_dir: Path):
    """Reorganize dataset structure → data/gallery/<dish_vi>/*.jpg

    Dataset 30VNFoods structure:
        Train/
          Banh beo/
            *.jpg
          ...
        Test/
        Validate/
    """
    project_root = Path(__file__).parent.parent
    gallery_dir = project_root / TARGET_DIR
    gallery_dir.mkdir(parents=True, exist_ok=True)

    # Tìm tất cả folder con
    all_dish_dirs: dict[str, list[Path]] = {}
    for sub in source_dir.rglob("*"):
        if not sub.is_dir():
            continue
        folder_name = sub.name.lower().strip()
        if folder_name in {"train", "test", "validate", "validation", "val"}:
            continue
        if folder_name in LABEL_MAPPING:
            all_dish_dirs.setdefault(folder_name, []).append(sub)

    if not all_dish_dirs:
        print("❌ Không tìm thấy folder món ăn nào trong dataset.")
        print(f"   Source: {source_dir}")
        print("   Cấu trúc folder hiện tại:")
        for sub in source_dir.iterdir():
            if sub.is_dir():
                print(f"   - {sub.name}")
        sys.exit(1)

    print(f"\n📋 Tìm thấy {len(all_dish_dirs)} món, đang sắp xếp...")
    total_copied = 0
    for folder_name, dirs in sorted(all_dish_dirs.items()):
        vi_name = LABEL_MAPPING[folder_name]
        target_folder = gallery_dir / vi_name.replace(" ", "_").replace("/", "_")
        target_folder.mkdir(parents=True, exist_ok=True)

        copied = 0
        for src_dir in dirs:
            for img_file in src_dir.iterdir():
                if img_file.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
                    continue
                target_name = f"{src_dir.parent.name}_{img_file.name}"
                target_path = target_folder / target_name
                if target_path.exists():
                    continue
                try:
                    shutil.copy2(img_file, target_path)
                    copied += 1
                except Exception as e:
                    print(f"  ⚠️  Skip {img_file.name}: {e}")

        print(f"  📁 {vi_name}: {copied} ảnh")
        total_copied += copied

    print(f"\n✅ Tổng cộng {total_copied} ảnh đã được sắp xếp.")
    print(f"📂 {gallery_dir}")
    print(f"\n🚀 Bước tiếp: python scripts/build_embeddings.py")


def main():
    check_credentials()
    source_dir = download_dataset()
    organize_to_gallery(source_dir)


if __name__ == "__main__":
    main()
