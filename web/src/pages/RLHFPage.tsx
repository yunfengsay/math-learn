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

// 偏好学习的问答对
const PREFERENCE_PAIRS = [
  {
    question: '什么是机器学习？',
    a: '机器学习是一种人工智能技术，通过从数据中学习模式来做出预测或决策，而无需显式编程。它包括监督学习、无监督学习和强化学习等范式。',
    b: '就是让电脑自己学东西。',
  },
  {
    question: '解释什么是梯度下降？',
    a: '往下走就行了。',
    b: '梯度下降是一种优化算法，通过计算损失函数关于参数的梯度，沿梯度反方向迭代更新参数，逐步最小化损失函数。学习率控制每步的更新幅度。',
  },
  {
    question: 'Python 和 Java 哪个更好？',
    a: 'Python 和 Java 各有优势：Python 在数据科学和快速原型开发方面更简洁，Java 在企业级应用和性能方面更强。选择取决于具体场景。',
    b: 'Python 是最好的语言，其他的都不行。Java 又臭又长。',
  },
  {
    question: '如何写好一个函数？',
    a: '好函数应该：1) 单一职责 2) 名字有意义 3) 参数不超过3个 4) 长度控制在20行以内 5) 有适当的错误处理。',
    b: '随便写就行，能跑就好。代码又不是给人看的。',
  },
]

function PreferenceLearning() {
  const [round, setRound] = useState(0)
  const [choices, setChoices] = useState<('a' | 'b')[]>([])
  const [rewardScores, setRewardScores] = useState<{ a: number; b: number }[]>([])

  const pair = PREFERENCE_PAIRS[round]
  const isComplete = round >= PREFERENCE_PAIRS.length

  function choose(choice: 'a' | 'b') {
    const newChoices = [...choices, choice]
    setChoices(newChoices)

    // 模拟奖励模型学习：选中的回复获得正奖励
    const scores = PREFERENCE_PAIRS.slice(0, round + 1).map((_, i) => {
      const chosen = newChoices[i]
      return { a: chosen === 'a' ? 0.7 + Math.random() * 0.3 : 0.1 + Math.random() * 0.3, b: chosen === 'b' ? 0.7 + Math.random() * 0.3 : 0.1 + Math.random() * 0.3 }
    })
    setRewardScores(scores)
    if (round < PREFERENCE_PAIRS.length - 1) setRound(round + 1)
    else setRound(PREFERENCE_PAIRS.length)
  }

  function reset() {
    setRound(0)
    setChoices([])
    setRewardScores([])
  }

  if (isComplete) {
    return (
      <div className="card mb-16">
        <div className="flex-between">
          <label>偏好学习结果</label>
          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={reset}>
            重新开始
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          {rewardScores.map((s, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8,
              padding: '6px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              fontSize: 12, alignItems: 'center',
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Q{i + 1}: {PREFERENCE_PAIRS[i].question}</span>
              <ScoreBadge label="A" score={s.a} chosen={choices[i] === 'a'} />
              <ScoreBadge label="B" score={s.b} chosen={choices[i] === 'b'} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card mb-16">
      <div className="flex-between">
        <label>偏好学习演示 ({round + 1}/{PREFERENCE_PAIRS.length})</label>
        {choices.length > 0 && (
          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={reset}>
            重置
          </button>
        )}
      </div>
      <div style={{ margin: '12px 0 8px', fontSize: 13, fontWeight: 500 }}>
        {pair.question}
      </div>
      <div className="grid-2" style={{ gap: 8 }}>
        <ResponseOption label="回复 A" text={pair.a} onClick={() => choose('a')} />
        <ResponseOption label="回复 B" text={pair.b} onClick={() => choose('b')} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        点击你认为更好的回复，模拟奖励模型的偏好学习
      </div>
    </div>
  )
}

function ResponseOption({ label, text, onClick }: { label: string; text: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)', borderRadius: 8, padding: 12,
        border: '1px solid var(--border-subtle)', cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
    >
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{text}</div>
    </div>
  )
}

function ScoreBadge({ label, score, chosen }: { label: string; score: number; chosen: boolean }) {
  return (
    <span className="metric" style={{
      fontSize: 11, padding: '2px 8px', borderRadius: 4,
      background: chosen ? 'var(--accent-muted)' : 'transparent',
      color: chosen ? 'var(--accent)' : 'var(--text-muted)',
      border: `1px solid ${chosen ? 'var(--accent)' : 'var(--border)'}`,
    }}>
      {label}: {score.toFixed(2)}
    </span>
  )
}

function PPOvsDPODiagram() {
  const w = 700, h = 280

  return (
    <div className="card mb-16">
      <label>PPO vs DPO 流程对比</label>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', marginTop: 12 }}>
        {/* PPO 流程（上半部分） */}
        <text x={w / 2} y={18} textAnchor="middle" fontSize={11} fill="var(--text-muted)">PPO Pipeline</text>
        <PipelineBox x={30} y={30} text="SFT 模型" color="#3b82f6" />
        <Arrow x1={145} y1={55} x2={175} y2={55} />
        <PipelineBox x={175} y={30} text="人类偏好数据" color="#f59e0b" />
        <Arrow x1={310} y1={55} x2={340} y2={55} />
        <PipelineBox x={340} y={30} text="奖励模型 RM" color="#ef4444" />
        <Arrow x1={465} y1={55} x2={495} y2={55} />
        <PipelineBox x={495} y={30} text="PPO 训练" color="var(--accent)" />

        {/* 分隔线 */}
        <line x1={20} y1={110} x2={w - 20} y2={110} stroke="var(--border)" strokeWidth={1} strokeDasharray="4,4" />

        {/* DPO 流程（下半部分） */}
        <text x={w / 2} y={138} textAnchor="middle" fontSize={11} fill="var(--text-muted)">DPO Pipeline</text>
        <PipelineBox x={100} y={150} text="SFT 模型" color="#3b82f6" />
        <Arrow x1={225} y1={175} x2={275} y2={175} />
        <PipelineBox x={275} y={150} text="人类偏好数据" color="#f59e0b" />
        <Arrow x1={410} y1={175} x2={450} y2={175} />
        <PipelineBox x={450} y={150} text="DPO 训练" color="var(--accent)" />

        {/* 对比说明 */}
        <text x={30} y={230} fontSize={10} fill="var(--text-secondary)">PPO: 需要单独训练奖励模型，再用 RL 优化策略</text>
        <text x={30} y={248} fontSize={10} fill="var(--text-secondary)">DPO: 跳过奖励模型，直接从偏好数据优化策略</text>

        {/* 高亮差异 */}
        <rect x={335} y={25} width={140} height={40} rx={4}
          fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3,3" />
        <text x={405} y={82} textAnchor="middle" fontSize={9} fill="#ef4444">DPO 省去此步骤</text>

        <defs>
          <marker id="rlhf-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="var(--text-muted)" />
          </marker>
        </defs>
      </svg>
    </div>
  )
}

function PipelineBox({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={120} height={36} rx={6}
        fill={color + '18'} stroke={color} strokeWidth={1.2} />
      <text x={x + 60} y={y + 22} textAnchor="middle" fontSize={11}
        fill="var(--text-primary)" fontWeight={500}>
        {text}
      </text>
    </g>
  )
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-muted)" strokeWidth={1.5} markerEnd="url(#rlhf-arrow)" />
}

// 计算两个离散分布的KL散度
function klDivergence(p: number[], q: number[]): number {
  return p.reduce((sum, pi, i) => {
    if (pi > 0 && q[i] > 0) return sum + pi * Math.log(pi / q[i])
    return sum
  }, 0)
}

// 生成正态分布的离散近似
function normalPDF(x: number[], mu: number, sigma: number): number[] {
  const raw = x.map(xi => Math.exp(-0.5 * ((xi - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI)))
  const sum = raw.reduce((a, b) => a + b, 0)
  return raw.map(r => r / sum)
}

function KLDivergenceViz() {
  const tc = useThemeColors()
  const [beta, setBeta] = useState(0.5)
  const [rewardShift, setRewardShift] = useState(1.5)

  const x = Array.from({ length: 50 }, (_, i) => -4 + i * 0.16)
  const piRef = normalPDF(x, 0, 1)

  // 优化策略：在奖励方向偏移，但受KL约束限制
  const shift = rewardShift * (1 / (1 + beta))
  const piTheta = normalPDF(x, shift, Math.max(0.5, 1 - 0.3 * (1 / (1 + beta))))
  const kl = klDivergence(piTheta, piRef)

  return (
    <div className="card mb-16">
      <label>KL 散度约束可视化</label>
      <div className="grid-2 mt-16" style={{ gap: 12 }}>
        <div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            KL约束强度 β = {beta.toFixed(2)}
          </span>
          <input type="range" min={0.01} max={3.0} step={0.01} value={beta}
            onChange={e => setBeta(Number(e.target.value))} />
        </div>
        <div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            奖励偏移 = {rewardShift.toFixed(2)}
          </span>
          <input type="range" min={0} max={3.0} step={0.01} value={rewardShift}
            onChange={e => setRewardShift(Number(e.target.value))} />
        </div>
      </div>
      <Plot
        data={[
          {
            x, y: piRef, type: 'scatter', mode: 'lines', name: 'π_ref (原始策略)',
            line: { color: '#3b82f6', width: 2 }, fill: 'tozeroy',
            fillcolor: '#3b82f620',
          },
          {
            x, y: piTheta, type: 'scatter', mode: 'lines', name: 'π_θ (优化策略)',
            line: { color: tc.accent, width: 2 }, fill: 'tozeroy',
            fillcolor: tc.accent + '20',
          },
        ]}
        layout={{
          paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
          font: { color: tc.plotlyText, size: 10 },
          xaxis: { gridcolor: tc.plotlyGrid, title: 'Action Space' },
          yaxis: { gridcolor: tc.plotlyGrid, title: 'Probability' },
          margin: { t: 10, b: 50, l: 50, r: 20 }, height: 250,
          legend: { x: 0.6, y: 0.95, bgcolor: 'transparent', font: { size: 11 } },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
      <div className="flex-between" style={{ fontSize: 12, marginTop: 4 }}>
        <span style={{ color: 'var(--text-muted)' }}>
          KL(π_θ || π_ref) = <strong className="metric" style={{ color: 'var(--accent)' }}>{kl.toFixed(4)}</strong>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          β越大 → 策略越接近原始 | β越小 → 策略偏移越大
        </span>
      </div>
    </div>
  )
}

// 简单规则的奖励模型
function computeReward(text: string): { score: number; details: { name: string; score: number }[] } {
  const details: { name: string; score: number }[] = []

  const lenScore = Math.min(text.length / 100, 1) * 0.3
  details.push({ name: '长度适中', score: lenScore })

  const keywords = ['因为', '所以', '首先', '其次', '总结', '例如', '通过']
  const kwCount = keywords.filter(kw => text.includes(kw)).length
  const kwScore = Math.min(kwCount / 3, 1) * 0.3
  details.push({ name: '逻辑词汇', score: kwScore })

  const hasPunctuation = /[，。！？；：]/.test(text)
  const punctScore = hasPunctuation ? 0.2 : 0
  details.push({ name: '标点规范', score: punctScore })

  const polite = ['请', '谢谢', '您', '希望'].some(w => text.includes(w))
  const politeScore = polite ? 0.2 : 0
  details.push({ name: '礼貌用语', score: politeScore })

  const score = details.reduce((s, d) => s + d.score, 0)
  return { score: Math.min(score, 1), details }
}

function RewardModelDemo() {
  const [text, setText] = useState('首先，这个问题需要从多个角度分析。因为机器学习的核心是数据驱动的，所以我们需要关注数据质量。')
  const { score, details } = computeReward(text)

  return (
    <div className="card mb-16">
      <label>奖励模型打分</label>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        placeholder="输入一段回复文本..."
        style={{
          width: '100%', marginTop: 8,
          background: 'var(--bg-surface)', color: 'var(--text-primary)',
          border: '1px solid var(--border)', borderRadius: 6, padding: 8,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, resize: 'vertical',
        }}
      />
      <div className="flex-between mt-16">
        <span style={{ fontSize: 13 }}>
          综合得分: <strong className="metric" style={{
            color: score > 0.6 ? 'var(--success)' : score > 0.3 ? '#f59e0b' : 'var(--error)',
            fontSize: 18,
          }}>
            {(score * 100).toFixed(0)}
          </strong>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> / 100</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {details.map((d, i) => (
          <span key={i} style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 4,
            background: d.score > 0 ? 'var(--accent-muted)' : 'var(--bg-surface)',
            color: d.score > 0 ? 'var(--accent)' : 'var(--text-muted)',
            border: `1px solid ${d.score > 0 ? 'var(--accent)' : 'var(--border)'}`,
          }}>
            {d.name}: +{(d.score * 100).toFixed(0)}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        简化规则：长度适中、逻辑连词、标点规范、礼貌用语各占一定权重
      </div>
    </div>
  )
}

function RLHFFormulas() {
  const [open, setOpen] = useState(false)

  const formulas = [
    { label: 'RLHF 目标函数', tex: '\\max_{\\pi_\\theta} \\, \\mathbb{E}_{x \\sim \\mathcal{D},\\, y \\sim \\pi_\\theta(\\cdot|x)} \\left[ r(x, y) - \\beta \\, \\text{KL}(\\pi_\\theta \\| \\pi_{\\text{ref}}) \\right]' },
    { label: 'Bradley-Terry 偏好模型', tex: 'P(y_w \\succ y_l | x) = \\sigma(r(x, y_w) - r(x, y_l))' },
    { label: 'DPO Loss', tex: '\\mathcal{L}_{\\text{DPO}} = -\\mathbb{E} \\left[ \\log \\sigma \\left( \\beta \\log \\frac{\\pi_\\theta(y_w|x)}{\\pi_{\\text{ref}}(y_w|x)} - \\beta \\log \\frac{\\pi_\\theta(y_l|x)}{\\pi_{\\text{ref}}(y_l|x)} \\right) \\right]' },
    { label: 'KL 散度约束', tex: '\\text{KL}(\\pi_\\theta \\| \\pi_{\\text{ref}}) = \\mathbb{E}_{y \\sim \\pi_\\theta} \\left[ \\log \\frac{\\pi_\\theta(y|x)}{\\pi_{\\text{ref}}(y|x)} \\right]' },
    { label: '奖励模型训练', tex: '\\mathcal{L}_{\\text{RM}} = -\\mathbb{E}_{(x, y_w, y_l)} \\left[ \\log \\sigma(r_\\phi(x, y_w) - r_\\phi(x, y_l)) \\right]' },
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

export default function RLHFPage() {
  return (
    <div className="page">
      <h3 className="mb-16">RLHF 与对齐 (Alignment)</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6, fontSize: 13 }}>
        RLHF（基于人类反馈的强化学习）是将大模型与人类价值观对齐的核心技术。
        通过偏好学习训练奖励模型，再用 PPO 或 DPO 优化策略。
      </p>
      <PreferenceLearning />
      <PPOvsDPODiagram />
      <KLDivergenceViz />
      <RewardModelDemo />
      <RLHFFormulas />
    </div>
  )
}
