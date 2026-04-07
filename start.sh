#!/bin/bash
set -e

# 切到脚本所在目录
cd "$(dirname "$0")"

echo "=== Deep Learning Mastery ==="

# 检查依赖
command -v uv >/dev/null 2>&1 || { echo "需要安装 uv: https://docs.astral.sh/uv/"; exit 1; }
command -v bun >/dev/null 2>&1 || { echo "需要安装 bun: https://bun.sh/"; exit 1; }

# 安装依赖（首次运行）
echo "检查依赖..."
(cd server && uv sync --quiet 2>/dev/null || true)
(cd web && BUN_CONFIG_REGISTRY=https://registry.npmmirror.com bun install --silent 2>/dev/null || true)

# 启动后端
echo "启动后端 :8000 ..."
(cd server && uv run uvicorn main:app --reload --reload-dir . --reload-include '*.py' --port 8000) &
BACKEND_PID=$!

# 启动前端
echo "启动前端 :5173 ..."
(cd web && bun dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
echo ""
echo "前端: http://localhost:5173"
echo "后端: http://localhost:8000/api/health"
echo "按 Ctrl+C 停止"
wait
