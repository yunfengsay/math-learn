import { useState, useRef } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-basic-dist-min'
import { useThemeColors } from '../useThemeColors'

const Plot = createPlotlyComponent(Plotly)

function Tex({ math, block = false }: { math: string; block?: boolean }) {
  const html = katex.renderToString(math, { displayMode: block, throwOnError: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// ============================================================
// 模块1: L1/L2 正则化几何解释
// ============================================================

/** 生成椭圆等高线路径 (损失函数等高线) */
function ellipsePoints(cx: number, cy: number, rx: number, ry: number, n = 64): string {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2
    const x = cx + rx * Math.cos(t)
    const y = cy + ry * Math.sin(t)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ') + 'Z'
}

function RegConstraintSVG({ lambda, norm }: { lambda: number; norm: 'L1' | 'L2' }) {
  const size = 280
  const cx = size / 2, cy = size / 2
  const scale = 50

  // 损失函数等高线中心偏移 (模拟无约束最优解位置)
  const optX = cx + 2.2 * scale, optY = cy - 1.5 * scale
  // 约束区域大小 (lambda 越大约束越小)
  const r = (1 / Math.max(lambda, 0.1)) * scale * 0.8

  // 生成多个等高线
  const contours = [0.5, 1.0, 1.6, 2.3, 3.0]

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 280 }}>
      <AxisLines size={size} cx={cx} cy={cy} />
      {contours.map((s, i) => (
        <path key={i} d={ellipsePoints(optX, optY, s * scale * 0.5, s * scale * 0.4)}
          fill="none" stroke="#3b82f6" strokeWidth={1} opacity={0.3 + i * 0.1} />
      ))}
      {norm === 'L1'
        ? <L1Diamond cx={cx} cy={cy} r={r} />
        : <L2Circle cx={cx} cy={cy} r={r} />
      }
      <circle cx={optX} cy={optY} r={3} fill="#3b82f6" />
      <text x={optX + 6} y={optY - 4} fontSize={10} fill="#3b82f6">w*</text>
      <ConstraintLabel cx={cx} cy={cy} norm={norm} />
    </svg>
  )
}

function AxisLines({ size, cx, cy }: { size: number; cx: number; cy: number }) {
  return (
    <g>
      <line x1={0} y1={cy} x2={size} y2={cy} stroke="var(--border)" strokeWidth={0.5} />
      <line x1={cx} y1={0} x2={cx} y2={size} stroke="var(--border)" strokeWidth={0.5} />
      <text x={size - 15} y={cy - 6} fontSize={10} fill="var(--text-muted)">w₁</text>
      <text x={cx + 6} y={14} fontSize={10} fill="var(--text-muted)">w₂</text>
    </g>
  )
}

function L1Diamond({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const d = `M${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} L${cx - r},${cy} Z`
  return (
    <path d={d} fill="var(--accent)" fillOpacity={0.15} stroke="var(--accent)" strokeWidth={2} />
  )
}

function L2Circle({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <circle cx={cx} cy={cy} r={r}
      fill="var(--accent)" fillOpacity={0.15} stroke="var(--accent)" strokeWidth={2} />
  )
}

function ConstraintLabel({ cx, cy, norm }: { cx: number; cy: number; norm: string }) {
  return (
    <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="var(--accent)" fontWeight={600}>
      {norm === 'L1' ? '|w|₁ ≤ t' : '|w|₂ ≤ t'}
    </text>
  )
}

function RegularizationGeoSection() {
  const [lambda, setLambda] = useState(1.0)
  const [norm, setNorm] = useState<'L1' | 'L2'>('L1')

  return (
    <div className="card mb-16">
      <label className="mb-12" style={{ display: 'block' }}>L1/L2 正则化几何解释</label>
      <div className="grid-2" style={{ gap: 16 }}>
        <div>
          <RegConstraintSVG lambda={lambda} norm={norm} />
        </div>
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button className={`btn ${norm === 'L1' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '5px 14px', fontSize: 12 }} onClick={() => setNorm('L1')}>
              L1 (Lasso)
            </button>
            <button className={`btn ${norm === 'L2' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '5px 14px', fontSize: 12 }} onClick={() => setNorm('L2')}>
              L2 (Ridge)
            </button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>正则化强度 λ = {lambda.toFixed(1)}</label>
            <input type="range" min={0.1} max={5} step={0.1} value={lambda}
              onChange={e => setLambda(Number(e.target.value))} />
          </div>
          <RegGeoFormulas norm={norm} />
        </div>
      </div>
    </div>
  )
}

function RegGeoFormulas({ norm }: { norm: 'L1' | 'L2' }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 12, fontSize: 12 }}>
      {norm === 'L1' ? (
        <>
          <Tex math="\mathcal{L}_{L1} = \mathcal{L}_{data} + \lambda \sum_i |w_i|" block />
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.7 }}>
            L1 约束形状为菱形，等高线容易与菱形<strong>顶点</strong>相切，
            使部分权重精确为零，实现<strong>特征选择</strong>（稀疏性）。
          </p>
        </>
      ) : (
        <>
          <Tex math="\mathcal{L}_{L2} = \mathcal{L}_{data} + \lambda \sum_i w_i^2" block />
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.7 }}>
            L2 约束形状为圆，等高线与圆<strong>平滑相切</strong>，
            权重趋近于零但不精确等于零，实现<strong>权重衰减</strong>。
          </p>
        </>
      )}
    </div>
  )
}

// ============================================================
// 模块2: Dropout 可视化
// ============================================================

interface NeuronData {
  x: number
  y: number
  active: boolean
}

/** 生成简单3层网络的神经元布局 */
function buildNetworkLayout(layers: number[]): NeuronData[][] {
  const colW = 400 / (layers.length + 1)
  return layers.map((count, li) => {
    const x = colW * (li + 1)
    const gap = Math.min(40, 200 / count)
    const startY = 110 - ((count - 1) * gap) / 2
    return Array.from({ length: count }, (_, ni) => ({
      x, y: startY + ni * gap, active: true,
    }))
  })
}

function applyDropout(network: NeuronData[][], rate: number): NeuronData[][] {
  return network.map((layer, li) => {
    // 输入层和输出层不 dropout
    if (li === 0 || li === network.length - 1) return layer.map(n => ({ ...n, active: true }))
    return layer.map(n => ({ ...n, active: Math.random() > rate }))
  })
}

function DropoutNetworkSVG({ network }: { network: NeuronData[][] }) {
  return (
    <svg viewBox="0 0 400 220" style={{ width: '100%', maxWidth: 400 }}>
      {/* 连接线 */}
      {network.slice(0, -1).map((layer, li) =>
        layer.flatMap((n1, i) =>
          network[li + 1].map((n2, j) => {
            const active = n1.active && n2.active
            return (
              <line key={`${li}-${i}-${j}`}
                x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                stroke={active ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={active ? 1 : 0.5}
                opacity={active ? 0.4 : 0.15}
              />
            )
          })
        )
      )}
      {/* 神经元 */}
      {network.flatMap((layer, li) =>
        layer.map((n, ni) => (
          <circle key={`n-${li}-${ni}`}
            cx={n.x} cy={n.y} r={10}
            fill={n.active ? 'var(--accent)' : 'var(--bg-surface)'}
            stroke={n.active ? 'var(--accent)' : 'var(--border)'}
            strokeWidth={1.5} opacity={n.active ? 0.9 : 0.3}
          />
        ))
      )}
      {/* 层标签 */}
      {['输入', '隐藏1', '隐藏2', '输出'].map((label, i) => {
        const x = 400 / 5 * (i + 1)
        return <text key={i} x={x} y={210} textAnchor="middle" fontSize={10} fill="var(--text-muted)">{label}</text>
      })}
    </svg>
  )
}

function DropoutSection() {
  const [rate, setRate] = useState(0.3)
  const baseNetwork = useRef(buildNetworkLayout([4, 6, 6, 3]))
  const [network, setNetwork] = useState(() => baseNetwork.current)

  function handleSample() {
    setNetwork(applyDropout(baseNetwork.current, rate))
  }

  const activeCount = network.flat().filter(n => n.active).length
  const totalCount = network.flat().length

  return (
    <div className="card mb-16">
      <label className="mb-12" style={{ display: 'block' }}>Dropout 可视化</label>
      <div className="grid-2" style={{ gap: 16 }}>
        <DropoutNetworkSVG network={network} />
        <div>
          <div style={{ marginBottom: 12 }}>
            <label>Dropout 率 p = {rate.toFixed(2)}</label>
            <input type="range" min={0} max={0.9} step={0.05} value={rate}
              onChange={e => setRate(Number(e.target.value))} />
          </div>
          <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={handleSample}>
            采样子网络
          </button>
          <div className="metric" style={{ fontSize: 12, marginBottom: 12 }}>
            激活: {activeCount} / {totalCount} 个神经元
          </div>
          <DropoutFormula />
        </div>
      </div>
    </div>
  )
}

function DropoutFormula() {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 12 }}>
      <Tex math="h_i^{(\text{train})} = m_i \cdot a_i, \quad m_i \sim \text{Bernoulli}(1-p)" block />
      <div style={{ marginTop: 8 }}>
        <Tex math="h_i^{(\text{test})} = (1-p) \cdot a_i" block />
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.7 }}>
        训练时随机丢弃神经元，测试时缩放激活值。
        等价于训练指数级多的子网络并做模型平均。
      </p>
    </div>
  )
}

// ============================================================
// 模块3: 偏差-方差权衡 (Plotly)
// ============================================================

function generateBVData(complexity: number) {
  const xs = Array.from({ length: 20 }, (_, i) => i + 1)

  const trainErr = xs.map(x => 0.8 * Math.exp(-0.25 * x) + 0.02)
  const testErr = xs.map(x => {
    const bias2 = 0.8 * Math.exp(-0.25 * x)
    const variance = 0.01 * Math.exp(0.2 * x)
    return bias2 + variance + 0.05
  })

  return { xs, trainErr, testErr, complexity }
}

function BiasVarianceSection() {
  const [complexity, setComplexity] = useState(8)
  const tc = useThemeColors()

  const { xs, trainErr, testErr } = generateBVData(complexity)
  const optIdx = testErr.indexOf(Math.min(...testErr))

  // 区域标注
  const zone = complexity <= optIdx - 2 ? '欠拟合' : complexity >= optIdx + 2 ? '过拟合' : '最优区域'
  const zoneColor = zone === '最优区域' ? 'var(--success)' : 'var(--error)'

  return (
    <div className="card mb-16">
      <label className="mb-12" style={{ display: 'block' }}>偏差-方差权衡</label>
      <Plot
        data={[
          { x: xs, y: trainErr, name: '训练误差', line: { color: tc.accent, width: 2 } },
          { x: xs, y: testErr, name: '测试误差', line: { color: tc.errorColor, width: 2 } },
          {
            x: [complexity], y: [testErr[complexity - 1] || 0],
            mode: 'markers', name: '当前',
            marker: { size: 12, color: '#f59e0b', symbol: 'diamond' },
          },
        ]}
        layout={{
          title: { text: '模型复杂度 vs 误差', font: { size: 14, color: tc.plotlyTitle } },
          paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
          font: { color: tc.plotlyText, size: 11 },
          xaxis: { title: '模型复杂度', gridcolor: tc.plotlyGrid },
          yaxis: { title: '误差', gridcolor: tc.plotlyGrid },
          margin: { t: 40, b: 50, l: 50, r: 20 },
          height: 280,
          legend: { x: 0.6, y: 0.95, bgcolor: 'transparent' },
          shapes: [
            { type: 'line', x0: optIdx + 1, x1: optIdx + 1, y0: 0, y1: 1, yref: 'paper',
              line: { color: tc.plotlyGrid, width: 1, dash: 'dash' } },
          ],
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <label>复杂度 = {complexity}</label>
          <input type="range" min={1} max={20} value={complexity}
            onChange={e => setComplexity(Number(e.target.value))} />
        </div>
        <span className="metric" style={{ fontSize: 13, color: zoneColor, fontWeight: 600 }}>
          {zone}
        </span>
      </div>
    </div>
  )
}

// ============================================================
// 模块4: 归一化方法对比
// ============================================================

function NormMethodSVG({ method, highlight }: { method: string; highlight: boolean }) {
  // 4D张量: [Batch, Channel, Height, Width] 用简单矩阵表示
  const batchSize = 3, channels = 3, spatial = 2
  const cellW = 20, cellH = 16, gap = 6
  const totalW = channels * cellW + (channels - 1) * gap
  const totalH = batchSize * spatial * cellH

  // 高亮区域取决于方法
  function isHighlighted(b: number, c: number): boolean {
    if (!highlight) return false
    if (method === 'BatchNorm') return c === 1 // 同一 channel 跨 batch
    if (method === 'LayerNorm') return b === 1 // 同一 sample 跨 channel
    if (method === 'RMSNorm') return b === 1   // 同一 sample 跨 channel
    return false
  }

  return (
    <svg viewBox={`0 0 ${totalW + 20} ${totalH + 40}`}
      style={{ width: '100%', maxWidth: 160 }}>
      <text x={totalW / 2 + 10} y={12} textAnchor="middle" fontSize={10}
        fill="var(--text-primary)" fontWeight={600}>{method}</text>
      {Array.from({ length: batchSize }, (_, b) =>
        Array.from({ length: channels }, (_, c) =>
          Array.from({ length: spatial }, (_, s) => {
            const x = 10 + c * (cellW + gap)
            const y = 20 + b * spatial * cellH + s * cellH
            const hl = isHighlighted(b, c)
            return (
              <rect key={`${b}-${c}-${s}`} x={x} y={y}
                width={cellW} height={cellH - 2} rx={2}
                fill={hl ? 'var(--accent)' : 'var(--bg-surface)'}
                fillOpacity={hl ? 0.6 : 1}
                stroke={hl ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={hl ? 1.5 : 0.5}
              />
            )
          })
        )
      )}
      {/* 标注 */}
      <text x={5} y={totalH + 36} fontSize={8} fill="var(--text-muted)">
        {method === 'BatchNorm' ? '跨Batch,每Channel' :
         method === 'LayerNorm' ? '每Sample,跨Channel' : '每Sample,无均值'}
      </text>
    </svg>
  )
}

function NormalizationSection() {
  const [activeMethod, setActiveMethod] = useState('BatchNorm')
  const methods = ['BatchNorm', 'LayerNorm', 'RMSNorm']

  return (
    <div className="card mb-16">
      <label className="mb-12" style={{ display: 'block' }}>归一化方法对比</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {methods.map(m => (
          <button key={m}
            className={`btn ${activeMethod === m ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: 11 }}
            onClick={() => setActiveMethod(m)}>
            {m}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        {methods.map(m => (
          <NormMethodSVG key={m} method={m} highlight={m === activeMethod} />
        ))}
      </div>
      <NormFormulas activeMethod={activeMethod} />
    </div>
  )
}

function NormFormulas({ activeMethod }: { activeMethod: string }) {
  const formulas: Record<string, { tex: string; desc: string }> = {
    BatchNorm: {
      tex: '\\hat{x}_i = \\frac{x_i - \\mu_B}{\\sqrt{\\sigma_B^2 + \\epsilon}}, \\quad y_i = \\gamma \\hat{x}_i + \\beta',
      desc: '对每个通道，跨 batch 维度做归一化。依赖 batch 统计量，推理时用移动平均。',
    },
    LayerNorm: {
      tex: '\\hat{x}_i = \\frac{x_i - \\mu_L}{\\sqrt{\\sigma_L^2 + \\epsilon}}, \\quad y_i = \\gamma \\hat{x}_i + \\beta',
      desc: '对每个样本，跨所有特征维度做归一化。不依赖 batch，适用于 Transformer。',
    },
    RMSNorm: {
      tex: '\\hat{x}_i = \\frac{x_i}{\\text{RMS}(x)}, \\quad \\text{RMS}(x) = \\sqrt{\\frac{1}{n}\\sum_i x_i^2}',
      desc: '去除均值中心化步骤，仅用 RMS 缩放。计算更快，LLaMA 等模型采用。',
    },
  }
  const f = formulas[activeMethod]
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 12 }}>
      <Tex math={f.tex} block />
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.7 }}>
        {f.desc}
      </p>
    </div>
  )
}

// ============================================================
// 核心公式汇总
// ============================================================

function RegFormulaSummary() {
  return (
    <div className="card mb-16">
      <label className="mb-12" style={{ display: 'block' }}>核心公式</label>
      <div className="grid-2" style={{ gap: 12 }}>
        <FormulaBlock title="L1 正则化"
          math="\mathcal{L} = \mathcal{L}_{data} + \lambda \|w\|_1 = \mathcal{L}_{data} + \lambda \sum_i |w_i|" />
        <FormulaBlock title="L2 正则化"
          math="\mathcal{L} = \mathcal{L}_{data} + \lambda \|w\|_2^2 = \mathcal{L}_{data} + \lambda \sum_i w_i^2" />
        <FormulaBlock title="Dropout (训练)"
          math="h = m \odot a, \quad m_i \sim \text{Bernoulli}(1-p)" />
        <FormulaBlock title="BatchNorm"
          math="\hat{x} = \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} \cdot \gamma + \beta" />
      </div>
    </div>
  )
}

function FormulaBlock({ title, math }: { title: string; math: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{title}</div>
      <Tex math={math} block />
    </div>
  )
}

// ============================================================
// 页面主组件
// ============================================================

export default function RegularizationPage() {
  return (
    <div className="page" style={{ fontSize: 13 }}>
      <h3 className="mb-16">正则化与泛化</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
        正则化是防止模型过拟合的关键技术。通过约束模型容量，
        正则化帮助模型从训练数据中学到可泛化的模式，而非记忆噪声。
      </p>
      <RegFormulaSummary />
      <RegularizationGeoSection />
      <DropoutSection />
      <BiasVarianceSection />
      <NormalizationSection />
    </div>
  )
}
