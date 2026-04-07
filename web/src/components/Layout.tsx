import { Outlet } from 'react-router-dom'
import TabNav from './TabNav'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Deep Learning Mastery</h1>
        <p className="subtitle">从数学基础到前沿研究 — 全路径交互式学习平台</p>
        <div style={{ marginLeft: 'auto' }}>
          <ThemeToggle />
        </div>
      </header>
      <TabNav />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
