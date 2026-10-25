import { apiRequest } from './client'

export async function getAllUsers(countryId = 1) {
  const response = await apiRequest(`/GetAllUsers?countryId=${encodeURIComponent(countryId)}`)

  if (!response.ok) throw new Error('Unable to load users')

  return response.json()
}

export async function getAllAgents(countryId = 2) {
  const response = await apiRequest(`/GetAllUsers/Agent?countryId=${encodeURIComponent(countryId)}`)

  if (!response.ok) throw new Error('Unable to load agents')

  return response.json()
}

export async function getAllAdmins(countryId) {
  const response = await apiRequest(`/GetAllUsers/Admin?countryId=${encodeURIComponent(countryId)}`)

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || data.error || data.title || 'Unable to load admins')
  }

  return data
}

export async function createUser({ name, phoneNumber, role = 4, activationCode, email, password, agentName, countryId }) {
  const response = await apiRequest('/Users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      phoneNumber,
      role,
      activationCode,
      ...(email != null ? { email } : {}),
      ...(password != null ? { password } : {}),
      ...(agentName != null ? { agentName } : {}),
      ...(countryId != null ? { countryId } : {}),
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || data.error || data.title || 'Unable to create user')
  }

  return data
}

export async function updateUser(id, { name, phoneNumber, role = 4, activationCode, email, password, agentName, countryId }) {
  const response = await apiRequest(`/Users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      phoneNumber,
      role,
      activationCode,
      ...(email != null ? { email } : {}),
      ...(password != null ? { password } : {}),
      ...(agentName != null ? { agentName } : {}),
      ...(countryId != null ? { countryId } : {}),
    }),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.message || data?.error || data?.title || 'Unable to update user')
  }

  return data
}

export async function deleteUser(id) {
  const response = await apiRequest(`/Users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || data.error || data.title || 'Unable to delete user')
  }
}
