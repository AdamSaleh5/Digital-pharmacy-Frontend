import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import './Layout.css'
import { getCurrentRole, isAgent } from '../utils/permissions'

const navItems = [
  { id: 'home', path: '/', label: 'الرئيسية', icon: '📋' },
  { id: 'medications', path: '/medications', label: 'إدارة الأدوية', icon: '💊' },
  { id: 'pharmacy', path: '/pharmacy', label: 'إدارة الصيدليات', icon: '🏥' },
  { id: 'add-user', path: '/add-user', label: 'إدارة المستخدمين', icon: '👤' },
  { id: 'add-agent', path: '/add-agent', label: 'إدارة الوكلاء', icon: '🤝' },
  { id: 'countries', path: '/countries', label: 'إدارة الدول', icon: '🌍' },
  { id: 'add-admin', path: '/add-admin', label: 'إضافة أدمن', icon: '🛡️' },
]

const titles = {
  '/': { title: 'الرئيسية', subtitle: 'لوحة التحكم' },
  '/medications': { title: 'إدارة الأدوية', subtitle: 'إضافة، تعديل، والبحث بالاسم التجاري أو غيره' },
  '/pharmacy': { title: 'إدارة الصيدليات', subtitle: 'إضافة صيدلية وتعديل معلوماتها' },
  '/add-user': { title: 'إدارة المستخدمين', subtitle: 'إضافة وتعديل وإدارة المستخدمين' },
  '/add-admin': { title: 'إضافة أدمن', subtitle: 'إضافة مشرف جديد للوحة الإدارة' },
  '/add-agent': { title: 'إدارة الوكلاء', subtitle: 'إضافة وتعديل وإدارة الوكلاء' },
  '/countries': { title: 'إدارة الدول', subtitle: 'إضافة وتعديل وحذف الدول' },
}

export default function Layout() {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const path = location.pathname
  const { title } = titles[path] || titles['/']

  const role = getCurrentRole()
  const canManageAgents = role === 'Admin' || role === 'Administrator'
  const canManageAdmins = role === 'Administrator'
  const visibleNavItems = isAgent()
    ? navItems.filter((item) => item.id === 'medications')
    : navItems.filter((item) => {
      if (item.id === 'add-agent') return canManageAgents
      if (item.id === 'add-admin') return canManageAdmins
      if (item.id === 'countries') return canManageAdmins
      return true
    })
  const itemsWithActive = visibleNavItems.map((item) => ({
    ...item,
    active: path === item.path || (item.path !== '/' && path.startsWith(item.path)),
  }))

  const isHome = path === '/'

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [path])

  return (
    <div className={`app-layout ${isHome ? 'app-layout-home' : ''}`}>
      {!isHome && (
        <>
          <Sidebar items={itemsWithActive} appName="لوحة الإدارة" isOpen={isMobileMenuOpen} onNavigate={() => setIsMobileMenuOpen(false)} />
          <button type="button" className={`sidebar-backdrop ${isMobileMenuOpen ? 'is-visible' : ''}`} aria-label="إغلاق القائمة" onClick={() => setIsMobileMenuOpen(false)} />
        </>
      )}
      <Header title={title} onMenuToggle={!isHome ? () => setIsMobileMenuOpen((open) => !open) : undefined} />
      <div className="app-main">
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
