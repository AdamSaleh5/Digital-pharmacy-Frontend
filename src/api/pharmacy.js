import { apiRequest } from './client'

export async function getPharmacies({ countryId = 0, search = '', pageNumber = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ CountryId: String(countryId), SearchType: '1', PageNumber: String(pageNumber), PageSize: String(pageSize) })
  if (search.trim()) params.set('StringSerch', search.trim())
  const res = await apiRequest(`/GetPharmacies?${params}`)
  if (!res.ok) throw new Error('فشل جلب الصيدليات')
  return res.json()
}

export async function getPharmacyById(id) {
  const res = await apiRequest(`/Pharmacy/${id}`)
  if (!res.ok) throw new Error('فشل جلب بيانات الصيدلية')
  return res.json()
}

export async function createPharmacy(data) {
  const res = await apiRequest('/Pharmacies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error('فشل إضافة الصيدلية')
  return res.json()
}

export async function importPharmacies(file, countryId) {
  const formData = new FormData()
  formData.append('CountryId', String(countryId))
  formData.append('File', file)
  const res = await apiRequest('/Pharmacies/import', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('فشل استيراد ملف الصيدليات')
  return res.json().catch(() => ({}))
}

export async function updatePharmacy(id, data) {
  const res = await apiRequest(`/Pharmacies/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error('فشل تحديث الصيدلية')
  return res.json()
}

export async function deletePharmacy(id) {
  const res = await apiRequest(`/Pharmacies/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('فشل حذف الصيدلية')
  return res.json().catch(() => ({}))
}
