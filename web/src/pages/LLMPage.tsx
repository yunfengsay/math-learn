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

// 模拟BPE分词的简单实现
const BPE_VOCAB: Record<string, number> = {
  'the': 100, 'is': 101, 'a': 102, 'of': 103, 'and': 104, 'to': 105,
  'in': 106, 'that': 107, 'it': 108, 'for': 109, 'was': 110, 'on': 111,
  'are': 112, 'with': 113, 'as': 114, 'at': 115, 'be': 116, 'this': 117,
  'have': 118, 'from': 119, 'not': 120, 'by': 121, 'but': 122, 'what': 123,
  'all': 124, 'were': 125, 'we': 126, 'can': 127, 'had': 128, 'one': 129,
  'an': 130, 'model': 131, 'language': 132, 'large': 133, 'learn': 134,
  'ing': 135, 'tion': 136, 'er': 137, 'ed': 138, 'al': 139,
  ' ': 140, '.': 141, ',': 142, '!': 143, '?': 144,
}

const TOKEN_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

function tokenize(text: string): { token: string; id: number }[] {
  const tokens: { token: string; id: number }[] = []
  let i = 0
  while (i < text.length) {
    let matched = false
    // 从最长的词开始匹配
    for (let len = Math.min(8, text.length - i); len >= 2; len--) {
      const substr = text.slice(i, i + len).toLowerCase()
      if (BPE_VOCAB[substr] !== undefined) {
        tokens.push({ token: text.slice(i, i + len), id: BPE_VOCAB[substr] })
        i += len
        matched = true
        break
      }
    }
    if (!matched) {
      const ch = text[i]
      tokens.push({ token: ch, id: ch.charCodeAt(0) })
      i++
    }
  }
  return tokens
}

// softmax计算
function softmax(logits: number[], temperature: number): number[] {
  const t = Math.max(temperature, 0.01)
  const scaled = logits.map(l => l / t)
  const max = Math.max(...scaled)
  const exps = scaled.map(s => Math.exp(s - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(e => e / sum)
}

// Scaling law计算: L(C) = aC^(-alpha) + L_inf
function scalingLoss(x: number, a: number, alpha: number, lInf: number): number {
  return a * Math.pow(x, -alpha) + lInf
}

function TokenizationDemo() {
  const [text, setText] = useState('The large language model is learning.')
  const tokens = tokenize(text)

  return (
    <div className="card mb-16">
      <label>Tokenization 演示</label>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        style={{
          width: '100%', marginTop: 8,
          background: 'var(--bg-surface)', color: 'var(--text-primary)',
          border: '1px solid var(--border)', borderRadius: 6, padding: 8,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 13, resize: 'vertical',
        }}
      />
      <div style={{ marginTop: 12, lineHeight: 2.2, minHeight: 40 }}>
        {tokens.map((t, i) => (
          <span key={i} style={{
            background: TOKEN_COLORS[i % TOKEN_COLORS.length] + '30',
            border: `1px solid ${TOKEN_COLORS[i % TOKEN_COLORS.length]}60`,
            borderRadius: 4, padding: '2px 6px', margin: '2px 1px',
            fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
            display: 'inline-block',
          }}>
            {t.token === ' ' ? '␣' : t.token}
          </span>
        ))}
      </div>
      <div className="flex-between mt-16" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <span>Token 数量: <strong style={{ color: 'var(--accent)' }}>{tokens.length}</strong></span>
        <span>字符数: {text.length}</span>
        <span>压缩比: {text.length > 0 ? (text.length / tokens.length).toFixed(2) : '0'}x</span>
      </div>
    </div>
  )
}

function ScalingLawsViz() {
  const tc = useThemeColors()
  const [alpha, setAlpha] = useState(0.5)

  const computePoints = Array.from({ length: 50 }, (_, i) => Math.pow(10, 18 + i * 0.1))
  const lossPoints = computePoints.map(c => scalingLoss(c, 5e9, alpha, 1.5))

  const paramPoints = Array.from({ length: 50 }, (_, i) => Math.pow(10, 7 + i * 0.08))
  const lossParams = paramPoints.map(p => scalingLoss(p, 1e4, alpha * 0.8, 1.5))

  return (
    <div className="card mb-16">
      <label>Scaling Laws (Chinchilla)</label>
      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          幂律指数 α = {alpha.toFixed(2)}
        </span>
        <input type="range" min={0.1} max={1.0} step={0.01} value={alpha}
          onChange={e => setAlpha(Number(e.target.value))} />
      </div>
      <div className="grid-2">
        <Plot
          data={[{
            x: computePoints, y: lossPoints, type: 'scatter', mode: 'lines',
            line: { color: tc.accent, width: 2 }, name: 'Loss vs Compute',
          }]}
          layout={{
            title: { text: 'Loss vs Compute (FLOPs)', font: { size: 13, color: tc.plotlyTitle } },
            xaxis: { type: 'log', title: 'Compute', gridcolor: tc.plotlyGrid, color: tc.plotlyText },
            yaxis: { type: 'log', title: 'Loss', gridcolor: tc.plotlyGrid, color: tc.plotlyText },
            paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
            font: { color: tc.plotlyText, size: 10 },
            margin: { t: 40, b: 50, l: 50, r: 20 }, height: 250,
            showlegend: false,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
        <Plot
          data={[{
            x: paramPoints, y: lossParams, type: 'scatter', mode: 'lines',
            line: { color: '#3b82f6', width: 2 }, name: 'Loss vs Params',
          }]}
          layout={{
            title: { text: 'Loss vs Parameters', font: { size: 13, color: tc.plotlyTitle } },
            xaxis: { type: 'log', title: 'Parameters', gridcolor: tc.plotlyGrid, color: tc.plotlyText },
            yaxis: { type: 'log', title: 'Loss', gridcolor: tc.plotlyGrid, color: tc.plotlyText },
            paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
            font: { color: tc.plotlyText, size: 10 },
            margin: { t: 40, b: 50, l: 50, r: 20 }, height: 250,
            showlegend: false,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
        <Tex math="L(C) = a \cdot C^{-\alpha} + L_{\infty}" /> — 损失随计算量/参数量呈幂律衰减
      </div>
    </div>
  )
}

function TemperatureSampling() {
  const tc = useThemeColors()
  const [temperature, setTemperature] = useState(1.0)
  const [logitsStr, setLogitsStr] = useState('5.0, 3.0, 1.0, 0.5, -1.0')

  const logits = logitsStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
  const labels = logits.map((_, i) => `token_${i}`)
  const probs = softmax(logits, temperature)

  return (
    <div className="card mb-16">
      <label>Temperature 采样</label>
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Logits (逗号分隔):
        </span>
        <input
          type="text" value={logitsStr}
          onChange={e => setLogitsStr(e.target.value)}
          style={{
            width: '100%', marginTop: 4,
            background: 'var(--bg-surface)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
          }}
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Temperature = {temperature.toFixed(2)}
          {temperature < 0.1 && ' (greedy)'}
          {temperature > 3 && ' (近似均匀)'}
        </span>
        <input type="range" min={0.01} max={5.0} step={0.01} value={temperature}
          onChange={e => setTemperature(Number(e.target.value))} />
      </div>
      {logits.length > 0 && (
        <Plot
          data={[{
            x: labels, y: probs, type: 'bar',
            marker: {
              color: probs.map((_v, i) =>
                i === probs.indexOf(Math.max(...probs)) ? tc.accent : tc.accent + '60'
              ),
            },
            text: probs.map(p => (p * 100).toFixed(1) + '%'),
            textposition: 'outside' as const,
            textfont: { size: 10, color: tc.plotlyText },
          }]}
          layout={{
            paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
            font: { color: tc.plotlyText, size: 10 },
            xaxis: { gridcolor: tc.plotlyGrid },
            yaxis: { title: 'P(token)', gridcolor: tc.plotlyGrid, range: [0, 1] },
            margin: { t: 20, b: 40, l: 50, r: 20 }, height: 220,
            bargap: 0.3,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      )}
    </div>
  )
}

function AutoregressiveDemo() {
  const [tokens] = useState(['The', ' cat', ' sat', ' on', ' the', ' mat', '.'])
  const [step, setStep] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [playing, setPlaying] = useState(false)

  function play() {
    if (playing) {
      if (timerRef.current) clearInterval(timerRef.current)
      setPlaying(false)
      return
    }
    setPlaying(true)
    setStep(0)
    let s = 0
    timerRef.current = setInterval(() => {
      s++
      if (s >= tokens.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        setPlaying(false)
        return
      }
      setStep(s)
    }, 600)
  }

  const visible = tokens.slice(0, step + 1)
  const w = 600, h = 80

  return (
    <div className="card mb-16">
      <div className="flex-between">
        <label>自回归生成 (Next-Token Prediction)</label>
        <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={play}>
          {playing ? '暂停' : '播放'}
        </button>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 600, marginTop: 12 }}>
        {visible.map((tok, i) => {
          const x = 10 + i * 82
          const isNew = i === step
          return (
            <g key={i}>
              <rect x={x} y={20} width={75} height={32} rx={6}
                fill={isNew ? 'var(--accent)' : 'var(--bg-surface)'}
                stroke={isNew ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={1.5}
                opacity={isNew ? 1 : 0.8}
              />
              <text x={x + 37.5} y={40} textAnchor="middle" fontSize={11}
                fill={isNew ? '#09090b' : 'var(--text-primary)'}
                fontFamily="'JetBrains Mono', monospace">
                {tok.trim() || '␣'}
              </text>
              {i < visible.length - 1 && (
                <line x1={x + 75} y1={36} x2={x + 82} y2={36}
                  stroke="var(--text-muted)" strokeWidth={1}
                  markerEnd="url(#arrowhead)" />
              )}
            </g>
          )
        })}
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="var(--text-muted)" />
          </marker>
        </defs>
      </svg>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
        步骤 {step + 1}/{tokens.length} — 每一步基于前面所有 token 预测下一个
      </div>
    </div>
  )
}

function LLMFormulas() {
  const [open, setOpen] = useState(false)

  const formulas = [
    { label: '语言模型概率', tex: 'P(w_1, w_2, \\ldots, w_n) = \\prod_{i=1}^{n} P(w_i | w_1, \\ldots, w_{i-1})' },
    { label: 'Softmax with Temperature', tex: 'P(w_i) = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}' },
    { label: 'Scaling Law', tex: 'L(N) = \\left(\\frac{N_c}{N}\\right)^{\\alpha_N}, \\quad L(D) = \\left(\\frac{D_c}{D}\\right)^{\\alpha_D}' },
    { label: 'Cross-Entropy Loss', tex: '\\mathcal{L} = -\\frac{1}{N} \\sum_{i=1}^{N} \\log P_{\\theta}(w_i | w_{<i})' },
    { label: '注意力机制', tex: '\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V' },
  ]

  return (
    <div className="card">
      <div className="flex-between" style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <label>核心公式</label>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{open ? '收起' : '展开'}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          {formulas.map((f, i) => (
            <div key={i} style={{
              padding: '8px 12px', marginBottom: 6,
              background: 'var(--bg-surface)', borderRadius: 6,
              borderLeft: '2px solid var(--accent)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
              <Tex math={f.tex} block />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LLMPage() {
  return (
    <div className="page">
      <h3 className="mb-16">大语言模型 (LLM)</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6, fontSize: 13 }}>
        大语言模型通过自回归方式逐 token 生成文本。理解 tokenization、temperature 采样和 scaling laws
        是掌握 LLM 的基础。
      </p>
      <TokenizationDemo />
      <ScalingLawsViz />
      <TemperatureSampling />
      <AutoregressiveDemo />
      <LLMFormulas />
    </div>
  )
}
