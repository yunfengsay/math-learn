import { useState } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'

function Tex({ math, block = false }: { math: string; block?: boolean }) {
  const html = katex.renderToString(math, { displayMode: block, throwOnError: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// ============================================================
// 计算图数据结构与计算逻辑
// ============================================================

interface GraphNode {
  id: string
  label: string
  op: string       // 'input' | '+' | '*'
  x: number
  y: number
  value: number
  grad: number
  children: string[]
}

/** 根据输入 a, b 构建计算图 y = (a+b)*(b+1) */
function buildGraph(a: number, b: number): GraphNode[] {
  const c = a + b
  const d = b + 1
  const y = c * d
  return [
    { id: 'a', label: 'a', op: 'input', x: 60, y: 60, value: a, grad: 0, children: [] },
    { id: 'b', label: 'b', op: 'input', x: 60, y: 180, value: b, grad: 0, children: [] },
    { id: 'one', label: '1', op: 'input', x: 60, y: 280, value: 1, grad: 0, children: [] },
    { id: 'c', label: 'c=a+b', op: '+', x: 240, y: 80, value: c, grad: 0, children: ['a', 'b'] },
    { id: 'd', label: 'd=b+1', op: '+', x: 240, y: 230, value: d, grad: 0, children: ['b', 'one'] },
    { id: 'y', label: 'y=c*d', op: '*', x: 420, y: 155, value: y, grad: 1, children: ['c', 'd'] },
  ]
}

/** 逐步反向传播：每一步返回新图和当前处理的节点id */
function backpropSteps(graph: GraphNode[]): { nodes: GraphNode[]; activeId: string; desc: string }[] {
  const steps: { nodes: GraphNode[]; activeId: string; desc: string }[] = []
  const g = graph.map(n => ({ ...n }))
  const map = Object.fromEntries(g.map(n => [n.id, n]))

  // 初始化：dy/dy = 1
  map['y'].grad = 1
  steps.push({ nodes: g.map(n => ({ ...n })), activeId: 'y', desc: '初始化: ∂y/∂y = 1' })

  // y = c * d → dc = d, dd = c
  const c = map['c'], d = map['d'], y = map['y']
  c.grad = d.value * y.grad
  steps.push({
    nodes: g.map(n => ({ ...n })),
    activeId: 'c',
    desc: `∂y/∂c = d × ∂y/∂y = ${d.value} × ${y.grad} = ${c.grad}`,
  })
  d.grad = c.value * y.grad
  steps.push({
    nodes: g.map(n => ({ ...n })),
    activeId: 'd',
    desc: `∂y/∂d = c × ∂y/∂y = ${c.value} × ${y.grad} = ${d.grad}`,
  })

  // c = a + b → da += dc, db += dc
  map['a'].grad += c.grad
  steps.push({
    nodes: g.map(n => ({ ...n })),
    activeId: 'a',
    desc: `∂y/∂a = 1 × ∂y/∂c = ${c.grad}`,
  })
  map['b'].grad += c.grad
  steps.push({
    nodes: g.map(n => ({ ...n })),
    activeId: 'b',
    desc: `∂y/∂b (经c路径) = 1 × ∂y/∂c = ${c.grad}`,
  })

  // d = b + 1 → db += dd
  map['b'].grad += d.grad
  steps.push({
    nodes: g.map(n => ({ ...n })),
    activeId: 'b',
    desc: `∂y/∂b (经d路径) += 1 × ∂y/∂d = ${d.grad}，总梯度 = ${map['b'].grad}`,
  })

  return steps
}

// ============================================================
// SVG 计算图组件
// ============================================================

function GraphEdge({ from, to, color }: { from: GraphNode; to: GraphNode; color: string }) {
  return (
    <line
      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
      stroke={color} strokeWidth={2} opacity={0.5}
    />
  )
}

function GraphNodeCircle({ node, active, mode }: {
  node: GraphNode; active: boolean; mode: 'forward' | 'backward'
}) {
  const isOp = node.op !== 'input'
  const r = isOp ? 28 : 22
  const fillColor = active ? 'var(--accent)' : isOp ? 'var(--bg-surface)' : 'var(--bg-card)'
  const textColor = active ? '#09090b' : 'var(--text-primary)'
  const displayValue = mode === 'forward' ? node.value.toFixed(1) : node.grad.toFixed(1)
  const valueLabel = mode === 'forward' ? 'val' : '∂y/∂'

  return (
    <g>
      <circle cx={node.x} cy={node.y} r={r}
        fill={fillColor} stroke={active ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={active ? 2.5 : 1.5}
      />
      <text x={node.x} y={node.y - 6} textAnchor="middle" fontSize={11}
        fontWeight={600} fill={textColor}>
        {node.op !== 'input' ? node.op : node.label}
      </text>
      <text x={node.x} y={node.y + 10} textAnchor="middle" fontSize={9} fill={textColor} opacity={0.8}>
        {valueLabel}: {displayValue}
      </text>
    </g>
  )
}

function ComputeGraphSVG({ nodes, activeId, mode }: {
  nodes: GraphNode[]; activeId: string; mode: 'forward' | 'backward'
}) {
  const map = Object.fromEntries(nodes.map(n => [n.id, n]))
  const edgeColor = mode === 'forward' ? 'var(--border)' : 'var(--accent)'

  return (
    <svg viewBox="0 0 500 340" style={{ width: '100%', maxWidth: 500 }}>
      {nodes.filter(n => n.children.length > 0).flatMap(n =>
        n.children.map(cid => (
          <GraphEdge key={`${cid}-${n.id}`} from={map[cid]} to={n} color={edgeColor} />
        ))
      )}
      {nodes.map(n => (
        <GraphNodeCircle key={n.id} node={n} active={n.id === activeId} mode={mode} />
      ))}
      <text x={250} y={330} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
        y = (a + b) × (b + 1)
      </text>
    </svg>
  )
}

// ============================================================
// 交互模块1: 计算图可视化 + 逐步反向传播
// ============================================================

function ComputeGraphSection() {
  const [a, setA] = useState(2)
  const [b, setB] = useState(3)
  const [mode, setMode] = useState<'forward' | 'backward'>('forward')
  const [stepIdx, setStepIdx] = useState(-1)

  const graph = buildGraph(a, b)
  const steps = backpropSteps(graph)
  const currentNodes = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx].nodes : graph
  const activeId = stepIdx >= 0 && stepIdx < steps.length ? steps[stepIdx].activeId : ''

  function handleNext() {
    setMode('backward')
    setStepIdx(prev => Math.min(prev + 1, steps.length - 1))
  }

  function handleReset() {
    setStepIdx(-1)
    setMode('forward')
  }

  return (
    <div className="grid-2 mb-16">
      <div className="card">
        <div className="flex-between mb-12">
          <label>计算图</label>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={`btn ${mode === 'forward' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 12px', fontSize: 11 }} onClick={handleReset}>
              前向
            </button>
            <button className={`btn ${mode === 'backward' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => setMode('backward')}>
              反向
            </button>
          </div>
        </div>
        <ComputeGraphSVG nodes={currentNodes} activeId={activeId} mode={mode} />
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label>a = {a}</label>
            <input type="range" min={-5} max={5} step={0.5} value={a}
              onChange={e => { setA(Number(e.target.value)); handleReset() }} />
          </div>
          <div style={{ flex: 1 }}>
            <label>b = {b}</label>
            <input type="range" min={-5} max={5} step={0.5} value={b}
              onChange={e => { setB(Number(e.target.value)); handleReset() }} />
          </div>
        </div>
      </div>

      <div className="card">
        <label className="mb-12" style={{ display: 'block' }}>逐步反向传播</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 12 }}
            onClick={handleNext} disabled={stepIdx >= steps.length - 1}>
            下一步
          </button>
          <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: 12 }}
            onClick={handleReset}>
            重置
          </button>
          <span className="metric" style={{ fontSize: 11, alignSelf: 'center', color: 'var(--text-muted)' }}>
            {stepIdx >= 0 ? `${stepIdx + 1} / ${steps.length}` : '就绪'}
          </span>
        </div>
        <StepList steps={steps} currentIdx={stepIdx} />
        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-surface)', borderRadius: 8, fontSize: 13 }}>
          <div style={{ marginBottom: 6, color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase' }}>
            链式法则
          </div>
          <Tex math="\frac{\partial y}{\partial x} = \sum_{i} \frac{\partial y}{\partial z_i} \cdot \frac{\partial z_i}{\partial x}" block />
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            反向传播从输出节点开始，沿计算图反向遍历。
            每个节点将上游梯度乘以<strong>局部梯度</strong>传给子节点。
          </div>
        </div>
      </div>
    </div>
  )
}

function StepList({ steps, currentIdx }: {
  steps: { desc: string }[]; currentIdx: number
}) {
  return (
    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          padding: '6px 10px', margin: '3px 0', borderRadius: 6, fontSize: 12,
          background: i === currentIdx ? 'var(--accent-muted)' : 'transparent',
          color: i <= currentIdx ? 'var(--text-primary)' : 'var(--text-muted)',
          borderLeft: i === currentIdx ? '3px solid var(--accent)' : '3px solid transparent',
        }}>
          {s.desc}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// 交互模块2: 梯度检查
// ============================================================

interface GradCheckFunc {
  name: string
  expr: string
  fn: (x: number) => number
  dfn: (x: number) => number
  latexF: string
  latexDf: string
}

const gradFunctions: GradCheckFunc[] = [
  {
    name: 'x²', expr: 'x^2', fn: x => x * x, dfn: x => 2 * x,
    latexF: 'f(x) = x^2', latexDf: "f'(x) = 2x",
  },
  {
    name: 'sin(x)', expr: 'sin(x)', fn: Math.sin, dfn: Math.cos,
    latexF: 'f(x) = \\sin(x)', latexDf: "f'(x) = \\cos(x)",
  },
  {
    name: 'e^x', expr: 'e^x', fn: Math.exp, dfn: Math.exp,
    latexF: 'f(x) = e^x', latexDf: "f'(x) = e^x",
  },
  {
    name: 'x³ - 2x', expr: 'x^3 - 2x', fn: x => x ** 3 - 2 * x, dfn: x => 3 * x * x - 2,
    latexF: 'f(x) = x^3 - 2x', latexDf: "f'(x) = 3x^2 - 2",
  },
]

function numericalGrad(fn: (x: number) => number, x: number, h: number) {
  return (fn(x + h) - fn(x - h)) / (2 * h)
}

function GradientCheckSection() {
  const [funcIdx, setFuncIdx] = useState(0)
  const [xVal, setXVal] = useState(2.0)
  const [hExp, setHExp] = useState(-4)

  const f = gradFunctions[funcIdx]
  const h = Math.pow(10, hExp)
  const analytical = f.dfn(xVal)
  const numerical = numericalGrad(f.fn, xVal, h)
  const error = Math.abs(analytical - numerical)

  return (
    <div className="card">
      <label className="mb-12" style={{ display: 'block' }}>梯度检查 — 解析梯度 vs 数值梯度</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {gradFunctions.map((gf, i) => (
          <button key={i}
            className={`btn ${funcIdx === i ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 12px', fontSize: 11 }}
            onClick={() => setFuncIdx(i)}>
            {gf.name}
          </button>
        ))}
      </div>
      <GradCheckDisplay f={f} xVal={xVal} h={h} analytical={analytical} numerical={numerical} error={error} />
      <GradCheckSliders xVal={xVal} setXVal={setXVal} hExp={hExp} setHExp={setHExp} h={h} />
      <GradCheckFormulas />
    </div>
  )
}

function GradCheckDisplay({ f, xVal, analytical, numerical, error }: {
  f: GradCheckFunc; xVal: number; h: number; analytical: number; numerical: number; error: number
}) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <Tex math={f.latexF} /> &nbsp;→&nbsp; <Tex math={f.latexDf} />
      </div>
      <div className="metric" style={{ fontSize: 12, lineHeight: 1.8 }}>
        <div>x = {xVal.toFixed(2)}</div>
        <div>解析梯度: <strong style={{ color: 'var(--accent)' }}>{analytical.toFixed(8)}</strong></div>
        <div>数值梯度: <strong style={{ color: '#3b82f6' }}>{numerical.toFixed(8)}</strong></div>
        <div>
          误差: <strong style={{ color: error < 1e-6 ? 'var(--success)' : 'var(--error)' }}>
            {error.toExponential(4)}
          </strong>
          {error < 1e-6 && <span style={{ color: 'var(--success)', marginLeft: 8 }}>✓ 梯度正确</span>}
        </div>
      </div>
    </div>
  )
}

function GradCheckSliders({ xVal, setXVal, hExp, setHExp, h }: {
  xVal: number; setXVal: (v: number) => void; hExp: number; setHExp: (v: number) => void; h: number
}) {
  return (
    <div className="grid-2" style={{ gap: 12 }}>
      <div>
        <label>x = {xVal.toFixed(1)}</label>
        <input type="range" min={-5} max={5} step={0.1} value={xVal}
          onChange={e => setXVal(Number(e.target.value))} />
      </div>
      <div>
        <label>h = 10^{hExp} = {h.toExponential(0)}</label>
        <input type="range" min={-8} max={-1} step={1} value={hExp}
          onChange={e => setHExp(Number(e.target.value))} />
      </div>
    </div>
  )
}

function GradCheckFormulas() {
  return (
    <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-surface)', borderRadius: 8 }}>
      <div style={{ marginBottom: 8, fontSize: 13 }}>
        <Tex math="\text{数值梯度} = \frac{f(x+h) - f(x-h)}{2h}" block />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        中心差分法的精度为 <Tex math="O(h^2)" />，比前向差分 <Tex math="O(h)" /> 更精确。
        h 过大导致截断误差，过小导致浮点舍入误差。通常 <Tex math="h \approx 10^{-4}" /> 到 <Tex math="10^{-5}" /> 是最佳范围。
      </div>
    </div>
  )
}

// ============================================================
// 核心公式区域
// ============================================================

function BackpropFormulas() {
  return (
    <div className="card mb-16">
      <label className="mb-12" style={{ display: 'block' }}>核心公式</label>
      <div className="grid-2" style={{ gap: 12 }}>
        <FormulaCard title="链式法则 (标量)" math="\frac{\partial L}{\partial x} = \frac{\partial L}{\partial y} \cdot \frac{\partial y}{\partial x}" />
        <FormulaCard title="多路径链式法则" math="\frac{\partial L}{\partial x} = \sum_{i=1}^{n} \frac{\partial L}{\partial y_i} \cdot \frac{\partial y_i}{\partial x}" />
        <FormulaCard title="加法节点" math="z = x + y \implies \frac{\partial z}{\partial x} = 1, \; \frac{\partial z}{\partial y} = 1" />
        <FormulaCard title="乘法节点" math="z = x \cdot y \implies \frac{\partial z}{\partial x} = y, \; \frac{\partial z}{\partial y} = x" />
      </div>
    </div>
  )
}

function FormulaCard({ title, math }: { title: string; math: string }) {
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

export default function BackpropPage() {
  return (
    <div className="page" style={{ fontSize: 13 }}>
      <h3 className="mb-16">反向传播与计算图</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
        反向传播是训练神经网络的核心算法。它利用计算图的拓扑结构和链式法则，
        高效地计算损失函数对每个参数的梯度。
      </p>
      <BackpropFormulas />
      <ComputeGraphSection />
      <GradientCheckSection />
    </div>
  )
}
