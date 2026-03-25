# SVD 交互式学习工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个交互式 Web 学习工具，通过可视化方式直观展示 SVD 在图像压缩、神经网络、降维/特征脸三个领域的应用。

**Architecture:** FastAPI 后端提供 SVD 计算和代码执行 API，React + Vite 前端提供 5 个交互式页面（公式讲解、代码沙盒、图像压缩、神经网络、降维特征脸）。前后端通过 REST API + base64 图像传输通信，`start.sh` 一键启动。

**Tech Stack:** Python (FastAPI, numpy, scipy, scikit-learn, Pillow), React + TypeScript + Vite (Bun), Plotly.js, Three.js, KaTeX, Monaco Editor

---

## File Structure

```
svd/
├── start.sh
├── server/
│   ├── pyproject.toml
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── svd_compute.py
│   │   ├── code_runner.py
│   │   └── neural_net.py
│   └── data/
│       └── (内置示例图片)
├── web/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.css
│       ├── api.ts
│       ├── pages/
│       │   ├── FormulaPage.tsx
│       │   ├── CodeSandbox.tsx
│       │   ├── ImageCompression.tsx
│       │   ├── NeuralNetwork.tsx
│       │   └── Eigenfaces.tsx
│       └── components/
│           ├── Layout.tsx
│           ├── TabNav.tsx
│           └── ImageUploader.tsx
```

---

### Task 1: 项目脚手架 — 后端

**Files:**
- Create: `server/pyproject.toml`
- Create: `server/main.py`
- Create: `server/api/__init__.py`

- [ ] **Step 1: 初始化 server 目录和 pyproject.toml**

```toml
# server/pyproject.toml
[project]
name = "svd-server"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "fastapi",
    "uvicorn",
    "numpy",
    "scipy",
    "scikit-learn",
    "Pillow",
    "python-multipart",
]

[project.scripts]
serve = "uvicorn main:app --reload --port 8000"
```

- [ ] **Step 2: 创建 main.py — FastAPI 入口**

```python
# server/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SVD Learning Tool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 3: 创建空的 api/__init__.py**

- [ ] **Step 4: 验证后端启动**

Run: `cd /Users/yunfeng/code/svd/server && uv run uvicorn main:app --port 8000 &`
然后: `curl http://localhost:8000/api/health`
Expected: `{"status":"ok"}`
关闭后端。

---

### Task 2: 项目脚手架 — 前端

**Files:**
- Create: `web/package.json`
- Create: `web/vite.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/index.html`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/App.css`

- [ ] **Step 1: 用 bun 初始化 React + Vite 项目**

Run: `cd /Users/yunfeng/code/svd && bun create vite web --template react-ts`

- [ ] **Step 2: 安装前端依赖**

Run: `cd /Users/yunfeng/code/svd/web && bun add plotly.js react-plotly.js three @react-three/fiber @react-three/drei katex react-katex @monaco-editor/react react-router-dom`
Run: `bun add -d @types/react-plotly.js @types/katex @types/react-katex`

- [ ] **Step 3: 配置 vite.config.ts — 添加 API proxy**

```typescript
// web/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
```

- [ ] **Step 4: 验证前端启动**

Run: `cd /Users/yunfeng/code/svd/web && bun dev &`
Expected: Vite 启动在 localhost:5173

---

### Task 3: 启动脚本 + 前端 Shell

**Files:**
- Create: `start.sh`
- Create: `web/src/api.ts`
- Create: `web/src/components/Layout.tsx`
- Create: `web/src/components/TabNav.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/App.css`

- [ ] **Step 1: 创建 start.sh**

```bash
#!/bin/bash
set -e

echo "Starting SVD Learning Tool..."

# 启动后端
echo "Starting backend on :8000..."
(cd server && uv run uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

# 启动前端
echo "Starting frontend on :5173..."
(cd web && bun dev) &
FRONTEND_PID=$!

# 捕获退出信号，同时关闭两个进程
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
echo "Both servers running. Press Ctrl+C to stop."
wait
```

- [ ] **Step 2: 创建 api.ts — 统一 API 调用层**

```typescript
// web/src/api.ts
const BASE = '/api'

export async function fetchHealth() {
  const res = await fetch(`${BASE}/health`)
  return res.json()
}

export async function postSvdCompute(matrix: number[][]) {
  const res = await fetch(`${BASE}/svd/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matrix }),
  })
  return res.json()
}

export async function postImageCompress(imageBase64: string, k: number) {
  const res = await fetch(`${BASE}/svd/image-compress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, k }),
  })
  return res.json()
}

export async function postEigenfaces(params: { n_components: number; image_index?: number }) {
  const res = await fetch(`${BASE}/svd/eigenfaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return res.json()
}

export async function postNeuralNet(k: number) {
  const res = await fetch(`${BASE}/svd/neural-net`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ k }),
  })
  return res.json()
}

export async function postRunCode(code: string) {
  const res = await fetch(`${BASE}/code/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  return res.json()
}

export async function fetchSamples() {
  const res = await fetch(`${BASE}/samples`)
  return res.json()
}

export async function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    body: formData,
  })
  return res.json()
}
```

- [ ] **Step 3: 创建 Layout.tsx 和 TabNav.tsx**

Layout 包含顶部标题 + TabNav + 内容区域。TabNav 是 5 个 tab 切换，对应 5 个页面。使用 react-router-dom 路由。

- [ ] **Step 4: 修改 App.tsx — 路由 + 布局**

设置 5 个路由：`/formula`, `/sandbox`, `/compression`, `/neural-net`, `/eigenfaces`，默认重定向到 `/formula`。

- [ ] **Step 5: 编写 App.css — 全局样式**

深色主题，类似图片中的浅灰/白色渐变背景。Tab 高亮样式、全局字体。

- [ ] **Step 6: 验证**

Run: `chmod +x start.sh && ./start.sh`
浏览器打开 localhost:5173，应看到 Tab 导航 + 空白内容区域，5 个 tab 可切换。

---

### Task 4: 公式讲解页 (FormulaPage)

**Files:**
- Create: `web/src/pages/FormulaPage.tsx`
- Modify: `server/main.py` — 注册 svd_compute 路由
- Create: `server/api/svd_compute.py` — `/api/svd/compute` 端点

- [ ] **Step 1: 创建后端 /api/svd/compute**

```python
# server/api/svd_compute.py
import numpy as np
from fastapi import APIRouter

router = APIRouter(prefix="/api/svd")

@router.post("/compute")
def compute_svd(data: dict):
    matrix = np.array(data["matrix"], dtype=float)
    U, s, Vt = np.linalg.svd(matrix, full_matrices=False)
    return {
        "U": U.tolist(),
        "sigma": s.tolist(),
        "Vt": Vt.tolist(),
    }
```

在 `main.py` 中 `app.include_router(router)` 注册。

- [ ] **Step 2: 创建 FormulaPage.tsx**

页面分为三个区域：
1. **核心公式** — 用 KaTeX 渲染 `A = U \Sigma V^T`，附带分步说明（几何直觉：旋转+缩放）
2. **例题区** — 2-3 道手算 SVD 题目，点击"显示解法"展开详细步骤（也用 KaTeX 渲染）
3. **交互计算器** — 用户输入矩阵（textarea JSON 格式），点击"计算 SVD"，调用后端，展示 U、Σ、V 结果矩阵

- [ ] **Step 3: 验证**

启动项目，打开公式页，检查：公式渲染正常、例题可展开、输入 `[[1,2],[3,4]]` 计算返回正确结果。

---

### Task 5: 代码沙盒 (CodeSandbox)

**Files:**
- Create: `web/src/pages/CodeSandbox.tsx`
- Create: `server/api/code_runner.py`
- Modify: `server/main.py` — 注册 code_runner 路由

- [ ] **Step 1: 创建后端 /api/code/run**

```python
# server/api/code_runner.py
import subprocess
import sys
from fastapi import APIRouter

router = APIRouter(prefix="/api/code")

@router.post("/run")
def run_code(data: dict):
    code = data["code"]
    try:
        result = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True, text=True, timeout=10
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "执行超时（10秒限制）", "returncode": -1}
```

- [ ] **Step 2: 创建 CodeSandbox.tsx**

页面布局：
- 左侧：Monaco Editor，顶部有模板下拉菜单（"SVD 基础"、"图像压缩示例"、"特征脸示例"），选中后填充代码
- 右侧：输出面板，显示 stdout（白色）和 stderr（红色）
- 底部中间：运行按钮

- [ ] **Step 3: 验证**

输入 `import numpy as np; print(np.linalg.svd([[1,2],[3,4]]))` 点运行，应返回结果。

---

### Task 6: 图像压缩 (ImageCompression)

**Files:**
- Create: `web/src/pages/ImageCompression.tsx`
- Create: `web/src/components/ImageUploader.tsx`
- Modify: `server/api/svd_compute.py` — 添加 `/api/svd/image-compress`, `/api/samples`, `/api/upload`
- Create: `server/data/` — 放入 2-3 张内置图片

- [ ] **Step 1: 准备内置示例图片**

用 Python 生成或从 scikit-image 下载经典测试图（cameraman, astronaut 等），保存到 `server/data/`。

- [ ] **Step 2: 创建后端 API**

`/api/samples` — 返回内置图片列表 `[{name, thumbnail_base64}]`
`/api/upload` — 接收上传图片，转为灰度，存临时文件，返回 id
`/api/svd/image-compress` — 接收 `{image_id or image_base64, k}`：
  1. 对图像矩阵做 SVD
  2. 保留前 k 个奇异值重建
  3. 返回：`{compressed_image_base64, singular_values: number[], k, total_rank, retained_ratio}`

- [ ] **Step 3: 创建 ImageUploader.tsx**

拖拽/点击上传组件，支持 jpg/png。

- [ ] **Step 4: 创建 ImageCompression.tsx**

布局：
- 顶部：示例图片选择（缩略图列表）+ 上传按钮
- 中间左：原图
- 中间右：压缩后的图
- 下方左：Slider 控制 k 值 (1 ~ max_rank)
- 下方右：Plotly 折线图 — x 轴为奇异值 index，y 轴为 σ 值，当前 k 用红色竖线标注
- 底部信息栏：压缩率、保留信息比例 (sum(σ[:k]²)/sum(σ²))

Slider 变化时调用后端重新计算（加 debounce 300ms）。

- [ ] **Step 5: 验证**

选择内置图片，拖动 slider，图片和图表实时更新。上传自定义图片也正常工作。

---

### Task 7: 神经网络可视化 (NeuralNetwork)

**Files:**
- Create: `web/src/pages/NeuralNetwork.tsx`
- Create: `server/api/neural_net.py`
- Modify: `server/main.py` — 注册 neural_net 路由

- [ ] **Step 1: 创建后端 /api/svd/neural-net**

```python
# server/api/neural_net.py
# 创建一个简单的全连接网络（用随机权重或预训练小模型）
# 对权重矩阵做 SVD
# 返回：网络结构信息、原始权重矩阵、奇异值、低秩近似后的权重矩阵
# 以及不同 k 值下前向传播的精度对比
```

API 接收 `{k}`，返回：
- `layers`: 网络结构 `[{name, input_dim, output_dim}]`
- `singular_values`: 权重矩阵的奇异值
- `original_weights_heatmap`: 原始权重矩阵热力图数据
- `compressed_weights_heatmap`: 低秩近似权重热力图数据
- `accuracy_original`: 原始精度
- `accuracy_compressed`: 压缩后精度

- [ ] **Step 2: 创建 NeuralNetwork.tsx**

布局：
- 顶部：SVG/Canvas 绘制的网络结构图（输入层→隐藏层→输出层，节点+连线）
- 中间左：Plotly 柱状图 — 奇异值 σ1, σ2, σ3...，前 k 个高亮
- 中间右：两个热力图并排 — 原始权重 vs 低秩近似权重
- 底部：Slider 控制 k + 精度对比数字

- [ ] **Step 3: 验证**

拖动 slider，柱状图高亮变化，热力图更新，精度数字变化。

---

### Task 8: 降维/特征脸 (Eigenfaces)

**Files:**
- Create: `web/src/pages/Eigenfaces.tsx`
- Modify: `server/api/svd_compute.py` — 添加 `/api/svd/eigenfaces`

- [ ] **Step 1: 准备人脸数据**

在后端使用 `sklearn.datasets.fetch_lfw_people` 下载 LFW 人脸子集（min_faces_per_person=20，取前 200 张），缓存到 `server/data/`。

- [ ] **Step 2: 创建后端 /api/svd/eigenfaces**

API 接收 `{n_components, image_index?}`，返回：
- `eigenfaces`: 前 n_components 个特征脸的 base64 灰度图
- `scatter_3d`: 降维后的 3D 坐标 `[{x, y, z, label}]`（取前 3 个主成分）
- `target_names`: 人物名称列表
- `reconstruction`: 如果提供 image_index，返回 `{original_base64, reconstructed_base64}`
- `explained_variance_ratio`: 各主成分解释方差比

- [ ] **Step 3: 创建 Eigenfaces.tsx**

布局：
- 左侧：Three.js 3D 散点图（@react-three/fiber），不同人用不同颜色，可旋转/缩放/拖动
- 右上：特征脸网格（黑白图，4 列排列），展示前 N 个特征脸
- 右中：Slider 控制主成分数量 n_components
- 右下：选定人脸的原图 vs 重建图对比（点击 3D 散点选择）

- [ ] **Step 4: 验证**

3D 散点图可旋转缩放，特征脸黑白图正常显示，slider 调整后特征脸数量变化，重建图对比正常。

---

### Task 9: 样式打磨 + 启动脚本最终验证

**Files:**
- Modify: `web/src/App.css`
- Modify: `start.sh`

- [ ] **Step 1: 统一样式**

对齐所有页面的间距、配色、字体大小。确保深色/浅色主题统一，响应式适配。

- [ ] **Step 2: 完善 start.sh**

添加依赖检查（uv、bun 是否安装），首次运行自动 `uv sync` 和 `bun install`。

- [ ] **Step 3: 端到端验证**

Run: `cd /Users/yunfeng/code/svd && ./start.sh`
验证全部 5 个页面功能正常：
1. 公式页：KaTeX 渲染、例题展开、矩阵计算
2. 代码沙盒：代码执行、模板切换
3. 图像压缩：slider 拖动实时更新、上传图片
4. 神经网络：网络结构图、slider 精度变化
5. 特征脸：3D 散点图旋转、特征脸显示、重建对比

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: complete SVD interactive learning tool"
```
