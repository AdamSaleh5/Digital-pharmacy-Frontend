// Override this URL in .env with VITE_API_URL when needed.
// API routes are appended to this base (for example: /auth/login).
// Keep the `/api` prefix here so a deployment value such as
// `http://host:5002` cannot accidentally request `/auth/login`.
const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://144.91.111.63:5002/api'
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, '')
const API_BASE = normalizedApiUrl.endsWith('/api')
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`

export { API_BASE }
