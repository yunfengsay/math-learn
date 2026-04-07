import { useState } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'

function Tex({ math, block = false }: { math: string; block?: boolean }) {
  const html = katex.renderToString(math, { displayMode: block, throwOnError: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// --- 梯度下降可视化 ---
interface GDPoint { x: number; grad: number; step: number }

function buildGDHistory(startX: number, lr: number, steps: number): GDPoint[] {
  const history: GDPoint[] = []
  let x = startX
  for (let i = 0; i <= steps; i++) {
    const grad = 2 * x
    history.push({ x, grad, step: i })
    x = x - lr * grad
  }
  return history
}

function GDCurveSVG({ history, lr }: { history: GDPoint[]; lr: number }) {
  const w = 400, h = 220, pad = 30
  const xRange = 5
  const yMax = xRange * xRange

  function toSVG(x: number, y: number): [number, number] {
    const sx = pad + ((x + xRange) / (2 * xRange)) * (w - 2 * pad)
    const sy = h - pad - (y / yMax) * (h - 2 * pad)
    return [sx, sy]
  }

  // f(x) = x^2 曲线
  const curvePoints = Array.from({ length: 100 }, (_, i) => {
    const x = -xRange + (i / 99) * 2 * xRange
    return toSVG(x, x * x)
  })
  const curveD = curvePoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')

  const current = history[history.length - 1]
  const [cx, cy] = toSVG(current.x, current.x * current.x)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', background: 'var(--bg-surface)', borderRadius: 8 }}>
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="var(--border)" strokeWidth={0.5} />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="var(--border)" strokeWidth={0.5} />
      <path d={curveD} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} />
      {/* 历史轨迹 */}
      {history.slice(0, -1).map((p, i) => {
        const [x1, y1] = toSVG(p.x, p.x * p.x)
        const next = history[i + 1]
        const [x2, y2] = toSVG(next.x, next.x * next.x)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent)" strokeWidth={1} opacity={0.5} />
      })}
      {history.map((p, i) => {
        const [px, py] = toSVG(p.x, p.x * p.x)
        return <circle key={i} cx={px} cy={py} r={i === history.length - 1 ? 5 : 3}
          fill={i === history.length - 1 ? 'var(--accent)' : 'var(--accent)'} opacity={i === history.length - 1 ? 1 : 0.4} />
      })}
      <text x={cx + 8} y={cy - 8} fontSize={10} fill="var(--text-primary)">
        x={current.x.toFixed(3)}
      </text>
      <text x={w / 2} y={h - 8} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
        f(x) = x², lr={lr}
      </text>
    </svg>
  )
}

function GradientDescent() {
  const [lr, setLr] = useState(0.3)
  const [step, setStep] = useState(0)
  const [startX] = useState(4)
  const maxSteps = 20

  const history = buildGDHistory(startX, lr, step)
  const current = history[history.length - 1]

  return (
    <div>
      <GDCurveSVG history={history} lr={lr} />
      <div className="mt-16" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label style={{ whiteSpace: 'nowrap' }}>学习率: {lr.toFixed(2)}</label>
        <input type="range" min={0.01} max={0.95} step={0.01} value={lr}
          onChange={e => { setLr(Number(e.target.value)); setStep(0) }} />
      </div>
      <div className="mt-16" style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={() => setStep(s => Math.min(s + 1, maxSteps))}>
          下一步
        </button>
        <button className="btn btn-secondary" onClick={() => setStep(0)}>重置</button>
        <button className="btn btn-secondary" onClick={() => setStep(maxSteps)}>
          运行全部
        </button>
      </div>
      <div className="metric mt-16" style={{ fontSize: 12, lineHeight: 1.8 }}>
        <div>步数: {step} | x = {current.x.toFixed(4)} | f(x) = {(current.x ** 2).toFixed(4)}</div>
        <div>梯度: f'(x) = 2x = {current.grad.toFixed(4)}</div>
      </div>
    </div>
  )
}

// --- 计算图：前向和反向传播 ---
interface GraphNode {
  id: string; label: string; x: number; y: number
  value?: number; grad?: number; desc: string
}

function buildComputeGraph(xVal: number, yVal: number): GraphNode[] {
  const t = xVal * xVal
  const s = t + yVal
  const out = Math.sin(s)
  // 反向传播
  const dout = 1
  const ds = Math.cos(s) * dout
  const dt = ds
  const dy = ds
  const dx = 2 * xVal * dt
  return [
    { id: 'x', label: 'x', x: 40, y: 40, value: xVal, grad: dx, desc: '输入变量 x' },
    { id: 'y', label: 'y', x: 40, y: 160, value: yVal, grad: dy, desc: '输入变量 y' },
    { id: 't', label: 'x²', x: 160, y: 40, value: t, grad: dt, desc: 't = x²' },
    { id: 's', label: 'x²+y', x: 280, y: 100, value: s, grad: ds, desc: 's = x² + y' },
    { id: 'f', label: 'sin(·)', x: 400, y: 100, value: out, grad: dout, desc: 'f = sin(x²+y)' },
  ]
}

const graphEdges = [
  ['x', 't'], ['t', 's'], ['y', 's'], ['s', 'f'],
] as const

function ComputeGraph() {
  const [xVal, setXVal] = useState(1.5)
  const [yVal, setYVal] = useState(0.5)
  const [selected, setSelected] = useState<string | null>(null)

  const nodes = buildComputeGraph(xVal, yVal)
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
  const sel = selected ? nodeMap[selected] : null

  return (
    <div>
      <svg viewBox="0 0 460 200" style={{ width: '100%', background: 'var(--bg-surface)', borderRadius: 8 }}>
        {graphEdges.map(([from, to]) => {
          const a = nodeMap[from], b = nodeMap[to]
          return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="var(--border)" strokeWidth={1.5} />
        })}
        {nodes.map(n => (
          <g key={n.id} onClick={() => setSelected(n.id)} style={{ cursor: 'pointer' }}>
            <circle cx={n.x} cy={n.y} r={22}
              fill={selected === n.id ? 'var(--accent)' : 'var(--bg-card)'}
              stroke={selected === n.id ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={1.5} />
            <text x={n.x} y={n.y - 6} textAnchor="middle" fontSize={10}
              fill={selected === n.id ? '#09090b' : 'var(--text-primary)'}>{n.label}</text>
            <text x={n.x} y={n.y + 8} textAnchor="middle" fontSize={8}
              fill={selected === n.id ? '#09090b' : 'var(--text-muted)'}>{n.value?.toFixed(2)}</text>
          </g>
        ))}
      </svg>
      <div className="mt-16" style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label>x = {xVal.toFixed(1)}</label>
          <input type="range" min={-3} max={3} step={0.1} value={xVal}
            onChange={e => setXVal(Number(e.target.value))} />
        </div>
        <div style={{ flex: 1 }}>
          <label>y = {yVal.toFixed(1)}</label>
          <input type="range" min={-3} max={3} step={0.1} value={yVal}
            onChange={e => setYVal(Number(e.target.value))} />
        </div>
      </div>
      {sel && (
        <div className="metric mt-16" style={{ fontSize: 12, background: 'var(--bg-surface)', padding: 10, borderRadius: 6 }}>
          <div><strong>{sel.desc}</strong></div>
          <div>前向值: {sel.value?.toFixed(4)} | 反向梯度 ∂f/∂{sel.id}: {sel.grad?.toFixed(4)}</div>
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        点击节点查看局部梯度
      </div>
    </div>
  )
}

// --- Jacobian 矩阵可视化 ---
function JacobianViz() {
  const [inputDim, setInputDim] = useState(3)
  const [outputDim, setOutputDim] = useState(2)

  const cells = Array.from({ length: outputDim }, (_, i) =>
    Array.from({ length: inputDim }, (_, j) => ({ i, j }))
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <div>
          <label>输入维度 n = {inputDim}</label>
          <input type="range" min={1} max={6} value={inputDim}
            onChange={e => setInputDim(Number(e.target.value))} />
        </div>
        <div>
          <label>输出维度 m = {outputDim}</label>
          <input type="range" min={1} max={6} value={outputDim}
            onChange={e => setOutputDim(Number(e.target.value))} />
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            {cells.map((row, i) => (
              <tr key={i}>
                {row.map(({ j }) => (
                  <td key={j} style={{
                    border: '1px solid var(--border)',
                    padding: '6px 10px',
                    textAlign: 'center',
                    background: 'var(--bg-surface)',
                  }}>
                    <Tex math={`\\frac{\\partial f_{${i + 1}}}{\\partial x_{${j + 1}}}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-16" style={{ fontSize: 13 }}>
        <Tex math={`J \\in \\mathbb{R}^{${outputDim} \\times ${inputDim}}`} /> — 每行是一个输出对所有输入的偏导数
      </div>
    </div>
  )
}

// --- 公式区 ---
function FormulaSection() {
  const formulas = [
    { label: '偏导数', tex: '\\frac{\\partial f}{\\partial x} = \\lim_{h \\to 0} \\frac{f(x+h, y) - f(x, y)}{h}' },
    { label: '链式法则', tex: '\\frac{\\partial f}{\\partial x} = \\frac{\\partial f}{\\partial u} \\cdot \\frac{\\partial u}{\\partial x}' },
    { label: '多变量链式法则', tex: '\\frac{\\partial f}{\\partial x_i} = \\sum_j \\frac{\\partial f}{\\partial u_j} \\frac{\\partial u_j}{\\partial x_i}' },
    { label: 'Jacobian 定义', tex: 'J = \\begin{bmatrix} \\frac{\\partial f_1}{\\partial x_1} & \\cdots & \\frac{\\partial f_1}{\\partial x_n} \\\\ \\vdots & \\ddots & \\vdots \\\\ \\frac{\\partial f_m}{\\partial x_1} & \\cdots & \\frac{\\partial f_m}{\\partial x_n} \\end{bmatrix}' },
    { label: '梯度下降更新', tex: '\\theta_{t+1} = \\theta_t - \\eta \\nabla_{\\theta} L(\\theta_t)' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {formulas.map((f, i) => (
        <div key={i} style={{ background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
          <Tex math={f.tex} block />
        </div>
      ))}
    </div>
  )
}

// --- 主页面 ---
export default function CalculusPage() {
  return (
    <div className="page" style={{ fontSize: 13 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        Calculus & Automatic Differentiation
      </div>
      <h3 className="mb-16">微积分与自动微分</h3>

      <div className="grid-2 mb-16">
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Gradient Descent on f(x) = x²
          </div>
          <GradientDescent />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Computation Graph — f = sin(x² + y)
          </div>
          <ComputeGraph />
        </div>
      </div>

      <div className="grid-2 mb-16">
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Jacobian Matrix
          </div>
          <JacobianViz />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Key Formulas
          </div>
          <FormulaSection />
        </div>
      </div>
    </div>
  )
}
