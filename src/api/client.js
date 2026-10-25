import { API_BASE } from './config'
import { clearAuthData } from '../utils/permissions'

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = sessionStorage.getItem('token')
  headers.set('Accept', headers.get('Accept') || '*/*')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (response.status === 401) {
    clearAuthData()
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }
  return response
}
