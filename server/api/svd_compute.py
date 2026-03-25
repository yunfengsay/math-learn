import io
import os
import base64
import uuid
import tempfile

import numpy as np
from PIL import Image
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

router = APIRouter(prefix="/api")

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
TEMP_DIR = tempfile.mkdtemp(prefix="svd_uploads_")

# 内存缓存上传和内置图片的灰度矩阵
_image_cache: dict[str, np.ndarray] = {}


class MatrixInput(BaseModel):
    matrix: list[list[float]]


class CompressInput(BaseModel):
    image_id: str
    k: int


class EigenfacesInput(BaseModel):
    n_components: int = 20
    image_index: int | None = None


# --- SVD 矩阵计算 ---

@router.post("/svd/compute")
def compute_svd(data: MatrixInput):
    matrix = np.array(data.matrix, dtype=float)
    U, s, Vt = np.linalg.svd(matrix, full_matrices=False)
    return {
        "U": np.round(U, 6).tolist(),
        "sigma": np.round(s, 6).tolist(),
        "Vt": np.round(Vt, 6).tolist(),
    }


# --- 示例图片 ---

def _load_builtin_images():
    """加载 data/ 下的内置图片"""
    samples = []
    if not os.path.isdir(DATA_DIR):
        return samples
    for fname in sorted(os.listdir(DATA_DIR)):
        if not fname.lower().endswith(('.png', '.jpg', '.jpeg')):
            continue
        path = os.path.join(DATA_DIR, fname)
        img = Image.open(path).convert("L")
        img_id = f"builtin_{fname}"
        _image_cache[img_id] = np.array(img, dtype=float)
        # 生成缩略图
        thumb = img.copy()
        thumb.thumbnail((80, 80))
        buf = io.BytesIO()
        thumb.save(buf, format="PNG")
        samples.append({
            "id": img_id,
            "name": os.path.splitext(fname)[0],
            "thumbnail": base64.b64encode(buf.getvalue()).decode(),
        })
    return samples


@router.get("/samples")
def get_samples():
    samples = _load_builtin_images()
    return {"samples": samples}


# --- 图片上传 ---

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    content = await file.read()
    img = Image.open(io.BytesIO(content)).convert("L")
    # 限制大小避免计算过慢
    if max(img.size) > 512:
        img.thumbnail((512, 512))
    img_id = f"upload_{uuid.uuid4().hex[:8]}"
    _image_cache[img_id] = np.array(img, dtype=float)
    # 缩略图
    thumb = img.copy()
    thumb.thumbnail((80, 80))
    buf = io.BytesIO()
    thumb.save(buf, format="PNG")
    return {
        "id": img_id,
        "name": file.filename,
        "thumbnail": base64.b64encode(buf.getvalue()).decode(),
    }


# --- 图像 SVD 压缩 ---

def _matrix_to_base64(matrix: np.ndarray) -> str:
    matrix = np.clip(matrix, 0, 255).astype(np.uint8)
    img = Image.fromarray(matrix, mode="L")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


@router.post("/svd/image-compress")
def image_compress(data: CompressInput):
    if data.image_id not in _image_cache:
        return {"error": "image not found"}
    matrix = _image_cache[data.image_id]
    U, s, Vt = np.linalg.svd(matrix, full_matrices=False)
    k = max(1, min(data.k, len(s)))
    # 低秩近似
    compressed = U[:, :k] @ np.diag(s[:k]) @ Vt[:k, :]
    total_energy = float(np.sum(s ** 2))
    retained_energy = float(np.sum(s[:k] ** 2))
    m, n = matrix.shape
    # 原始存储: m*n 个 float64 (8 bytes each)
    original_bytes = m * n * 8
    # SVD 低秩存储: U[:,:k] (m*k) + s[:k] (k) + Vt[:k,:] (k*n), 每个 float64
    compressed_bytes = (m * k + k + k * n) * 8
    return {
        "compressed_image": _matrix_to_base64(compressed),
        "original_image": _matrix_to_base64(matrix),
        "singular_values": np.round(s, 4).tolist(),
        "k": k,
        "total_rank": len(s),
        "retained_ratio": round(retained_energy / total_energy, 6) if total_energy > 0 else 1.0,
        "shape": list(matrix.shape),
        "original_size_kb": round(original_bytes / 1024, 1),
        "compressed_size_kb": round(compressed_bytes / 1024, 1),
    }


# --- 特征脸 ---

@router.post("/svd/eigenfaces")
def eigenfaces(data: EigenfacesInput):
    from sklearn.datasets import fetch_lfw_people

    # 加载 LFW（缓存到本地）
    lfw = fetch_lfw_people(min_faces_per_person=20, resize=0.4)
    X = lfw.data
    target = lfw.target
    target_names = lfw.target_names.tolist()
    h, w = lfw.images.shape[1], lfw.images.shape[2]

    n = min(data.n_components, min(X.shape))

    # 中心化
    mean_face = X.mean(axis=0)
    X_centered = X - mean_face

    # SVD
    U, s, Vt = np.linalg.svd(X_centered, full_matrices=False)

    # 特征脸 = Vt 的前 n 行
    eigenface_images = []
    for i in range(n):
        face = Vt[i].reshape(h, w)
        # 归一化到 0-255
        face_norm = ((face - face.min()) / (face.max() - face.min()) * 255)
        eigenface_images.append(_matrix_to_base64(face_norm))

    # 3D 投影（前 3 个主成分）
    proj = U[:, :3] * s[:3]
    scatter_3d = [
        {"x": round(float(proj[i, 0]), 4),
         "y": round(float(proj[i, 1]), 4),
         "z": round(float(proj[i, 2]), 4),
         "label": int(target[i])}
        for i in range(len(target))
    ]

    # 重建
    reconstruction = None
    if data.image_index is not None and 0 <= data.image_index < len(X):
        coeffs = U[data.image_index, :n] * s[:n]
        reconstructed = mean_face + coeffs @ Vt[:n]
        reconstruction = {
            "original": _matrix_to_base64(X[data.image_index].reshape(h, w)),
            "reconstructed": _matrix_to_base64(reconstructed.reshape(h, w)),
        }

    explained = (s[:n] ** 2) / (s ** 2).sum()
    return {
        "eigenfaces": eigenface_images,
        "scatter_3d": scatter_3d,
        "target_names": target_names,
        "reconstruction": reconstruction,
        "explained_variance_ratio": np.round(explained, 6).tolist(),
        "face_shape": [h, w],
        "total_faces": len(X),
    }
