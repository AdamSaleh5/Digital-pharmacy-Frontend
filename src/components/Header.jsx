import { useNavigate } from 'react-router-dom'
import { clearAuthData } from '../utils/permissions'
import './Header.css'

export default function Header({ title, onMenuToggle }) {
  const navigate = useNavigate()
  const userType = sessionStorage.getItem('userType')
  const isAgent = userType === 'Agent' || userType === '3'
  const isUser = userType === 'User' || userType === '4'
  const fallbackLabel = isAgent ? 'الوكيل' : isUser ? 'مستخدم' : 'مدير النظام'
  const accountName = sessionStorage.getItem('userName') || fallbackLabel
  const accountInitial = accountName.trim().charAt(0) || 'م'

  const handleLogout = () => {
    if (!window.confirm('هل تريد تسجيل الخروج من الحساب؟')) return
    // لا نترك أي بيانات جلسة على الجهاز المشترك.
    clearAuthData()
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-header">
      <div className="header-brand">
        {onMenuToggle && (
          <button type="button" className="mobile-menu-button" onClick={onMenuToggle} aria-label="القائمة">
            <span />
            <span />
            <span />
          </button>
        )}
        <span className="header-brand-mark" aria-hidden="true">✚</span>
        <div className="header-brand-copy">
        <span className="header-title-main">لوحة إدارة الصيدلية الرقمية</span>
        <span className="header-title-sub">{title}</span>
        </div>
      </div>
      <div className="header-actions">
        <div className="header-user" aria-label="الحساب الحالي">
          <span className="header-user-avatar" aria-hidden="true">{accountInitial}</span>
          <span className="header-user-copy">
            <strong className="header-user-label">{accountName}</strong>
            <small className="header-user-role">{fallbackLabel}</small>
          </span>
        </div>
        <button type="button" className="logout-button" onClick={handleLogout} title="تسجيل الخروج">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v-2H5V5h5V3Zm6.59 5.59L15.17 10 17.17 12H9v2h8.17l-2 2 1.42 1.41L21 13l-4.41-4.41Z" /></svg>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </header>
  )
}
