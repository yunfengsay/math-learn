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

// sigmoid / tanh 工具函数
function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)) }
function tanh(x: number) { return Math.tanh(x) }

// RNN 展开图
function RNNUnrolled() {
  const [T, setT] = useState(4)
  const cellW = 70, cellH = 50, gapX = 30
  const totalW = T * cellW + (T - 1) * gapX + 80
  const svgH = 180

  return (
    <div className="card mb-16">
      <div className="flex-between mb-16">
        <label>RNN 展开图</label>
        <div className="flex-center">
          <span style={{ fontSize: 12 }}>时间步 T = {T}</span>
          <input type="range" min={2} max={8} value={T} style={{ width: 120 }}
            onChange={e => setT(Number(e.target.value))} />
        </div>
      </div>

      <svg viewBox={`0 0 ${totalW} ${svgH}`} style={{ width: '100%', maxWidth: totalW }}>
        <defs>
          <marker id="rnn-arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <path d="M0,0 L7,2.5 L0,5" fill="var(--accent)" />
          </marker>
        </defs>

        {Array.from({ length: T }, (_, t) => {
          const x = 40 + t * (cellW + gapX)
          const y = 60
          return (
            <g key={t}>
              {/* RNN cell */}
              <rect x={x} y={y} width={cellW} height={cellH} rx={8}
                fill="var(--accent-muted)" stroke="var(--accent)" strokeWidth={1.5} />
              <text x={x + cellW / 2} y={y + cellH / 2 + 4} textAnchor="middle" fontSize={11}
                fill="var(--text-primary)" fontWeight={600}>A</text>

              {/* 输入箭头 x_t */}
              <line x1={x + cellW / 2} y1={svgH - 15} x2={x + cellW / 2} y2={y + cellH + 2}
                stroke="var(--border)" strokeWidth={1} markerEnd="url(#rnn-arr)" />
              <text x={x + cellW / 2} y={svgH - 2} textAnchor="middle" fontSize={10}
                fill="var(--text-muted)">x₍{t + 1}₎</text>

              {/* 输出箭头 h_t */}
              <line x1={x + cellW / 2} y1={y - 2} x2={x + cellW / 2} y2={20}
                stroke="var(--border)" strokeWidth={1} markerEnd="url(#rnn-arr)" />
              <text x={x + cellW / 2} y={14} textAnchor="middle" fontSize={10}
                fill="var(--text-muted)">h₍{t + 1}₎</text>

              {/* 隐藏状态连接（同色表示权重共享） */}
              {t < T - 1 && (
                <line x1={x + cellW} y1={y + cellH / 2}
                  x2={x + cellW + gapX} y2={y + cellH / 2}
                  stroke="var(--accent)" strokeWidth={2} markerEnd="url(#rnn-arr)" />
              )}
            </g>
          )
        })}

        {/* 权重共享说明 */}
        <text x={totalW / 2} y={svgH - 30} textAnchor="middle" fontSize={10} fill="var(--accent)">
          ← 同色连接 = 权重共享 (W_hh, W_xh, W_hy 在所有时间步相同) →
        </text>
      </svg>
    </div>
  )
}

// LSTM 门控可视化
function LSTMGateViz() {
  const [step, setStep] = useState(0)
  const [inputs] = useState({ ht_1: 0.5, xt: 0.8, ct_1: 0.3 })

  // 逐步计算 LSTM 各门
  const concat = inputs.ht_1 + inputs.xt
  const ft = sigmoid(concat * 0.6 - 0.2)
  const it = sigmoid(concat * 0.5 + 0.1)
  const ct_hat = tanh(concat * 0.7)
  const ct = ft * inputs.ct_1 + it * ct_hat
  const ot = sigmoid(concat * 0.4 + 0.3)
  const ht = ot * tanh(ct)

  const steps = [
    { name: '遗忘门 f_t', formula: 'f_t = \\sigma(W_f \\cdot [h_{t-1}, x_t] + b_f)', value: ft, color: '#ef4444' },
    { name: '输入门 i_t', formula: 'i_t = \\sigma(W_i \\cdot [h_{t-1}, x_t] + b_i)', value: it, color: '#3b82f6' },
    { name: '候选值 ĉ_t', formula: '\\tilde{C}_t = \\tanh(W_C \\cdot [h_{t-1}, x_t] + b_C)', value: ct_hat, color: '#f59e0b' },
    { name: '更新细胞状态', formula: 'C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t', value: ct, color: 'var(--accent)' },
    { name: '输出门 o_t', formula: 'o_t = \\sigma(W_o \\cdot [h_{t-1}, x_t] + b_o)', value: ot, color: '#8b5cf6' },
    { name: '隐藏状态 h_t', formula: 'h_t = o_t \\odot \\tanh(C_t)', value: ht, color: 'var(--accent)' },
  ]

  return (
    <div className="card mb-16">
      <div className="flex-between mb-16">
        <label>LSTM 门控逐步计算</label>
        <div className="flex-center">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            h₍t-1₎={inputs.ht_1} x_t={inputs.xt} C₍t-1₎={inputs.ct_1}
          </span>
        </div>
      </div>

      <LSTMDiagram step={step} steps={steps} />

      <div style={{ marginTop: 12 }}>
        {steps.slice(0, step + 1).map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
            borderBottom: '1px solid var(--border-subtle)', opacity: i === step ? 1 : 0.6,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, minWidth: 100 }}>{s.name}</span>
            <span style={{ fontSize: 12 }}><Tex math={s.formula} /></span>
            <span className="metric" style={{ marginLeft: 'auto', color: s.color, fontSize: 13 }}>
              = {s.value.toFixed(4)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-center mt-16">
        <button className="btn btn-secondary" onClick={() => setStep(0)}>重置</button>
        <button className="btn btn-secondary" onClick={() => setStep(Math.max(0, step - 1))}>上一步</button>
        <button className="btn btn-primary" onClick={() => setStep(Math.min(steps.length - 1, step + 1))}>下一步</button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({step + 1}/{steps.length})</span>
      </div>
    </div>
  )
}

// LSTM 内部结构 SVG
function LSTMDiagram({ step, steps }: { step: number; steps: { name: string; color: string }[] }) {
  const gateNames = ['f_t', 'i_t', 'ĉ_t', 'C_t', 'o_t', 'h_t']
  const gateX = [80, 160, 240, 200, 320, 380]
  const gateY = [70, 70, 70, 30, 70, 30]

  return (
    <svg viewBox="0 0 460 120" style={{ width: '100%', maxWidth: 460 }}>
      {/* 细胞状态主线 */}
      <line x1={10} y1={30} x2={450} y2={30} stroke="var(--border)" strokeWidth={2} />
      <text x={10} y={22} fontSize={9} fill="var(--text-muted)">C₍t-1₎</text>
      <text x={430} y={22} fontSize={9} fill="var(--text-muted)">C_t</text>

      {/* 底部输入线 */}
      <line x1={10} y1={100} x2={350} y2={100} stroke="var(--border)" strokeWidth={1} strokeDasharray="3,3" />

      {gateNames.map((name, i) => {
        const active = i <= step
        const color = active ? steps[i]?.color || 'var(--border)' : 'var(--border)'
        return (
          <g key={i}>
            <rect x={gateX[i] - 22} y={gateY[i] - 15} width={44} height={30}
              rx={6} fill={active ? 'var(--accent-muted)' : 'var(--bg-card)'}
              stroke={color} strokeWidth={active ? 2 : 1} />
            <text x={gateX[i]} y={gateY[i] + 4} textAnchor="middle" fontSize={10}
              fill={active ? color : 'var(--text-muted)'} fontWeight={active ? 600 : 400}>
              {name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// 梯度消失演示
function GradientVanishing() {
  const [T, setT] = useState(10)
  const tc = useThemeColors()

  // 模拟 vanilla RNN 梯度指数衰减
  const rnnGrads = Array.from({ length: T }, (_, i) => Math.pow(0.7, T - 1 - i))
  // LSTM 梯度大致保持稳定（带少量波动）
  const lstmGrads = Array.from({ length: T }, (_, i) => 0.8 + Math.sin(i * 0.5) * 0.15)
  const labels = Array.from({ length: T }, (_, i) => `t=${i + 1}`)

  return (
    <div className="card mb-16">
      <div className="flex-between mb-16">
        <label>梯度消失对比: RNN vs LSTM</label>
        <div className="flex-center">
          <span style={{ fontSize: 12 }}>时间步 T = {T}</span>
          <input type="range" min={5} max={20} value={T} style={{ width: 120 }}
            onChange={e => setT(Number(e.target.value))} />
        </div>
      </div>
      <Plot
        data={[
          {
            x: labels, y: rnnGrads, type: 'bar', name: 'Vanilla RNN',
            marker: { color: tc.errorColor, opacity: 0.7 },
          },
          {
            x: labels, y: lstmGrads, type: 'bar', name: 'LSTM',
            marker: { color: tc.accent, opacity: 0.7 },
          },
        ]}
        layout={{
          title: { text: '反向传播梯度幅度', font: { size: 14, color: tc.plotlyTitle } },
          paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
          font: { color: tc.plotlyText, size: 11 },
          xaxis: { title: '时间步', gridcolor: tc.plotlyGrid },
          yaxis: { title: '梯度幅度 (相对)', gridcolor: tc.plotlyGrid },
          barmode: 'group',
          legend: { orientation: 'h', y: 1.1, x: 0.5, xanchor: 'center' },
          margin: { t: 50, b: 50, l: 50, r: 20 },
          height: 300,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
        Vanilla RNN 的梯度随时间步指数衰减 (∝ 0.7^t)，而 LSTM 通过门控机制保持梯度稳定流动。
      </div>
    </div>
  )
}

// 公式区
function RNNFormulas() {
  return (
    <div className="card">
      <label className="mb-16" style={{ display: 'block' }}>核心公式</label>
      <div style={{ display: 'grid', gap: 12 }}>
        <FormulaBlock title="RNN 更新规则"
          formula="h_t = \tanh(W_{hh} h_{t-1} + W_{xh} x_t + b_h)" />
        <FormulaBlock title="LSTM 遗忘门"
          formula="f_t = \sigma(W_f \cdot [h_{t-1}, x_t] + b_f)" />
        <FormulaBlock title="LSTM 输入门"
          formula="i_t = \sigma(W_i \cdot [h_{t-1}, x_t] + b_i)" />
        <FormulaBlock title="LSTM 细胞更新"
          formula="C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t" />
        <FormulaBlock title="LSTM 输出门"
          formula="h_t = o_t \odot \tanh(C_t)" />
        <FormulaBlock title="BPTT 梯度"
          formula="\frac{\partial L}{\partial W} = \sum_{t=1}^{T} \frac{\partial L_t}{\partial W}" />
      </div>
    </div>
  )
}

function FormulaBlock({ title, formula }: { title: string; formula: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{title}</div>
      <Tex math={formula} block />
    </div>
  )
}

export default function RNNPage() {
  return (
    <div className="page" style={{ fontSize: 13 }}>
      <h3 className="mb-16">循环神经网络 (RNN)</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
        循环神经网络通过隐藏状态在时间步间传递信息，适合处理序列数据。
        LSTM 通过门控机制解决了梯度消失问题。
      </p>

      <RNNUnrolled />
      <LSTMGateViz />
      <GradientVanishing />
      <RNNFormulas />
    </div>
  )
}
