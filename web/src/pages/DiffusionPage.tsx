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

// 噪声调度计算
function linearSchedule(T: number): { beta: number[]; alpha: number[]; alphaBar: number[] } {
  const beta = Array.from({ length: T }, (_, i) => 0.0001 + (0.02 - 0.0001) * i / (T - 1))
  const alpha = beta.map(b => 1 - b)
  const alphaBar: number[] = []
  alpha.reduce((acc, a, i) => { alphaBar[i] = acc * a; return alphaBar[i] }, 1)
  return { beta, alpha, alphaBar }
}

function cosineSchedule(T: number): { beta: number[]; alpha: number[]; alphaBar: number[] } {
  const s = 0.008
  const alphaBar = Array.from({ length: T }, (_, i) => {
    const f = Math.cos(((i / T) + s) / (1 + s) * Math.PI / 2) ** 2
    const f0 = Math.cos((s / (1 + s)) * Math.PI / 2) ** 2
    return f / f0
  })
  const alpha = alphaBar.map((ab, i) => i === 0 ? ab : ab / alphaBar[i - 1])
  const beta = alpha.map(a => Math.min(1 - a, 0.999))
  return { beta, alpha, alphaBar }
}

// 预生成固定数据点
const SEED_DATA: [number, number][] = (() => {
  const pts: [number, number][] = []
  // 用简单的线性同余伪随机
  let seed = 42
  function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  function gaussR() {
    const u = rand() || 0.001, v = rand() || 0.001
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  for (let i = 0; i < 100; i++) {
    const cx = i < 50 ? -2 : 2
    const cy = i < 50 ? -1 : 1
    pts.push([cx + gaussR() * 0.5, cy + gaussR() * 0.5])
  }
  return pts
})()

// 预生成噪声序列
const NOISE_SEQ: [number, number][][] = (() => {
  let seed = 123
  function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  function gaussR() {
    const u = rand() || 0.001, v = rand() || 0.001
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  return Array.from({ length: 101 }, () =>
    Array.from({ length: 100 }, () => [gaussR(), gaussR()] as [number, number])
  )
})()

function ForwardDiffusion() {
  const tc = useThemeColors()
  const [t, setT] = useState(0)
  const totalT = 100

  // 根据时间步混合原始数据和噪声
  const alpha = 1 - t / totalT
  const x = SEED_DATA.map((p, i) => p[0] * alpha + NOISE_SEQ[t][i][0] * (1 - alpha))
  const y = SEED_DATA.map((p, i) => p[1] * alpha + NOISE_SEQ[t][i][1] * (1 - alpha))

  return (
    <div className="card mb-16">
      <label>前向扩散过程 q(x_t | x_0)</label>
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          时间步 t = {t} / {totalT}
          {t === 0 && ' (原始数据)'}
          {t === totalT && ' (纯噪声)'}
        </span>
        <input type="range" min={0} max={totalT} value={t}
          onChange={e => setT(Number(e.target.value))} />
      </div>
      <Plot
        data={[{
          x, y, type: 'scatter', mode: 'markers',
          marker: {
            color: SEED_DATA.map((_, i) => i < 50 ? tc.accent : '#3b82f6'),
            size: 5, opacity: 0.7,
          },
        }]}
        layout={{
          paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
          font: { color: tc.plotlyText, size: 10 },
          xaxis: { range: [-5, 5], gridcolor: tc.plotlyGrid, zeroline: false },
          yaxis: { range: [-5, 5], gridcolor: tc.plotlyGrid, zeroline: false, scaleanchor: 'x' },
          margin: { t: 10, b: 30, l: 40, r: 10 }, height: 300,
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  )
}

function ReverseDiffusion() {
  const tc = useThemeColors()
  const [t, setT] = useState(100)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalT = 100

  function togglePlay() {
    if (playing) {
      if (timerRef.current) clearInterval(timerRef.current)
      setPlaying(false)
      return
    }
    setPlaying(true)
    setT(100)
    let current = 100
    timerRef.current = setInterval(() => {
      current -= 2
      if (current <= 0) {
        current = 0
        if (timerRef.current) clearInterval(timerRef.current)
        setPlaying(false)
      }
      setT(current)
    }, 50)
  }

  const alpha = 1 - t / totalT
  const x = SEED_DATA.map((p, i) => p[0] * alpha + NOISE_SEQ[t][i][0] * (1 - alpha))
  const y = SEED_DATA.map((p, i) => p[1] * alpha + NOISE_SEQ[t][i][1] * (1 - alpha))

  return (
    <div className="card mb-16">
      <div className="flex-between">
        <label>逆扩散过程 p_θ(x_{'{t-1}'} | x_t)</label>
        <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={togglePlay}>
          {playing ? '暂停' : '播放去噪'}
        </button>
      </div>
      <Plot
        data={[{
          x, y, type: 'scatter', mode: 'markers',
          marker: {
            color: SEED_DATA.map((_, i) => i < 50 ? tc.accent : '#3b82f6'),
            size: 5, opacity: 0.7,
          },
        }]}
        layout={{
          title: { text: `t = ${t} → 0`, font: { size: 12, color: tc.plotlyTitle } },
          paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
          font: { color: tc.plotlyText, size: 10 },
          xaxis: { range: [-5, 5], gridcolor: tc.plotlyGrid, zeroline: false },
          yaxis: { range: [-5, 5], gridcolor: tc.plotlyGrid, zeroline: false, scaleanchor: 'x' },
          margin: { t: 30, b: 30, l: 40, r: 10 }, height: 300,
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  )
}

function NoiseScheduleViz() {
  const tc = useThemeColors()
  const [schedule, setSchedule] = useState<'linear' | 'cosine'>('linear')
  const T = 100

  const data = schedule === 'linear' ? linearSchedule(T) : cosineSchedule(T)
  const steps = Array.from({ length: T }, (_, i) => i)

  return (
    <div className="card mb-16">
      <div className="flex-between">
        <label>噪声调度 (Noise Schedule)</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['linear', 'cosine'] as const).map(s => (
            <button key={s} className={`btn ${schedule === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: 11 }}
              onClick={() => setSchedule(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <Plot
        data={[
          { x: steps, y: data.beta, type: 'scatter', mode: 'lines', name: 'β_t', line: { color: '#ef4444', width: 2 } },
          { x: steps, y: data.alpha, type: 'scatter', mode: 'lines', name: 'α_t', line: { color: '#3b82f6', width: 2 } },
          { x: steps, y: data.alphaBar, type: 'scatter', mode: 'lines', name: 'ᾱ_t', line: { color: tc.accent, width: 2 } },
        ]}
        layout={{
          paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
          font: { color: tc.plotlyText, size: 10 },
          xaxis: { title: '时间步 t', gridcolor: tc.plotlyGrid },
          yaxis: { gridcolor: tc.plotlyGrid },
          margin: { t: 10, b: 50, l: 50, r: 20 }, height: 250,
          legend: { x: 0.7, y: 0.95, bgcolor: 'transparent', font: { size: 11 } },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  )
}

function DDPMFormulas() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const derivation = [
    {
      title: '前向过程 (Forward Process)',
      formulas: [
        { label: '单步加噪', tex: 'q(x_t | x_{t-1}) = \\mathcal{N}(x_t; \\sqrt{1-\\beta_t}\\, x_{t-1},\\, \\beta_t I)' },
        { label: '直接从 x_0 到 x_t', tex: 'q(x_t | x_0) = \\mathcal{N}(x_t; \\sqrt{\\bar{\\alpha}_t}\\, x_0,\\, (1-\\bar{\\alpha}_t) I)' },
        { label: '重参数化', tex: 'x_t = \\sqrt{\\bar{\\alpha}_t}\\, x_0 + \\sqrt{1-\\bar{\\alpha}_t}\\, \\epsilon, \\quad \\epsilon \\sim \\mathcal{N}(0, I)' },
      ],
    },
    {
      title: '逆过程 (Reverse Process)',
      formulas: [
        { label: '学习的逆过程', tex: 'p_\\theta(x_{t-1} | x_t) = \\mathcal{N}(x_{t-1}; \\mu_\\theta(x_t, t),\\, \\sigma_t^2 I)' },
        { label: '预测均值', tex: '\\mu_\\theta(x_t, t) = \\frac{1}{\\sqrt{\\alpha_t}} \\left( x_t - \\frac{\\beta_t}{\\sqrt{1-\\bar{\\alpha}_t}} \\epsilon_\\theta(x_t, t) \\right)' },
      ],
    },
    {
      title: '训练目标 (Training Objective)',
      formulas: [
        { label: '简化损失', tex: 'L_{\\text{simple}} = \\mathbb{E}_{t, x_0, \\epsilon} \\left[ \\| \\epsilon - \\epsilon_\\theta(x_t, t) \\|^2 \\right]' },
        { label: '噪声调度', tex: '\\bar{\\alpha}_t = \\prod_{s=1}^{t}(1-\\beta_s), \\quad \\beta_t \\in [\\beta_1, \\beta_T]' },
      ],
    },
  ]

  return (
    <div className="card">
      <label>DDPM 数学推导</label>
      <div style={{ marginTop: 8 }}>
        {derivation.map((section, idx) => (
          <div key={idx} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none', paddingTop: idx > 0 ? 8 : 0 }}>
            <div className="flex-between" style={{ cursor: 'pointer', padding: '6px 0' }}
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}>
              <strong style={{ fontSize: 13 }}>{section.title}</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {openIdx === idx ? '收起' : '展开'}
              </span>
            </div>
            {openIdx === idx && (
              <div style={{ paddingBottom: 8 }}>
                {section.formulas.map((f, i) => (
                  <div key={i} style={{
                    padding: '6px 10px', marginBottom: 4,
                    background: 'var(--bg-surface)', borderRadius: 6,
                    borderLeft: '2px solid var(--accent)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{f.label}</div>
                    <Tex math={f.tex} block />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DiffusionPage() {
  return (
    <div className="page">
      <h3 className="mb-16">扩散模型 (Diffusion Models)</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6, fontSize: 13 }}>
        扩散模型通过逐步加噪（前向过程）和学习去噪（逆过程）来生成数据。
        DDPM 是最经典的扩散模型框架，Stable Diffusion 等均基于此。
      </p>
      <div className="grid-2 mb-16">
        <ForwardDiffusion />
        <ReverseDiffusion />
      </div>
      <NoiseScheduleViz />
      <DDPMFormulas />
    </div>
  )
}
