import { useState } from 'react'
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

// --- 高斯分布 PDF ---
function gaussianPDF(x: number, mu: number, sigma: number): number {
  const coeff = 1 / (sigma * Math.sqrt(2 * Math.PI))
  return coeff * Math.exp(-0.5 * ((x - mu) / sigma) ** 2)
}

// --- 分布可视化器 ---
type DistType = 'gaussian' | 'uniform' | 'bernoulli'

function GaussianControls({ mu, sigma, setMu, setSigma }: {
  mu: number; sigma: number; setMu: (v: number) => void; setSigma: (v: number) => void
}) {
  return (
    <>
      <div>
        <label>mu = {mu.toFixed(1)}</label>
        <input type="range" min={-4} max={4} step={0.1} value={mu}
          onChange={e => setMu(Number(e.target.value))} />
      </div>
      <div>
        <label>sigma = {sigma.toFixed(1)}</label>
        <input type="range" min={0.3} max={3} step={0.1} value={sigma}
          onChange={e => setSigma(Number(e.target.value))} />
      </div>
    </>
  )
}

function buildGaussianTrace(mu: number, sigma: number, tc: ReturnType<typeof useThemeColors>) {
  const xs = Array.from({ length: 200 }, (_, i) => -8 + (i / 199) * 16)
  const ys = xs.map(x => gaussianPDF(x, mu, sigma))
  return {
    data: [{ x: xs, y: ys, type: 'scatter' as const, mode: 'lines' as const, line: { color: tc.accent, width: 2 } }],
    title: `N(${mu.toFixed(1)}, ${sigma.toFixed(1)}²)`,
  }
}

function buildUniformTrace(a: number, b: number, tc: ReturnType<typeof useThemeColors>) {
  const h = 1 / (b - a)
  const xs = Array.from({ length: 200 }, (_, i) => -6 + (i / 199) * 12)
  const ys = xs.map(x => (x >= a && x <= b) ? h : 0)
  return {
    data: [{ x: xs, y: ys, type: 'scatter' as const, mode: 'lines' as const, line: { color: tc.accent, width: 2 } }],
    title: `U(${a.toFixed(1)}, ${b.toFixed(1)})`,
  }
}

function buildBernoulliTrace(p: number, tc: ReturnType<typeof useThemeColors>) {
  return {
    data: [{
      x: [0, 1], y: [1 - p, p], type: 'bar' as const,
      marker: { color: [tc.accentDim, tc.accent] }, width: 0.4,
    }],
    title: `Bernoulli(${p.toFixed(2)})`,
  }
}

function GaussianDistPanel({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
  const [mu, setMu] = useState(0)
  const [sigma, setSigma] = useState(1)
  const trace = buildGaussianTrace(mu, sigma, tc)
  return (
    <DistPlot trace={trace} tc={tc}>
      <GaussianControls mu={mu} sigma={sigma} setMu={setMu} setSigma={setSigma} />
    </DistPlot>
  )
}

function UniformDistPanel({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
  const [uniA, setUniA] = useState(-2)
  const [uniB, setUniB] = useState(2)
  const trace = buildUniformTrace(uniA, uniB, tc)
  return (
    <DistPlot trace={trace} tc={tc}>
      <div>
        <label>a = {uniA.toFixed(1)}</label>
        <input type="range" min={-5} max={0} step={0.1} value={uniA}
          onChange={e => setUniA(Number(e.target.value))} />
      </div>
      <div>
        <label>b = {uniB.toFixed(1)}</label>
        <input type="range" min={0.5} max={5} step={0.1} value={uniB}
          onChange={e => setUniB(Number(e.target.value))} />
      </div>
    </DistPlot>
  )
}

function BernoulliDistPanel({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
  const [bernP, setBernP] = useState(0.6)
  const trace = buildBernoulliTrace(bernP, tc)
  return (
    <DistPlot trace={trace} tc={tc}>
      <div style={{ flex: 1 }}>
        <label>p = {bernP.toFixed(2)}</label>
        <input type="range" min={0.01} max={0.99} step={0.01} value={bernP}
          onChange={e => setBernP(Number(e.target.value))} />
      </div>
    </DistPlot>
  )
}

function DistPlot({ trace, tc, children }: {
  trace: { data: object[]; title: string }
  tc: ReturnType<typeof useThemeColors>
  children: React.ReactNode
}) {
  return (
    <div>
      <Plot
        data={trace.data as Plotly.Data[]}
        layout={{
          paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
          font: { color: tc.plotlyText, size: 11 },
          xaxis: { gridcolor: tc.plotlyGrid },
          yaxis: { gridcolor: tc.plotlyGrid, title: 'P(x)' },
          margin: { t: 40, b: 40, l: 50, r: 20 },
          height: 260,
          title: { text: trace.title, font: { size: 13, color: tc.plotlyTitle } },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
      <div className="mt-16" style={{ display: 'flex', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

function DistributionVisualizer() {
  const [distType, setDistType] = useState<DistType>('gaussian')
  const tc = useThemeColors()

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(['gaussian', 'uniform', 'bernoulli'] as const).map(d => (
          <button key={d} className={`btn ${distType === d ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => setDistType(d)}>
            {d === 'gaussian' ? '高斯' : d === 'uniform' ? '均匀' : '伯努利'}
          </button>
        ))}
      </div>
      {distType === 'gaussian' && <GaussianDistPanel tc={tc} />}
      {distType === 'uniform' && <UniformDistPanel tc={tc} />}
      {distType === 'bernoulli' && <BernoulliDistPanel tc={tc} />}
    </div>
  )
}

// --- 贝叶斯定理计算器 ---
function BayesCalculator() {
  const [pA, setPA] = useState(0.01)
  const [pBgivenA, setPBgivenA] = useState(0.9)
  const [pB, setPB] = useState(0.05)

  const pAgivenB = (pBgivenA * pA) / pB
  const clampedResult = Math.min(pAgivenB, 1)

  // 面积可视化：用矩形表示概率
  const w = 300, h = 120
  const totalW = w - 40
  const pBW = totalW * pB
  const pABW = totalW * pA * pBgivenA

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label>P(A) = {pA.toFixed(3)}</label>
          <input type="range" min={0.001} max={0.5} step={0.001} value={pA}
            onChange={e => setPA(Number(e.target.value))} />
        </div>
        <div>
          <label>P(B|A) = {pBgivenA.toFixed(2)}</label>
          <input type="range" min={0.01} max={1} step={0.01} value={pBgivenA}
            onChange={e => setPBgivenA(Number(e.target.value))} />
        </div>
        <div>
          <label>P(B) = {pB.toFixed(3)}</label>
          <input type="range" min={0.01} max={1} step={0.01} value={pB}
            onChange={e => setPB(Number(e.target.value))} />
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', background: 'var(--bg-surface)', borderRadius: 8 }}>
        {/* P(B) 区域 */}
        <rect x={20} y={20} width={pBW} height={40} fill="var(--border)" rx={4} />
        <text x={20 + pBW / 2} y={44} textAnchor="middle" fontSize={9} fill="var(--text-muted)">P(B)</text>
        {/* P(A∩B) 区域 */}
        <rect x={20} y={20} width={pABW} height={40} fill="var(--accent)" rx={4} opacity={0.7} />
        <text x={20 + pABW / 2} y={44} textAnchor="middle" fontSize={8} fill="#fff">A∩B</text>
        <text x={20} y={85} fontSize={10} fill="var(--text-muted)">
          P(A|B) = P(B|A)·P(A) / P(B)
        </text>
      </svg>
      <div className="metric mt-16" style={{ fontSize: 14, textAlign: 'center' }}>
        <Tex math={`P(A|B) = \\frac{${pBgivenA.toFixed(2)} \\times ${pA.toFixed(3)}}{${pB.toFixed(3)}} = ${clampedResult.toFixed(4)}`} block />
      </div>
    </div>
  )
}

// --- 熵与KL散度 ---
function discreteGaussian(mu: number, sigma: number, n: number): number[] {
  const raw = Array.from({ length: n }, (_, i) => gaussianPDF(i, mu, sigma))
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map(v => v / sum)
}

function entropy(p: number[]): number {
  return -p.reduce((s, pi) => s + (pi > 1e-12 ? pi * Math.log2(pi) : 0), 0)
}

function crossEntropy(p: number[], q: number[]): number {
  return -p.reduce((s, pi, i) => s + (pi > 1e-12 ? pi * Math.log2(Math.max(q[i], 1e-12)) : 0), 0)
}

function klDivergence(p: number[], q: number[]): number {
  return crossEntropy(p, q) - entropy(p)
}

function EntropyKLSection() {
  const [muP, setMuP] = useState(5)
  const [muQ, setMuQ] = useState(7)
  const [sigmaP, setSigmaP] = useState(1.5)
  const tc = useThemeColors()

  const n = 15
  const pDist = discreteGaussian(muP, sigmaP, n)
  const qDist = discreteGaussian(muQ, sigmaP, n)
  const xs = Array.from({ length: n }, (_, i) => i)

  const hP = entropy(pDist)
  const hPQ = crossEntropy(pDist, qDist)
  const kl = klDivergence(pDist, qDist)

  return (
    <div>
      <Plot
        data={[
          { x: xs, y: pDist, type: 'bar', name: 'P', marker: { color: tc.accent }, opacity: 0.7 },
          { x: xs, y: qDist, type: 'bar', name: 'Q', marker: { color: tc.errorColor }, opacity: 0.7 },
        ]}
        layout={{
          paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
          font: { color: tc.plotlyText, size: 11 },
          xaxis: { gridcolor: tc.plotlyGrid },
          yaxis: { gridcolor: tc.plotlyGrid, title: '概率' },
          margin: { t: 30, b: 40, l: 50, r: 20 },
          height: 220, barmode: 'group',
          legend: { x: 0.8, y: 1, font: { size: 11 } },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
      <div className="mt-16" style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label>P 中心 = {muP}</label>
          <input type="range" min={1} max={13} value={muP}
            onChange={e => setMuP(Number(e.target.value))} />
        </div>
        <div style={{ flex: 1 }}>
          <label>Q 中心 = {muQ}</label>
          <input type="range" min={1} max={13} value={muQ}
            onChange={e => setMuQ(Number(e.target.value))} />
        </div>
        <div style={{ flex: 1 }}>
          <label>展宽 sigma = {sigmaP.toFixed(1)}</label>
          <input type="range" min={0.5} max={4} step={0.1} value={sigmaP}
            onChange={e => setSigmaP(Number(e.target.value))} />
        </div>
      </div>
      <div className="metric mt-16" style={{ fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-surface)', padding: 8, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>H(P)</div>
          <strong>{hP.toFixed(4)}</strong>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: 8, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>H(P,Q)</div>
          <strong>{hPQ.toFixed(4)}</strong>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: 8, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>KL(P||Q)</div>
          <strong style={{ color: 'var(--accent)' }}>{kl.toFixed(4)}</strong>
        </div>
      </div>
    </div>
  )
}

// --- 公式区 ---
function FormulaSection() {
  const formulas = [
    { label: '贝叶斯定理', tex: 'P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}' },
    { label: '高斯分布', tex: 'p(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}' },
    { label: '信息熵', tex: 'H(P) = -\\sum_i p_i \\log_2 p_i' },
    { label: 'KL 散度', tex: 'D_{KL}(P \\| Q) = \\sum_i p_i \\log \\frac{p_i}{q_i}' },
    { label: '交叉熵', tex: 'H(P, Q) = -\\sum_i p_i \\log q_i = H(P) + D_{KL}(P \\| Q)' },
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
export default function ProbabilityPage() {
  return (
    <div className="page" style={{ fontSize: 13 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        Probability & Information Theory
      </div>
      <h3 className="mb-16">概率论与信息论</h3>

      <div className="grid-2 mb-16">
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Distribution Visualizer
          </div>
          <DistributionVisualizer />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Bayes' Theorem Calculator
          </div>
          <BayesCalculator />
        </div>
      </div>

      <div className="grid-2 mb-16">
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Entropy & KL Divergence
          </div>
          <EntropyKLSection />
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
