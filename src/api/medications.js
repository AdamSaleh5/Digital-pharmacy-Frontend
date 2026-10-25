import { apiRequest } from './client'

export async function getMedications({ search = '', countryId = 0, pageNumber = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    CountryId: String(countryId),
    SearchType: '1',
    PageNumber: String(pageNumber),
    PageSize: String(pageSize),
  })
  if (search.trim()) params.set('StringSerch', search.trim())
  const res = await apiRequest(`/GetMedicationSelect?${params}`)
  if (!res.ok) throw new Error('فشل جلب الأدوية')
  return res.json()
}

export async function createMedication(data) {
  const res = await apiRequest('/MedicationDetails', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error('فشل إضافة الدواء')
  return res.json()
}

export async function importMedications(file, countryId) {
  const formData = new FormData()
  formData.append('CountryId', String(countryId))
  formData.append('File', file)
  const res = await apiRequest('/MedicationDetails/import', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('فشل استيراد ملف الأدوية')
  return res.json().catch(() => ({}))
}

export async function updateMedication(id, data) {
  const res = await apiRequest(`/MedicationDetails/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!res.ok) throw new Error('فشل تحديث الدواء')
  return res.json()
}

export async function getMedicationDetails({ id, searchType = 1 } = {}) {
  const params = new URLSearchParams({ id: String(id), searchType: String(searchType) })
  const res = await apiRequest(`/GetMedicationDetails?${params}`)
  if (!res.ok) throw new Error('فشل جلب تفاصيل الدواء')
  return res.json()
}

export async function deleteMedication(id) {
  const res = await apiRequest(`/MedicationDetails/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('فشل حذف الدواء')
  return res.json().catch(() => ({}))
}
