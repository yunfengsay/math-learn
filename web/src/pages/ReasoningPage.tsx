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

// CoT 步骤数据
const cotSteps = [
  { title: '理解题意', content: '鸡兔同笼，共有头35个，脚94只。求鸡和兔各几只？' },
  { title: '设未知数', content: '设鸡有 x 只，兔有 y 只。' },
  { title: '列方程', content: 'x + y = 35（头的数量）\n2x + 4y = 94（脚的数量）' },
  { title: '解方程', content: '由第一个方程得 x = 35 - y\n代入第二个：2(35-y) + 4y = 94\n70 - 2y + 4y = 94\n2y = 24 → y = 12' },
  { title: '得出答案', content: 'y = 12（兔12只），x = 35-12 = 23（鸡23只）' },
  { title: '验证', content: '头: 23+12=35 ✓  脚: 23×2+12×4=46+48=94 ✓' },
]

function CoTDemo() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [showDirect, setShowDirect] = useState(true)

  function toggleStep(index: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  return (
    <div>
      <div className="flex-center mb-12">
        <button className={`btn ${showDirect ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowDirect(true)}>直接回答</button>
        <button className={`btn ${!showDirect ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowDirect(false)}>Chain-of-Thought</button>
      </div>

      {showDirect ? (
        <DirectAnswer />
      ) : (
        <CoTStepList expanded={expanded} onToggle={toggleStep} />
      )}
    </div>
  )
}

function DirectAnswer() {
  return (
    <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--error)', marginBottom: 4 }}>直接回答（容易出错）</div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
        鸡兔同笼，35个头94只脚。<br />
        嗯...鸡大概有20只，兔15只？<br />
        <span style={{ color: 'var(--error)' }}>验证: 20×2+15×4=100 ≠ 94 ✗</span>
      </div>
    </div>
  )
}

function CoTStepList({ expanded, onToggle }: {
  expanded: Set<number>; onToggle: (i: number) => void
}) {
  return (
    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
      {cotSteps.map((step, i) => (
        <div key={i} style={{
          marginBottom: 6, borderRadius: 6,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
        }}>
          <div onClick={() => onToggle(i)}
            style={{
              padding: '8px 12px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
              Step {i + 1}: {step.title}
            </span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {expanded.has(i) ? '▾' : '▸'}
            </span>
          </div>
          {expanded.has(i) && (
            <div style={{ padding: '0 12px 10px', fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {step.content}
            </div>
          )}
        </div>
      ))}
      <button className="btn btn-secondary" style={{ marginTop: 6 }}
        onClick={() => cotSteps.forEach((_, i) => {
          if (!expanded.has(i)) onToggle(i)
        })}>
        展开全部
      </button>
    </div>
  )
}

// Self-Consistency: 多条推理路径
const scPaths = [
  { path: '假设鸡20只→脚100≠94→调整→鸡23兔12', answer: '鸡23兔12' },
  { path: '假设全是鸡→70脚→差24→每换一只兔多2脚→换12只→鸡23兔12', answer: '鸡23兔12' },
  { path: '设兔y→2(35-y)+4y=94→y=12→鸡23兔12', answer: '鸡23兔12' },
  { path: '试错法: 鸡25兔10→脚90<94→鸡23兔12→脚94 ✓', answer: '鸡23兔12' },
  { path: '错误路径: 混淆头脚→鸡30兔5→脚80≠94', answer: '鸡30兔5' },
]

function SelfConsistency({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
  const [showVote, setShowVote] = useState(false)

  const answerCount: Record<string, number> = {}
  scPaths.forEach(p => {
    answerCount[p.answer] = (answerCount[p.answer] || 0) + 1
  })

  return (
    <div>
      <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
        {scPaths.map((p, i) => (
          <div key={i} style={{
            padding: '6px 10px', marginBottom: 4, borderRadius: 6,
            background: 'var(--bg-surface)', fontSize: 11, lineHeight: 1.5,
            borderLeft: `3px solid ${p.answer === '鸡23兔12' ? 'var(--success)' : 'var(--error)'}`,
          }}>
            <span style={{ color: 'var(--text-muted)' }}>路径{i + 1}:</span> {p.path}
            <span style={{ float: 'right', fontWeight: 600, color: p.answer === '鸡23兔12' ? 'var(--success)' : 'var(--error)' }}>
              → {p.answer}
            </span>
          </div>
        ))}
      </div>
      <button className={`btn ${showVote ? 'btn-secondary' : 'btn-primary'}`}
        onClick={() => setShowVote(!showVote)}>
        {showVote ? '隐藏投票' : '多数投票'}
      </button>
      {showVote && (
        <div style={{ marginTop: 12, height: 200 }}>
          <Plot
            data={[{
              labels: Object.keys(answerCount),
              values: Object.values(answerCount),
              type: 'pie',
              marker: { colors: [tc.accent, tc.errorColor] },
              textinfo: 'label+value',
            }]}
            layout={{
              paper_bgcolor: 'transparent',
              font: { color: tc.plotlyText, size: 11 },
              margin: { t: 10, b: 10, l: 10, r: 10 },
              height: 190,
              showlegend: false,
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  )
}

function TestTimeScaling({ tc }: { tc: ReturnType<typeof useThemeColors> }) {
  // 模拟：采样次数增加，准确率提升（对数曲线）
  const samples = Array.from({ length: 20 }, (_, i) => i + 1)
  const accuracy = samples.map(n => 0.55 + 0.35 * (1 - Math.exp(-n / 5)))

  return (
    <Plot
      data={[{
        x: samples, y: accuracy.map(a => +(a * 100).toFixed(1)),
        type: 'scatter', mode: 'lines+markers',
        line: { color: tc.accent, width: 2 },
        marker: { size: 5 },
      }]}
      layout={{
        title: { text: 'Test-Time Compute Scaling', font: { size: 13, color: tc.plotlyTitle } },
        paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
        font: { color: tc.plotlyText, size: 11 },
        xaxis: { title: '采样次数 N', gridcolor: tc.plotlyGrid, color: tc.plotlyText },
        yaxis: { title: '准确率 (%)', gridcolor: tc.plotlyGrid, color: tc.plotlyText, range: [50, 100] },
        margin: { t: 36, b: 40, l: 50, r: 20 },
        height: 280,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%' }}
    />
  )
}

function PRMvsORMSVG() {
  const steps = ['Step 1', 'Step 2', 'Step 3', '答案']

  return (
    <svg viewBox="0 0 480 200" style={{ width: '100%' }}>
      {/* PRM 左侧 */}
      <text x={10} y={18} fontSize={11} fontWeight={600} fill="var(--accent)">过程奖励模型 (PRM)</text>
      <text x={10} y={32} fontSize={9} fill="var(--text-muted)">对每一步推理打分</text>
      {steps.map((s, i) => {
        const x = 10 + i * 55
        const score = [0.9, 0.85, 0.7, 0.95][i]
        return (
          <g key={`prm-${i}`}>
            <rect x={x} y={42} width={48} height={28} rx={4}
              fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth={1} />
            <text x={x + 24} y={58} textAnchor="middle" fontSize={9} fill="var(--text-primary)">{s}</text>
            <text x={x + 24} y={84} textAnchor="middle" fontSize={10} fill="var(--accent)" fontWeight={600}>
              {score}
            </text>
            {i < steps.length - 1 && (
              <line x1={x + 48} y1={56} x2={x + 55} y2={56} stroke="var(--border)" strokeWidth={1} />
            )}
          </g>
        )
      })}

      {/* ORM 右侧 */}
      <text x={260} y={18} fontSize={11} fontWeight={600} fill="#6366f1">结果奖励模型 (ORM)</text>
      <text x={260} y={32} fontSize={9} fill="var(--text-muted)">只对最终答案打分</text>
      {steps.map((s, i) => {
        const x = 260 + i * 55
        const isLast = i === steps.length - 1
        return (
          <g key={`orm-${i}`}>
            <rect x={x} y={42} width={48} height={28} rx={4}
              fill="var(--bg-surface)" stroke={isLast ? '#6366f1' : 'var(--border)'} strokeWidth={isLast ? 1.5 : 1} />
            <text x={x + 24} y={58} textAnchor="middle" fontSize={9}
              fill={isLast ? '#6366f1' : 'var(--text-muted)'}>{s}</text>
            {isLast && (
              <text x={x + 24} y={84} textAnchor="middle" fontSize={10} fill="#6366f1" fontWeight={600}>
                0.92
              </text>
            )}
            {i < steps.length - 1 && (
              <line x1={x + 48} y1={56} x2={x + 55} y2={56} stroke="var(--border)" strokeWidth={1} />
            )}
          </g>
        )
      })}

      {/* 对比说明 */}
      <text x={10} y={120} fontSize={10} fill="var(--text-secondary)">PRM 优势：可以定位错误步骤，提供细粒度反馈</text>
      <text x={10} y={136} fontSize={10} fill="var(--text-secondary)">ORM 优势：标注成本低，只需判断最终答案正确性</text>

      {/* PRM 能发现中间错误 */}
      <rect x={120} y={147} width={340} height={42} rx={6} fill="var(--bg-surface)" stroke="var(--border-subtle)" strokeWidth={1} />
      <text x={130} y={164} fontSize={9} fill="var(--text-muted)">
        示例: Step3得分0.7较低 → PRM可识别此步推理有误 → 引导模型修正
      </text>
      <text x={130} y={180} fontSize={9} fill="var(--text-muted)">
        ORM只看答案对错，无法定位具体哪步出了问题
      </text>
    </svg>
  )
}

function ReasoningFormulas() {
  const formulas = [
    { label: 'CoT 概率分解', tex: 'P(a|q) = \\sum_{c} P(a|c, q) \\cdot P(c|q)' },
    { label: 'Self-Consistency', tex: 'a^* = \\arg\\max_a \\sum_{i=1}^{N} \\mathbb{1}[a_i = a]' },
    { label: 'Majority Voting', tex: 'P(a^*) = \\frac{\\text{count}(a^*)}{N}' },
  ]

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {formulas.map((f, i) => (
        <div key={i} style={{ background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
          <Tex math={f.tex} block />
        </div>
      ))}
    </div>
  )
}

export default function ReasoningPage() {
  const tc = useThemeColors()

  return (
    <div className="page" style={{ fontSize: 13 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        Reasoning & Chain-of-Thought
      </div>
      <h3 className="mb-16">推理与思维链</h3>

      <div className="grid-2 mb-16">
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>Chain-of-Thought 演示</label>
          <CoTDemo />
        </div>
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>Self-Consistency 多路径投票</label>
          <SelfConsistency tc={tc} />
        </div>
      </div>

      <div className="grid-2 mb-16">
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>Test-Time Compute Scaling</label>
          <TestTimeScaling tc={tc} />
        </div>
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>过程奖励 vs 结果奖励</label>
          <PRMvsORMSVG />
        </div>
      </div>

      <div className="card">
        <label className="mb-12" style={{ display: 'block' }}>核心公式</label>
        <ReasoningFormulas />
      </div>
    </div>
  )
}
