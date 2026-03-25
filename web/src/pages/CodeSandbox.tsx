import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { postRunCode } from '../api'
import { useThemeColors } from '../useThemeColors'

const templates: Record<string, string> = {
  'SVD 基础': `import numpy as np

A = np.array([[1, 2], [3, 4], [5, 6]])
U, s, Vt = np.linalg.svd(A, full_matrices=False)

print("U =")
print(np.round(U, 4))
print("\\nSigma =", np.round(s, 4))
print("\\nVt =")
print(np.round(Vt, 4))

# 验证重建
A_reconstructed = U @ np.diag(s) @ Vt
print("\\n重建误差:", np.round(np.linalg.norm(A - A_reconstructed), 10))`,

  '图像压缩示例': `import numpy as np
from PIL import Image
import io, base64

# 创建一个简单的测试矩阵模拟图像
np.random.seed(42)
img = np.random.rand(50, 50) * 255

U, s, Vt = np.linalg.svd(img, full_matrices=False)

# 不同 k 值的压缩率
for k in [1, 5, 10, 25, 50]:
    compressed = U[:, :k] @ np.diag(s[:k]) @ Vt[:k, :]
    error = np.linalg.norm(img - compressed) / np.linalg.norm(img)
    ratio = (k * (50 + 50 + 1)) / (50 * 50)
    print(f"k={k:2d}: 相对误差={error:.4f}, 存储比={ratio:.2%}")`,

  '特征脸示例': `import numpy as np

# 模拟人脸数据: 20 张 10x10 的"人脸"
np.random.seed(42)
n_faces, h, w = 20, 10, 10
faces = np.random.randn(n_faces, h * w)

# 中心化
mean_face = faces.mean(axis=0)
centered = faces - mean_face

# SVD 降维
U, s, Vt = np.linalg.svd(centered, full_matrices=False)

# 前几个主成分包含的信息量
explained = (s ** 2) / (s ** 2).sum()
cumulative = np.cumsum(explained)

print("各主成分方差占比:")
for i in range(min(5, len(s))):
    print(f"  PC{i+1}: {explained[i]:.4f} (累计: {cumulative[i]:.4f})")

print(f"\\n前 5 个主成分保留了 {cumulative[4]:.1%} 的信息")`,

  '低秩近似定理': `import numpy as np

# Eckart-Young 定理：SVD 的 k 秩近似是最优的
np.random.seed(42)
A = np.random.randn(10, 8)
U, s, Vt = np.linalg.svd(A, full_matrices=False)

print("奇异值:", np.round(s, 3))
print()

for k in range(1, len(s) + 1):
    Ak = U[:, :k] @ np.diag(s[:k]) @ Vt[:k, :]
    error = np.linalg.norm(A - Ak, 'fro')
    # 理论误差 = sqrt(sum of remaining singular values squared)
    theory = np.sqrt(np.sum(s[k:] ** 2))
    print(f"k={k}: ||A-Ak||_F = {error:.4f} (理论值: {theory:.4f})")`,
}

export default function CodeSandbox() {
  const [code, setCode] = useState(templates['SVD 基础'])
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const tc = useThemeColors()

  async function runCode() {
    setLoading(true)
    setOutput('运行中...')
    try {
      const data = await postRunCode(code)
      const out = data.stdout + (data.stderr ? `\n[stderr] ${data.stderr}` : '')
      setOutput(out || '(无输出)')
    } catch {
      setOutput('请求失败')
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <div className="flex-between mb-16">
        <div className="flex-center">
          <h3>Python 代码沙盒</h3>
          <select
            onChange={e => {
              const t = templates[e.target.value]
              if (t) setCode(t)
            }}
            style={{
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px',
              fontSize: 13,
            }}
          >
            <option value="">选择模板...</option>
            {Object.keys(templates).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={runCode} disabled={loading}>
          {loading ? '运行中...' : '运行'}
        </button>
      </div>

      <div className="grid-2">
        <div style={{ height: 500, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <Editor
            height="100%"
            language="python"
            theme={tc.editorTheme}
            value={code}
            onChange={v => setCode(v || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 12 },
            }}
          />
        </div>
        <div>
          <label className="mb-12" style={{ display: 'block' }}>输出</label>
          <div className="output-panel" style={{ height: 470, overflowY: 'auto' }}>
            {output}
          </div>
        </div>
      </div>
    </div>
  )
}
