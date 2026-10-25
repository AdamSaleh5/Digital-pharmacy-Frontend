const ROLE_ALIASES = {
  '1': 'Administrator',
  administrator: 'Administrator',
  '2': 'Admin',
  admin: 'Admin',
  '3': 'Agent',
  agent: 'Agent',
  '4': 'User',
  user: 'User',
}

export function getCurrentRole() {
  const rawRole = sessionStorage.getItem('userType') || sessionStorage.getItem('role') || ''
  return ROLE_ALIASES[String(rawRole).trim().toLowerCase()] || String(rawRole).trim()
}

export function isAgent() {
  return getCurrentRole() === 'Agent'
}

export function canAccessPath(path) {
  if (!isAgent()) return true
  return path === '/medications' || path.startsWith('/medications/')
}

export function clearAuthData() {
  sessionStorage.clear()
}
