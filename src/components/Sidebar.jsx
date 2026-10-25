import { NavLink } from 'react-router-dom'
import './Sidebar.css'

export default function Sidebar({ items, appName, isOpen, onNavigate }) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-logo">🏥</span>
        <span className="sidebar-app-name">{appName}</span>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="sidebar-version">الإصدار ١.٠</span>
      </div>
    </aside>
  )
}
