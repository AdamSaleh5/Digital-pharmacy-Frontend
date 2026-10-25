import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { saveAuthSession } from '../utils/authStorage'
import './Login.css'

function EyeIcon({ hidden = false }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.27 4.22 2 5.5l3.05 3.05A12.1 12.1 0 0 0 1 12c1.73 3.94 6 7 11 7 1.73 0 3.37-.36 4.84-1l3.89 3.89 1.27-1.27L3.27 4.22ZM12 17c-2.76 0-5-2.24-5-5 0-.75.17-1.46.46-2.1l6.64 6.64c-.65.3-1.36.46-2.1.46Zm0-12c5 0 9.27 3.06 11 7a11.7 11.7 0 0 1-2.88 3.74l-2.2-2.2A6 6 0 0 0 9.46 7.1L7.1 4.74A11.8 11.8 0 0 1 12 5Zm0 4a3 3 0 0 1 3 3c0 .43-.09.85-.26 1.22l-3.96-3.96C11.15 9.09 11.57 9 12 9Z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5C7 5 2.73 8.06 1 12c1.73 3.94 6 7 11 7s9.27-3.06 11-7c-1.73-3.94-6-7-11-7Zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('token')) navigate('/', { replace: true })
  }, [navigate])

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const email = form.email.trim()
    if (!email || !form.password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await login({ email, password: form.password })
      saveAuthSession(data)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'تعذر تسجيل الدخول. تحقق من بياناتك وحاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-logo" aria-hidden="true">✚</div>
          <p className="login-kicker">منصة الرعاية الصحية</p>
          <h1 id="login-title" className="login-title">مرحباً بعودتك</h1>
          <p className="login-subtitle">سجّل دخولك إلى لوحة إدارة الصيدلية الرقمية</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" autoComplete="off" noValidate>
          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">@</span>
              <input id="email" type="email" value={form.email} onChange={handleChange('email')} placeholder="name@example.com" autoComplete="off" dir="ltr" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">⌑</span>
              <input id="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange('password')} placeholder="أدخل كلمة المرور" autoComplete="new-password" required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
          </div>

          {error && <p className="error-msg" role="alert">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <><span className="spinner" aria-hidden="true" /> جارٍ تسجيل الدخول...</> : 'تسجيل الدخول'}
          </button>
          <p className="login-footer">وصول آمن ومخصص لفريق الصيدلية</p>
        </form>
      </section>
    </main>
  )
}
