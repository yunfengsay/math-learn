# SVD 交互式学习工具

奇异值分解（Singular Value Decomposition）可视化学习平台，通过交互式操作直观理解 SVD 在图像压缩、神经网络、降维/特征脸中的应用。

## 启动

```bash
./start.sh
```

打开 http://localhost:5173

依赖：[uv](https://docs.astral.sh/uv/)、[Bun](https://bun.sh/)

## 五个模块

### 公式讲解
- 核心公式 A=UΣVᵀ 的 KaTeX 渲染与分步讲解
- 2D 几何可视化：输入矩阵，观察单位圆→椭圆的分步变换（Vᵀ旋转→Σ缩放→U旋转）
- 6 个核心性质（Eckart-Young 定理、伪逆、条件数等）
- 3 道例题带详细解法
- 关联概念：PCA、最小二乘、矩阵补全、LoRA
- 8 个商业/学术/前沿故事（Netflix Prize、Google PageRank、LoRA 等）
- 学习资源链接（3Blue1Brown、MIT 18.06、Steve Brunton 等）
- 交互式 SVD 计算器

### 代码沙盒
- Monaco Editor（VS Code 同款编辑器）
- 4 个内置 Python 代码模板（SVD 基础、图像压缩、特征脸、低秩近似定理）
- 后端 Python 执行，10 秒超时保护

### 图像压缩
- 内置示例图片（cameraman、astronaut、coins）+ 支持上传
- Slider 控制 k 值，实时显示压缩效果
- 奇异值分布曲线（Plotly），当前 k 位置红线标注
- 显示原始/压缩 KB 大小、存储比、节省量、信息保留率

### 神经网络
- SVG 网络结构图（输入8→隐藏16→输出4）
- 对权重矩阵做 SVD，柱状图展示奇异值，前 k 个高亮
- 原始 vs 低秩近似权重热力图对比
- Slider 控制 k，实时显示精度变化

### 降维/特征脸
- Three.js 3D 散点图：LFW 人脸数据 SVD 降维投影，可旋转/缩放
- 特征脸黑白图网格展示
- Slider 控制主成分数量，观察重建效果
- 原图 vs 重建图对比
- 方差解释比柱状图 + 累计曲线

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Python, FastAPI, NumPy, SciPy, scikit-learn, Pillow |
| 前端 | React, TypeScript, Vite, Bun |
| 可视化 | Plotly.js, Three.js (@react-three/fiber), KaTeX |
| 编辑器 | Monaco Editor |

## 项目结构

```
svd/
├── start.sh              # 一键启动前后端
├── server/
│   ├── main.py            # FastAPI 入口
│   ├── api/
│   │   ├── svd_compute.py # SVD 计算 + 图像压缩 + 特征脸
│   │   ├── code_runner.py # Python 代码执行沙盒
│   │   └── neural_net.py  # 神经网络 SVD 分析
│   └── data/              # 内置示例图片
└── web/
    └── src/
        ├── App.tsx        # 路由
        ├── api.ts         # API 调用层
        ├── pages/         # 5 个页面
        └── components/    # Layout, TabNav, ThemeToggle 等
```
