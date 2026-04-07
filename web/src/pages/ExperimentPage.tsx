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

// 模拟训练 loss 曲线：lr 越大初期下降快但后期可能震荡
function generateLossCurve(lr: number, epochs: number): number[] {
  const result: number[] = []
  let loss = 2.5
  for (let i = 0; i < epochs; i++) {
    const noise = (Math.sin(i * lr * 50) * 0.05 * lr * 10)
    loss = loss * (1 - lr * 0.8) + noise + (lr > 0.05 ? Math.random() * lr * 0.3 : 0)
    if (loss < 0.01) loss = 0.01 + Math.random() * 0.02
    result.push(Math.max(loss, 0.01))
  }
  return result
}

// 网格搜索：均匀分布在对数空间
function generateGridSearch(n: number) {
  const lrs: number[] = []
  const losses: number[] = []
  const logRange = Array.from({ length: n }, (_, i) => Math.pow(10, -4 + (i / (n - 1)) * 4))
  for (const lr of logRange) {
    lrs.push(lr)
    const curve = generateLossCurve(lr, 50)
    losses.push(curve[curve.length - 1])
  }
  return { lrs, losses }
}

// 随机搜索：随机采样对数空间
function generateRandomSearch(n: number) {
  const lrs: number[] = []
  const losses: number[] = []
  for (let i = 0; i < n; i++) {
    const lr = Math.pow(10, -4 + Math.random() * 4)
    lrs.push(lr)
    const curve = generateLossCurve(lr, 50)
    losses.push(curve[curve.length - 1])
  }
  return { lrs, losses }
}

// 消融实验数据
const ablationData = [
  { name: '完整模型', acc: 92.3, enabled: true },
  { name: '移除 Attention', acc: 85.1, enabled: true },
  { name: '移除 Residual', acc: 87.6, enabled: true },
  { name: '移除 LayerNorm', acc: 83.2, enabled: true },
  { name: '移除 Dropout', acc: 90.8, enabled: true },
  { name: '移除 Warmup', acc: 89.4, enabled: true },
]

function LearningCurves({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
  const [epochs, setEpochs] = useState(100)
  const lrs = [0.1, 0.01, 0.001]
  const colors = [tc.accent, '#6366f1', '#f59e0b']

  const traces = lrs.map((lr, i) => ({
    x: Array.from({ length: epochs }, (_, j) => j + 1),
    y: generateLossCurve(lr, epochs),
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: `lr=${lr}`,
    line: { color: colors[i], width: 2 },
  }))

  return (
    <div className="card">
      <label>学习曲线对比 — EPOCHS: {epochs}</label>
      <input type="range" min={10} max={200} step={10} value={epochs}
        onChange={e => setEpochs(Number(e.target.value))} style={{ marginTop: 8 }} />
      <Plot
        data={traces}
        layout={plotLayout(tc, 'Training Loss', 'Epoch', 'Loss', 300)}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  )
}

function HyperparamSearch({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
  const [strategy, setStrategy] = useState<'grid' | 'random'>('grid')
  const data = strategy === 'grid' ? generateGridSearch(25) : generateRandomSearch(25)

  return (
    <div className="card">
      <div className="flex-between mb-12">
        <label>超参搜索可视化</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`btn ${strategy === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStrategy('grid')}>网格搜索</button>
          <button className={`btn ${strategy === 'random' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStrategy('random')}>随机搜索</button>
        </div>
      </div>
      <Plot
        data={[{
          x: data.lrs, y: data.losses,
          type: 'scatter', mode: 'markers',
          marker: { color: tc.accent, size: 8, opacity: 0.7 },
        }]}
        layout={{
          ...plotLayout(tc, `${strategy === 'grid' ? '网格' : '随机'}搜索`, '学习率 (log)', '最终 Loss', 280),
          xaxis: { type: 'log' as const, title: '学习率', color: tc.plotlyText, gridcolor: tc.plotlyGrid },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  )
}

function AblationTable({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
  const [items, setItems] = useState(ablationData)

  function toggleItem(index: number) {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, enabled: !item.enabled } : item
    ))
  }

  const visible = items.filter(it => it.enabled)

  return (
    <div className="card">
      <label className="mb-12" style={{ display: 'block' }}>消融实验</label>
      <AblationTableBody items={items} onToggle={toggleItem} />
      <Plot
        data={[{
          x: visible.map(it => it.name),
          y: visible.map(it => it.acc),
          type: 'bar',
          marker: { color: visible.map(it => it.name === '完整模型' ? tc.accent : '#6366f1') },
        }]}
        layout={plotLayout(tc, '消融对比', '', 'Accuracy (%)', 250)}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  )
}

function AblationTableBody({ items, onToggle }: {
  items: typeof ablationData; onToggle: (i: number) => void
}) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
      <thead>
        <tr>
          <th style={thStyle}>显示</th>
          <th style={thStyle}>配置</th>
          <th style={thStyle}>Accuracy</th>
          <th style={thStyle}>变化</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i}>
            <td style={tdStyle}>
              <input type="checkbox" checked={item.enabled} onChange={() => onToggle(i)} />
            </td>
            <td style={tdStyle}>{item.name}</td>
            <td style={tdStyle} className="metric">{item.acc}%</td>
            <td style={{ ...tdStyle, color: item.acc < ablationData[0].acc ? 'var(--error)' : 'var(--success)' }}>
              {i === 0 ? '—' : `${(item.acc - ablationData[0].acc).toFixed(1)}%`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function FormulaSection() {
  return (
    <div className="card">
      <label className="mb-12" style={{ display: 'block' }}>学习率衰减公式</label>
      <div style={{ display: 'grid', gap: 10 }}>
        <FormulaItem label="Cosine Annealing"
          tex="\eta_t = \eta_{min} + \frac{1}{2}(\eta_{max} - \eta_{min})(1 + \cos(\frac{t\pi}{T}))" />
        <FormulaItem label="Step Decay"
          tex="\eta_t = \eta_0 \cdot \gamma^{\lfloor t / s \rfloor}" />
        <FormulaItem label="Warmup Linear"
          tex="\eta_t = \eta_{target} \cdot \frac{t}{T_{warmup}}, \quad t < T_{warmup}" />
      </div>
    </div>
  )
}

function FormulaItem({ label, tex }: { label: string; tex: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <Tex math={tex} block />
    </div>
  )
}

function plotLayout(
  tc: ReturnType<typeof useThemeColors>, title: string,
  xTitle: string, yTitle: string, height: number
) {
  return {
    title: { text: title, font: { size: 14, color: tc.plotlyTitle } },
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    font: { color: tc.plotlyText, size: 11 },
    xaxis: { title: xTitle, gridcolor: tc.plotlyGrid, color: tc.plotlyText },
    yaxis: { title: yTitle, gridcolor: tc.plotlyGrid, color: tc.plotlyText },
    margin: { t: 40, b: 40, l: 50, r: 20 },
    height,
    legend: { font: { color: tc.plotlyText } },
  }
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)',
  fontSize: 11, color: 'var(--text-muted)',
}
const tdStyle: React.CSSProperties = {
  padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12,
}

export default function ExperimentPage() {
  const tc = useThemeColors()

  return (
    <div className="page" style={{ fontSize: 13 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        Experiment Management & Hyperparameter Tuning
      </div>
      <h3 className="mb-16">实验管理与调参</h3>

      <div className="grid-2 mb-16">
        <LearningCurves tc={tc} />
        <HyperparamSearch tc={tc} />
      </div>

      <div className="grid-2">
        <AblationTable tc={tc} />
        <FormulaSection />
      </div>
    </div>
  )
}
