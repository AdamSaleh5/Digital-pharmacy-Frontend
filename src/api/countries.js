import { apiRequest } from './client'

async function readCountryResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.error || fallbackMessage)
  return data
}

export async function getCountries() {
  // apiRequest adds the current Bearer token to this request.
  const response = await apiRequest('/GetCountries')
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || data.error || 'تعذر جلب قائمة الدول')
  }

  return data
}

export async function createCountry(name) {
  const response = await apiRequest('/Country', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 0, name: name.trim() }),
  })
  return readCountryResponse(response, 'Could not add country')
}

export async function updateCountry(id, name) {
  const response = await apiRequest(`/Country/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim() }),
  })
  return readCountryResponse(response, 'Could not update country')
}

export async function deleteCountry(id) {
  const response = await apiRequest(`/Country/${id}`, { method: 'DELETE' })
  return readCountryResponse(response, 'Could not delete country')
}
