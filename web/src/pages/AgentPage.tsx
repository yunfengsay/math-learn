import { useState } from 'react'
import { useThemeColors } from '../useThemeColors'

// ReAct 循环步骤数据
const reactSteps = [
  { type: 'question', content: '北京到上海的高铁最快需要多长时间？票价多少？' },
  { type: 'thought', content: '用户问的是北京到上海高铁的时间和票价，我需要查询最新的列车信息。' },
  { type: 'action', content: '调用 search_tool("北京到上海高铁时刻表 最快")' },
  { type: 'observation', content: '京沪高铁G1次，北京南→上海虹桥，全程4小时18分，二等座553元，一等座933元。' },
  { type: 'thought', content: '已获取到时间和票价信息，可以直接回答用户。' },
  { type: 'answer', content: '北京到上海最快的高铁G1次全程4小时18分，二等座553元、一等座933元。' },
]

const stepColors: Record<string, string> = {
  question: '#6366f1',
  thought: '#f59e0b',
  action: 'var(--accent)',
  observation: '#8b5cf6',
  answer: 'var(--success)',
}

const stepLabels: Record<string, string> = {
  question: '❓ 问题',
  thought: '💭 思考',
  action: '⚡ 行动',
  observation: '👁 观察',
  answer: '✅ 回答',
}

function ReActDemo() {
  const [step, setStep] = useState(0)
  const visibleSteps = reactSteps.slice(0, step + 1)

  return (
    <div>
      <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
        {visibleSteps.map((s, i) => (
          <div key={i} style={{
            padding: '8px 12px', marginBottom: 6, borderRadius: 6,
            borderLeft: `3px solid ${stepColors[s.type]}`,
            background: 'var(--bg-surface)',
          }}>
            <div style={{ fontSize: 10, color: stepColors[s.type], fontWeight: 600, marginBottom: 2 }}>
              {stepLabels[s.type]}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{s.content}</div>
          </div>
        ))}
      </div>
      <div className="flex-center">
        <button className="btn btn-primary"
          onClick={() => setStep(s => Math.min(s + 1, reactSteps.length - 1))}
          disabled={step >= reactSteps.length - 1}>
          下一步 ({step + 1}/{reactSteps.length})
        </button>
        <button className="btn btn-secondary" onClick={() => setStep(0)}>重置</button>
      </div>
    </div>
  )
}

function ToolCallFlowSVG() {
  const steps = ['用户查询', 'LLM解析意图', '选择工具', '执行工具', '获取结果', '生成回复']
  const colors = ['#6366f1', '#f59e0b', 'var(--accent)', '#8b5cf6', '#f59e0b', 'var(--success)']
  const boxW = 64, boxH = 30

  return (
    <svg viewBox="0 0 480 100" style={{ width: '100%' }}>
      {steps.map((s, i) => {
        const x = 8 + i * 78
        return (
          <g key={i}>
            <rect x={x} y={30} width={boxW} height={boxH} rx={6}
              fill="var(--bg-surface)" stroke={colors[i]} strokeWidth={1.5} />
            <text x={x + boxW / 2} y={49} textAnchor="middle" fontSize={9} fill="var(--text-primary)">{s}</text>
            {i < steps.length - 1 && (
              <line x1={x + boxW} y1={45} x2={x + 78} y2={45}
                stroke="var(--text-muted)" strokeWidth={1} markerEnd="url(#agentArrow)" />
            )}
          </g>
        )
      })}
      {/* 反馈循环 */}
      <path d="M 398 60 Q 398 85 240 85 Q 82 85 82 60" fill="none"
        stroke="var(--accent)" strokeWidth={1} strokeDasharray="4,3"
        markerEnd="url(#agentArrow)" />
      <text x={240} y={80} textAnchor="middle" fontSize={8} fill="var(--text-muted)">需要更多信息时循环</text>
      <defs>
        <marker id="agentArrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--text-muted)" />
        </marker>
      </defs>
    </svg>
  )
}

// Tree of Thought 数据
interface ToTNode {
  id: string; label: string; detail: string
  x: number; y: number; children: string[]
  pruned?: boolean
}

const totNodes: ToTNode[] = [
  { id: 'root', label: '问题', detail: '24点游戏：用 1, 5, 5, 5 得到 24', x: 220, y: 20, children: ['a', 'b'] },
  { id: 'a', label: '5×5=25', detail: '尝试先乘: 5×5=25, 剩余 1, 5, 25', x: 120, y: 80, children: ['a1', 'a2'] },
  { id: 'b', label: '5+5=10', detail: '尝试先加: 5+5=10, 剩余 1, 5, 10', x: 320, y: 80, children: ['b1'] },
  { id: 'a1', label: '25-1=24 ✓', detail: '25-1=24, 但还剩余5未使用，无效', x: 60, y: 140, children: [], pruned: true },
  { id: 'a2', label: '(25-1)÷5', detail: '(25-1)÷5 = 4.8, 不等于24', x: 180, y: 140, children: [], pruned: true },
  { id: 'b1', label: '(5-1)×5', detail: '换个思路: (5-1/5)×5 = 24 ✓', x: 320, y: 140, children: ['b1a'] },
  { id: 'b1a', label: '= 24 ✓', detail: '5 × (5 - 1/5) = 5 × 24/5 = 24', x: 320, y: 200, children: [] },
]

function TreeOfThought() {
  const [selected, setSelected] = useState<string | null>(null)
  const nodeMap = Object.fromEntries(totNodes.map(n => [n.id, n]))
  const sel = selected ? nodeMap[selected] : null

  return (
    <div>
      <svg viewBox="0 0 440 230" style={{ width: '100%' }}>
        {totNodes.map(n => n.children.map(cid => {
          const child = nodeMap[cid]
          if (!child) return null
          return (
            <line key={`${n.id}-${cid}`} x1={n.x} y1={n.y + 16} x2={child.x} y2={child.y}
              stroke={child.pruned ? 'var(--error)' : 'var(--accent)'}
              strokeWidth={1.5} opacity={child.pruned ? 0.4 : 0.8}
              strokeDasharray={child.pruned ? '4,3' : 'none'} />
          )
        }))}
        {totNodes.map(n => (
          <g key={n.id} onClick={() => setSelected(n.id)} style={{ cursor: 'pointer' }}>
            <rect x={n.x - 44} y={n.y} width={88} height={24} rx={6}
              fill={selected === n.id ? 'var(--accent)' : n.pruned ? 'var(--bg-surface)' : 'var(--bg-card)'}
              stroke={n.pruned ? 'var(--error)' : selected === n.id ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={1.5} opacity={n.pruned ? 0.5 : 1} />
            <text x={n.x} y={n.y + 15} textAnchor="middle" fontSize={9}
              fill={selected === n.id ? '#09090b' : n.pruned ? 'var(--text-muted)' : 'var(--text-primary)'}>
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      {sel && (
        <div className="metric" style={{ fontSize: 12, background: 'var(--bg-surface)', padding: 10, borderRadius: 6 }}>
          {sel.detail}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>点击节点查看推理细节</div>
    </div>
  )
}

function MultiAgentSVG() {
  const agents = [
    { name: 'Planner', desc: '任务规划', x: 200, y: 20, color: '#6366f1' },
    { name: 'Coder', desc: '代码实现', x: 80, y: 120, color: 'var(--accent)' },
    { name: 'Reviewer', desc: '代码审查', x: 320, y: 120, color: '#f59e0b' },
  ]

  return (
    <svg viewBox="0 0 440 220" style={{ width: '100%' }}>
      {/* 连线：Planner → Coder, Planner → Reviewer, Coder ↔ Reviewer */}
      <line x1={200} y1={46} x2={80} y2={120} stroke="#6366f1" strokeWidth={1.5} />
      <line x1={200} y1={46} x2={320} y2={120} stroke="#6366f1" strokeWidth={1.5} />
      <line x1={130} y1={135} x2={270} y2={135} stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="4,3" />

      {/* 流程标注 */}
      <text x={130} y={75} fontSize={9} fill="var(--text-muted)" transform="rotate(-30, 130, 75)">分配任务</text>
      <text x={270} y={75} fontSize={9} fill="var(--text-muted)" transform="rotate(30, 270, 75)">分配审查</text>
      <text x={200} y={128} textAnchor="middle" fontSize={9} fill="var(--text-muted)">提交/反馈</text>

      {agents.map((a, i) => (
        <g key={i}>
          <rect x={a.x - 50} y={a.y} width={100} height={40} rx={8}
            fill="var(--bg-surface)" stroke={a.color} strokeWidth={1.5} />
          <text x={a.x} y={a.y + 18} textAnchor="middle" fontSize={11} fontWeight={600} fill={a.color}>{a.name}</text>
          <text x={a.x} y={a.y + 32} textAnchor="middle" fontSize={9} fill="var(--text-muted)">{a.desc}</text>
        </g>
      ))}

      {/* 底部共享内存 */}
      <rect x={60} y={175} width={320} height={30} rx={6}
        fill="var(--bg-card)" stroke="var(--border)" strokeWidth={1} />
      <text x={220} y={194} textAnchor="middle" fontSize={10} fill="var(--text-secondary)">
        Shared Memory / Message Queue
      </text>
      <line x1={80} y1={160} x2={80} y2={175} stroke="var(--border)" strokeWidth={1} />
      <line x1={320} y1={160} x2={320} y2={175} stroke="var(--border)" strokeWidth={1} />
    </svg>
  )
}

export default function AgentPage() {
  useThemeColors()

  return (
    <div className="page" style={{ fontSize: 13 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        AI Agents & Tool Use
      </div>
      <h3 className="mb-16">AI Agent</h3>

      <div className="grid-2 mb-16">
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>ReAct 循环演示</label>
          <ReActDemo />
        </div>
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>Tree-of-Thought 搜索</label>
          <TreeOfThought />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>工具调用流程</label>
          <ToolCallFlowSVG />
        </div>
        <div className="card">
          <label className="mb-12" style={{ display: 'block' }}>多 Agent 协作</label>
          <MultiAgentSVG />
        </div>
      </div>
    </div>
  )
}
