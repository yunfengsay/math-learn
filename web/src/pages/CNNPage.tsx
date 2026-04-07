import { useState } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-basic-dist-min'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useThemeColors } from '../useThemeColors'

const Plot = createPlotlyComponent(Plotly)

function Tex({ math, block = false }: { math: string; block?: boolean }) {
  const html = katex.renderToString(math, { displayMode: block, throwOnError: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// 预设卷积核
const KERNELS: Record<string, number[][]> = {
  '边缘检测': [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
  '模糊': [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map(r => r.map(v => v / 9)),
  '锐化': [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
  '水平边缘': [[-1, -1, -1], [0, 0, 0], [1, 1, 1]],
  '垂直边缘': [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
}

// 5x5 简单图案（十字形）
const DEFAULT_INPUT = [
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
]

// 执行卷积运算
function convolve(input: number[][], kernel: number[][], stride: number): number[][] {
  const kSize = kernel.length
  const outSize = Math.floor((input.length - kSize) / stride) + 1
  const result: number[][] = []
  for (let i = 0; i < outSize; i++) {
    result[i] = []
    for (let j = 0; j < outSize; j++) {
      let sum = 0
      for (let ki = 0; ki < kSize; ki++) {
        for (let kj = 0; kj < kSize; kj++) {
          sum += input[i * stride + ki][j * stride + kj] * kernel[ki][kj]
        }
      }
      result[i][j] = Math.round(sum * 100) / 100
    }
  }
  return result
}

// SVG 矩阵单元格
function MatrixCell({ x, y, value, highlight, size = 40 }: {
  x: number; y: number; value: number; highlight?: boolean; size?: number
}) {
  return (
    <g>
      <rect
        x={x} y={y} width={size} height={size}
        fill={highlight ? 'var(--accent-muted)' : 'var(--bg-card)'}
        stroke={highlight ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={highlight ? 2 : 1}
        rx={3}
      />
      <text
        x={x + size / 2} y={y + size / 2 + 4}
        textAnchor="middle" fontSize={11}
        fill="var(--text-primary)"
      >
        {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
      </text>
    </g>
  )
}

// 卷积操作动画区域
function ConvAnimator() {
  const [stride, setStride] = useState(1)
  const [step, setStep] = useState(0)
  const [kernel, setKernel] = useState(KERNELS['边缘检测'])
  const input = DEFAULT_INPUT

  const outSize = Math.floor((5 - 3) / stride) + 1
  const maxSteps = outSize * outSize
  const output = convolve(input, kernel, stride)

  // 当前卷积窗口位置
  const curRow = Math.floor(step / outSize)
  const curCol = step % outSize
  const startR = curRow * stride
  const startC = curCol * stride

  // 计算当前步的乘积和
  function getCurrentComputation() {
    let parts: string[] = []
    let sum = 0
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const iv = input[startR + i][startC + j]
        const kv = kernel[i][j]
        parts.push(`${iv}×${kv.toFixed(1)}`)
        sum += iv * kv
      }
    }
    return { parts, sum: Math.round(sum * 100) / 100 }
  }

  const comp = getCurrentComputation()
  const cellSize = 38
  const gap = 2

  return (
    <div className="card mb-16">
      <div className="flex-between mb-16">
        <label>卷积操作动画</label>
        <div className="flex-center">
          <label>步长</label>
          <select value={stride} onChange={e => { setStride(Number(e.target.value)); setStep(0) }}>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
          <select
            value={Object.keys(KERNELS).find(k => JSON.stringify(KERNELS[k]) === JSON.stringify(kernel)) || ''}
            onChange={e => { setKernel(KERNELS[e.target.value]); setStep(0) }}
          >
            {Object.keys(KERNELS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <svg viewBox={`0 0 580 220`} style={{ width: '100%', maxWidth: 580 }}>
        {/* 输入矩阵标签 */}
        <text x={100} y={14} textAnchor="middle" fontSize={11} fill="var(--text-muted)">输入 5×5</text>
        {/* 输入矩阵 */}
        {input.map((row, i) => row.map((v, j) => {
          const hl = i >= startR && i < startR + 3 && j >= startC && j < startC + 3
          return (
            <MatrixCell
              key={`i-${i}-${j}`}
              x={j * (cellSize + gap)} y={20 + i * (cellSize + gap)}
              value={v} highlight={hl} size={cellSize}
            />
          )
        }))}

        {/* 卷积核 */}
        <text x={295} y={14} textAnchor="middle" fontSize={11} fill="var(--text-muted)">卷积核 3×3</text>
        {kernel.map((row, i) => row.map((v, j) => (
          <MatrixCell
            key={`k-${i}-${j}`}
            x={220 + j * (cellSize + gap)} y={50 + i * (cellSize + gap)}
            value={v} size={cellSize}
          />
        )))}

        {/* 乘号 */}
        <text x={213} y={110} fontSize={18} fill="var(--text-muted)">*</text>

        {/* 等号 */}
        <text x={350} y={110} fontSize={18} fill="var(--text-muted)">=</text>

        {/* 输出矩阵 */}
        <text x={400 + outSize * (cellSize + gap) / 2} y={14} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
          输出 {outSize}×{outSize}
        </text>
        {output.map((row, i) => row.map((v, j) => {
          const hl = i === curRow && j === curCol
          return (
            <MatrixCell
              key={`o-${i}-${j}`}
              x={370 + j * (cellSize + gap)} y={50 + i * (cellSize + gap)}
              value={v} highlight={hl} size={cellSize}
            />
          )
        }))}
      </svg>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
        <strong>步骤 {step + 1}/{maxSteps}</strong>：位置({curRow},{curCol}) = {comp.parts.slice(0, 4).join(' + ')} + ... = <strong style={{ color: 'var(--accent)' }}>{comp.sum}</strong>
      </div>

      <div className="flex-center mt-16">
        <button className="btn btn-secondary" onClick={() => setStep(0)}>重置</button>
        <button className="btn btn-secondary" onClick={() => setStep(Math.max(0, step - 1))}>上一步</button>
        <button className="btn btn-primary" onClick={() => setStep(Math.min(maxSteps - 1, step + 1))}>下一步</button>
      </div>
    </div>
  )
}

// 特征图可视化
function FeatureMapViz() {
  const [preset, setPreset] = useState<string>('边缘检测')
  const tc = useThemeColors()

  const kernel = KERNELS[preset]
  const output = convolve(DEFAULT_INPUT, kernel, 1)

  return (
    <div className="card mb-16">
      <div className="flex-between mb-16">
        <label>特征图可视化</label>
        <div className="flex-center">
          {Object.keys(KERNELS).map(k => (
            <button
              key={k}
              className={`btn ${preset === k ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: 11 }}
              onClick={() => setPreset(k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="grid-2">
        <div>
          <Plot
            data={[{
              z: [...DEFAULT_INPUT].reverse(),
              type: 'heatmap',
              colorscale: 'Greys',
              showscale: false,
            }]}
            layout={{
              title: { text: '输入图案', font: { size: 13, color: tc.plotlyTitle } },
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              margin: { t: 35, b: 10, l: 10, r: 10 }, height: 200,
              xaxis: { showticklabels: false }, yaxis: { showticklabels: false },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <Plot
            data={[{
              z: [...output].reverse(),
              type: 'heatmap',
              colorscale: 'RdBu',
              showscale: true,
              colorbar: { len: 0.8, thickness: 10, tickfont: { size: 9, color: tc.plotlyText } },
            }]}
            layout={{
              title: { text: `${preset} 结果`, font: { size: 13, color: tc.plotlyTitle } },
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              margin: { t: 35, b: 10, l: 10, r: 30 }, height: 200,
              xaxis: { showticklabels: false }, yaxis: { showticklabels: false },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
        核: [{kernel.map(r => `[${r.map(v => v.toFixed(1)).join(',')}]`).join(', ')}]
      </div>
    </div>
  )
}

// 感受野计算器
function ReceptiveFieldCalc() {
  const [layers, setLayers] = useState([
    { kernel: 3, stride: 1 },
    { kernel: 3, stride: 1 },
    { kernel: 3, stride: 2 },
  ])

  // 逐层累积计算感受野
  function calcRF() {
    let rf = 1
    let jump = 1
    for (const layer of layers) {
      rf = rf + (layer.kernel - 1) * jump
      jump = jump * layer.stride
    }
    return rf
  }

  function updateLayer(idx: number, field: 'kernel' | 'stride', val: number) {
    const next = layers.map((l, i) => i === idx ? { ...l, [field]: val } : l)
    setLayers(next)
  }

  return (
    <div className="card mb-16">
      <label className="mb-16" style={{ display: 'block' }}>感受野计算器</label>
      <div style={{ fontSize: 12, marginBottom: 12 }}>
        <Tex math="RF = 1 + \sum_{l=1}^{L}(k_l - 1) \prod_{i=1}^{l-1} s_i" block />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {layers.map((l, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 8,
            border: '1px solid var(--border-subtle)', fontSize: 12,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>层 {i + 1}</div>
            <div className="flex-center" style={{ gap: 4 }}>
              <span>k=</span>
              <select value={l.kernel} onChange={e => updateLayer(i, 'kernel', Number(e.target.value))}>
                {[1, 3, 5, 7].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <span>s=</span>
              <select value={l.stride} onChange={e => updateLayer(i, 'stride', Number(e.target.value))}>
                {[1, 2, 3].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        ))}
        <div className="flex-center">
          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}
            onClick={() => setLayers([...layers, { kernel: 3, stride: 1 }])}>+ 添加层</button>
          {layers.length > 1 && (
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}
              onClick={() => setLayers(layers.slice(0, -1))}>- 移除层</button>
          )}
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>
        最终感受野: <span className="metric" style={{ color: 'var(--accent)' }}>{calcRF()} × {calcRF()}</span>
      </div>
    </div>
  )
}

// ResNet残差连接 SVG
function ResidualBlock() {
  const [showResidual, setShowResidual] = useState(true)

  return (
    <div className="card mb-16">
      <div className="flex-between mb-16">
        <label>残差连接 vs 普通网络</label>
        <button
          className={`btn ${showResidual ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowResidual(!showResidual)}
        >
          {showResidual ? '残差连接' : '普通连接'}
        </button>
      </div>

      <svg viewBox="0 0 500 160" style={{ width: '100%', maxWidth: 500 }}>
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="var(--accent)" />
          </marker>
          <marker id="arr-red" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#ef4444" />
          </marker>
        </defs>

        {/* 输入 */}
        <rect x={20} y={55} width={60} height={36} rx={6} fill="var(--bg-surface)" stroke="var(--border)" />
        <text x={50} y={77} textAnchor="middle" fontSize={11} fill="var(--text-primary)">x</text>

        {/* 主路径箭头 */}
        <line x1={80} y1={73} x2={110} y2={73} stroke="var(--accent)" strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* Weight Layer 1 */}
        <rect x={115} y={55} width={80} height={36} rx={6} fill="var(--accent-muted)" stroke="var(--accent)" strokeWidth={1.5} />
        <text x={155} y={71} textAnchor="middle" fontSize={10} fill="var(--text-primary)">Weight Layer</text>
        <text x={155} y={83} textAnchor="middle" fontSize={9} fill="var(--text-muted)">+ ReLU</text>

        <line x1={195} y1={73} x2={225} y2={73} stroke="var(--accent)" strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* Weight Layer 2 */}
        <rect x={230} y={55} width={80} height={36} rx={6} fill="var(--accent-muted)" stroke="var(--accent)" strokeWidth={1.5} />
        <text x={270} y={71} textAnchor="middle" fontSize={10} fill="var(--text-primary)">Weight Layer</text>
        <text x={270} y={83} textAnchor="middle" fontSize={9} fill="var(--text-muted)">+ ReLU</text>

        <line x1={310} y1={73} x2={340} y2={73} stroke="var(--accent)" strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* 加法节点 */}
        <circle cx={355} cy={73} r={14} fill="var(--bg-card)" stroke="var(--accent)" strokeWidth={1.5} />
        <text x={355} y={77} textAnchor="middle" fontSize={14} fill="var(--accent)">+</text>

        <line x1={369} y1={73} x2={399} y2={73} stroke="var(--accent)" strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* ReLU */}
        <rect x={404} y={55} width={60} height={36} rx={6} fill="var(--bg-surface)" stroke="var(--border)" />
        <text x={434} y={71} textAnchor="middle" fontSize={10} fill="var(--text-primary)">ReLU</text>
        <text x={434} y={83} textAnchor="middle" fontSize={10} fill="var(--text-primary)">F(x)+x</text>

        {/* 残差跳跃连接 */}
        {showResidual && (
          <>
            <path
              d="M 50 55 L 50 25 L 355 25 L 355 59"
              fill="none" stroke="#ef4444" strokeWidth={1.8} strokeDasharray="5,3"
              markerEnd="url(#arr-red)"
            />
            <text x={200} y={18} textAnchor="middle" fontSize={10} fill="#ef4444" fontWeight={600}>
              恒等映射 (Identity Shortcut)
            </text>
          </>
        )}

        {/* 梯度流动说明 */}
        <text x={250} y={150} textAnchor="middle" fontSize={11} fill="var(--text-secondary)">
          {showResidual
            ? '残差连接: 梯度可以直接通过跳跃连接回传, ∂L/∂x = ∂L/∂F · ∂F/∂x + ∂L/∂x'
            : '普通网络: 梯度只能逐层传播，深层容易梯度消失'}
        </text>
      </svg>
    </div>
  )
}

// 公式区
function ConvFormulas() {
  return (
    <div className="card">
      <label className="mb-16" style={{ display: 'block' }}>核心公式</label>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>2D 卷积定义</div>
          <Tex math="(I * K)(i,j) = \sum_{m}\sum_{n} I(i+m, j+n) \cdot K(m,n)" block />
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>输出尺寸公式</div>
          <Tex math="O = \left\lfloor \frac{W - K + 2P}{S} \right\rfloor + 1" block />
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>感受野公式</div>
          <Tex math="RF_l = RF_{l-1} + (k_l - 1) \cdot \prod_{i=1}^{l-1} s_i" block />
        </div>
      </div>
    </div>
  )
}

export default function CNNPage() {
  return (
    <div className="page" style={{ fontSize: 13 }}>
      <h3 className="mb-16">卷积神经网络 (CNN)</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
        卷积神经网络通过局部感受野和权重共享高效提取空间特征，是计算机视觉的基础架构。
      </p>

      <ConvAnimator />
      <FeatureMapViz />

      <div className="grid-2 mb-16">
        <ReceptiveFieldCalc />
        <ConvFormulas />
      </div>

      <ResidualBlock />
    </div>
  )
}
