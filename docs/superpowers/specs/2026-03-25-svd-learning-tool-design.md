# SVD 交互式学习工具 — 设计文档

## 概述

基于 Web 的 SVD（奇异值分解）交互式学习工具，通过可视化方式直观展示 SVD 在图像压缩、神经网络、降维/特征脸三个领域的应用。

## 技术栈

- **后端**: Python FastAPI, uv 管理依赖
- **前端**: React + TypeScript + Vite, Bun 作为包管理器和运行时
- **可视化**: Plotly.js（图表）, Three.js（3D）, KaTeX（公式）, Monaco Editor（代码编辑器）
- **启动**: 根目录 `start.sh` 一键启动前后端

## 项目结构

```
svd/
├── start.sh                 # 一键启动脚本
├── server/                  # Python FastAPI 后端
│   ├── pyproject.toml
│   ├── main.py              # FastAPI 入口 (port 8000)
│   ├── api/
│   │   ├── svd_compute.py   # SVD 计算（图像压缩、降维、特征脸）
│   │   ├── code_runner.py   # 代码沙盒执行
│   │   └── neural_net.py    # 神经网络 SVD 分析
│   └── data/                # 内置示例图片、LFW 人脸子集
├── web/                     # React 前端
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── pages/
│       │   ├── FormulaPage.tsx
│       │   ├── CodeSandbox.tsx
│       │   ├── ImageCompression.tsx
│       │   ├── NeuralNetwork.tsx
│       │   └── Eigenfaces.tsx
│       └── components/
└── docs/
```

## 模块设计

### 1. 公式讲解 (FormulaPage)

- KaTeX 渲染 A = UΣVᵀ 公式
- 分步讲解：几何直觉（旋转+缩放）、奇异值意义、U/Σ/V 角色
- 内置 2-3 道例题，点击展开解法步骤
- 用户输入矩阵 → 后端计算 SVD → 返回 U、Σ、V

### 2. 代码沙盒 (CodeSandbox)

- Monaco Editor 编辑 Python 代码
- 内置 SVD 相关代码模板（一键填充）
- 后端用 subprocess 隔离执行，10 秒超时
- 返回 stdout/stderr 显示在输出面板

### 3. 图像压缩 (ImageCompression)

- 左右对比：原图 vs k 秩近似压缩图
- Slider 选择 k 值 (1 ~ max rank)
- Plotly 曲线图：奇异值分布 + 当前 k 位置竖线标注
- 显示压缩率、保留信息百分比
- 支持内置图片切换 + 用户上传

### 4. 神经网络 (NeuralNetwork)

- 可视化全连接网络结构（输入层→隐藏层→输出层）
- 对权重矩阵做 SVD，对比原始 vs 低秩近似权重
- 柱状图展示奇异值（σ1, σ2, σ3...）
- Slider 控制保留秩 k，实时观察精度变化

### 5. 降维/特征脸 (Eigenfaces)

- Three.js 3D 散点图：人脸数据 SVD 降维分布，可旋转/缩放
- 前 N 个特征脸黑白图展示
- Slider 控制主成分数量
- 选定人脸的原图 vs 重建图对比

## API 设计

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/svd/compute` | POST | 矩阵 SVD 计算 |
| `/api/svd/image-compress` | POST | 图像 k 秩压缩 |
| `/api/svd/eigenfaces` | POST | 特征脸计算 |
| `/api/svd/neural-net` | POST | 神经网络权重 SVD |
| `/api/code/run` | POST | 执行 Python 代码 |
| `/api/upload` | POST | 上传用户图片 |
| `/api/samples` | GET | 获取内置示例列表 |

## 数据传输

- 图像以 base64 编码传输
- 矩阵数据以 JSON 数组传输
- 3D 点云数据以 JSON 数组传输

## 图像数据

- 内置：经典测试图（cameraman、peppers 等）+ LFW 人脸子集（~20 张）
- 用户上传：支持 jpg/png，后端存储在临时目录
