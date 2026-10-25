import { Link } from 'react-router-dom'
import { getCurrentRole } from '../utils/permissions'
import './Home.css'

export default function Home() {
  const canManageAgents = ['Admin', 'Administrator'].includes(getCurrentRole())
  const canManageAdmins = getCurrentRole() === 'Administrator'
  return (
    <div className="admin-home">
      <section className="admin-welcome">
        <h1 className="admin-welcome-title">لوحة إدارة الصيدلية الرقمية</h1>
        <p className="admin-welcome-desc">
          من هنا يمكنك إدارة الأدوية والصيدليات والمستخدمين: إضافة، تعديل، والبحث عن الأدوية بالاسم التجاري أو غيره.
        </p>
      </section>

      <section className="admin-actions">
        <Link to="/medications" className="admin-action-card">
          <span className="admin-action-icon">💊</span>
          <h2 className="admin-action-title">إدارة الأدوية</h2>
          <p className="admin-action-desc">
            إضافة دواء جديد، تعديل بيانات الأدوية، والبحث حسب الاسم التجاري أو العلمي أو الشركة أو الوكيل.
          </p>
          <span className="admin-action-link">الذهاب إلى الأدوية ←</span>
        </Link>

        <Link to="/pharmacy" className="admin-action-card">
          <span className="admin-action-icon">🏥</span>
          <h2 className="admin-action-title">إدارة الصيدليات</h2>
          <p className="admin-action-desc">
            إضافة صيدلية جديدة وتعديل معلومات الصيدليات.
          </p>
          <span className="admin-action-link">الذهاب إلى الصيدليات ←</span>
        </Link>

        <Link to="/add-user" className="admin-action-card">
          <span className="admin-action-icon">👤</span>
          <h2 className="admin-action-title">إضافة مستخدم</h2>
          <p className="admin-action-desc">
            إضافة مستخدم جديد للنظام لاستخدام التطبيق.
          </p>
          <span className="admin-action-link">إضافة مستخدم ←</span>
        </Link>

        {canManageAgents && <Link to="/add-agent" className="admin-action-card">
          <span className="admin-action-icon">🤝</span>
          <h2 className="admin-action-title">إضافة وكيل</h2>
          <p className="admin-action-desc">
            إضافة وكيل دواء جديد للنظام وإدارة بيانات التواصل الخاصة به.
          </p>
          <span className="admin-action-link">إضافة وكيل ←</span>
        </Link>}

        {canManageAdmins && <Link to="/add-admin" className="admin-action-card">
          <span className="admin-action-icon">🛡️</span>
          <h2 className="admin-action-title">إضافة أدمن</h2>
          <p className="admin-action-desc">
            إضافة مشرف جديد للوحة الإدارة.
          </p>
          <span className="admin-action-link">إضافة أدمن ←</span>
        </Link>}

        {canManageAdmins && <Link to="/countries" className="admin-action-card">
          <span className="admin-action-icon">🌍</span>
          <h2 className="admin-action-title">إدارة الدول</h2>
          <p className="admin-action-desc">
            عرض الدول المتاحة وإضافة دولة جديدة للنظام.
          </p>
          <span className="admin-action-link">إدارة الدول ←</span>
        </Link>}
      </section>
    </div>
  )
}
