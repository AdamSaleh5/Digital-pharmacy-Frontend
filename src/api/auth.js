import { API_BASE } from './config'

export async function login({ email, password }) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { Accept: 'text/plain', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || data.error || data.title || 'فشل تسجيل الدخول. تحقق من بياناتك.')
  }
  if (!data.accessToken && !data.token) {
    throw new Error('استجابة تسجيل الدخول غير مكتملة: لم يتم استلام رمز المصادقة.')
  }
  return data
}
