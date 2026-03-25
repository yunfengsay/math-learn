import { Outlet } from 'react-router-dom'
import TabNav from './TabNav'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SVD 交互式学习工具</h1>
        <p className="subtitle">奇异值分解 — 支撑人工智能与数据科学的数学引擎</p>
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
