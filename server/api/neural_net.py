import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/svd")

# 模拟一个简单的 3 层全连接网络
# 输入(8) -> 隐藏(16) -> 输出(4)
# 用固定种子保证每次结果一致
_rng = np.random.RandomState(42)
_W1 = _rng.randn(8, 16).astype(float)
_W2 = _rng.randn(16, 4).astype(float)

# 生成一组测试数据
_X_test = _rng.randn(100, 8)
_y_test = np.argmax(_X_test @ _W1 @ _W2, axis=1)

LAYERS = [
    {"name": "输入层 → 隐藏层", "input_dim": 8, "output_dim": 16},
    {"name": "隐藏层 → 输出层", "input_dim": 16, "output_dim": 4},
]


class NeuralNetInput(BaseModel):
    k: int
    layer_index: int = 0


def _accuracy(W1: np.ndarray, W2: np.ndarray) -> float:
    """计算简单前向传播的分类准确率"""
    preds = np.argmax(_X_test @ W1 @ W2, axis=1)
    return float(np.mean(preds == _y_test))


def _low_rank_approx(W: np.ndarray, k: int) -> np.ndarray:
    U, s, Vt = np.linalg.svd(W, full_matrices=False)
    k = max(1, min(k, len(s)))
    return U[:, :k] @ np.diag(s[:k]) @ Vt[:k, :]


@router.post("/neural-net")
def neural_net_svd(data: NeuralNetInput):
    W = _W1 if data.layer_index == 0 else _W2
    U, s, Vt = np.linalg.svd(W, full_matrices=False)
    k = max(1, min(data.k, len(s)))

    W_compressed = _low_rank_approx(W, k)

    # 计算两种精度
    if data.layer_index == 0:
        acc_orig = _accuracy(_W1, _W2)
        acc_comp = _accuracy(W_compressed, _W2)
    else:
        acc_orig = _accuracy(_W1, _W2)
        acc_comp = _accuracy(_W1, W_compressed)

    return {
        "layers": LAYERS,
        "singular_values": np.round(s, 4).tolist(),
        "k": k,
        "total_rank": len(s),
        "original_weights": np.round(W, 4).tolist(),
        "compressed_weights": np.round(W_compressed, 4).tolist(),
        "accuracy_original": round(acc_orig, 4),
        "accuracy_compressed": round(acc_comp, 4),
        "weight_shape": list(W.shape),
    }
