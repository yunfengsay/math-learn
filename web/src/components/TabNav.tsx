import { useState } from 'react'
import { NavLink } from 'react-router-dom'

interface NavGroup {
  label: string
  items: { path: string; label: string }[]
}

const courseGroups: NavGroup[] = [
  {
    label: '数学基础',
    items: [
      { path: '/formula', label: 'SVD 公式' },
      { path: '/calculus', label: '微积分' },
      { path: '/probability', label: '概率论' },
      { path: '/optimization', label: '优化理论' },
    ],
  },
  {
    label: 'DL 基础',
    items: [
      { path: '/neural-net', label: '神经网络' },
      { path: '/backprop', label: '反向传播' },
      { path: '/regularization', label: '正则化' },
    ],
  },
  {
    label: '核心架构',
    items: [
      { path: '/cnn', label: 'CNN' },
      { path: '/rnn', label: 'RNN/LSTM' },
      { path: '/transformer', label: 'Transformer' },
    ],
  },
  {
    label: '现代 DL',
    items: [
      { path: '/llm', label: 'LLM' },
      { path: '/diffusion', label: '扩散模型' },
      { path: '/rlhf', label: 'RLHF' },
    ],
  },
  {
    label: '应用与实战',
    items: [
      { path: '/compression', label: '图像压缩' },
      { path: '/eigenfaces', label: '特征脸' },
      { path: '/sandbox', label: '代码沙盒' },
    ],
  },
  {
    label: '工程与前沿',
    items: [
      { path: '/experiment', label: '实验管理' },
      { path: '/deployment', label: '模型部署' },
      { path: '/multimodal', label: '多模态' },
      { path: '/agent', label: 'AI Agent' },
      { path: '/reasoning', label: '推理' },
    ],
  },
]

function DropdownGroup({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="tab-item"
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {group.label} ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '4px 0', minWidth: 140,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          {group.items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                display: 'block', padding: '8px 16px', fontSize: 13,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                textDecoration: 'none', whiteSpace: 'nowrap',
              })}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TabNav() {
  return (
    <nav className="tab-nav" style={{ alignItems: 'center' }}>
      <NavLink
        to="/roadmap"
        className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
      >
        学习路线
      </NavLink>
      <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
      {courseGroups.map(g => (
        <DropdownGroup key={g.label} group={g} />
      ))}
    </nav>
  )
}
