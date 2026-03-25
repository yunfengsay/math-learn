import { NavLink } from 'react-router-dom'

const tabs = [
  { path: '/formula', label: '公式讲解' },
  { path: '/sandbox', label: '代码沙盒' },
  { path: '/compression', label: '图像压缩' },
  { path: '/neural-net', label: '神经网络' },
  { path: '/eigenfaces', label: '降维/特征脸' },
]

export default function TabNav() {
  return (
    <nav className="tab-nav">
      {tabs.map(t => (
        <NavLink
          key={t.path}
          to={t.path}
          className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
