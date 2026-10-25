import { useState, useEffect, useRef } from 'react'
import { getPharmacies, createPharmacy, updatePharmacy, deletePharmacy, importPharmacies } from '../api/pharmacy'
import { getCountries } from '../api/countries'
import { exportToExcel } from '../utils/exportExcel'
import { getCurrentRole } from '../utils/permissions'
import './Pharmacy.css'

function normalizeCountries(response) {
  const data = response?.data ?? response?.Data ?? response
  const rows = Array.isArray(data)
    ? data
    : (data?.items ?? data?.Items ?? data?.results ?? data?.Results ?? [])

  return rows
    .map((item) => ({ value: item.id ?? item.Id, label: item.name ?? item.Name ?? '' }))
    .filter((item) => item.value != null && item.label)
}

const emptyPharmacy = () => ({
  name: '',
  address: '',
  managerName: '',
  phone: '',
  country: 0,
})

function mapApiToForm(api) {
  return {
    id: api.id ?? api.Id,
    name: api.name ?? api.Name ?? '',
    address: api.address ?? api.Address ?? '',
    managerName: api.managerName ?? api.ManagerName ?? '',
    phone: api.phoneNumber ?? api.PhoneNumber ?? api.phone ?? api.Phone ?? '',
    country: api.country ?? api.Country ?? 0,
  }
}

function formToApi(form) {
  return {
    ...(form.id && { id: form.id }),
    ...(form.id && { id: form.id }),
    name: form.name,
    address: form.address,
    managerName: form.managerName,
    phoneNumber: form.phone,
    countryId: Number(form.countryId ?? form.country) || 0,
  }
}

export default function Pharmacy() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const showCountry = getCurrentRole() === 'Administrator'
  const [country, setCountry] = useState('')
  const [countries, setCountries] = useState([])
  const [countriesLoading, setCountriesLoading] = useState(showCountry)
  const sessionCountryId = Number(sessionStorage.getItem('countryId') || 0)
  const effectiveCountryId = showCountry ? country : sessionCountryId
  const [search, setSearch] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 20
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [form, setForm] = useState(emptyPharmacy())
  const [submitLoading, setSubmitLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const excelInputRef = useRef(null)

  useEffect(() => {
    if (!showCountry) return

    let active = true
    const loadCountries = async () => {
      setCountriesLoading(true)
      try {
        const options = normalizeCountries(await getCountries())
        if (!active) return
        setCountries(options)
        setCountry((selected) => selected || String(options[0]?.value ?? ''))
      } catch (err) {
        if (active) setError(err.message || 'تعذر جلب قائمة الدول')
      } finally {
        if (active) setCountriesLoading(false)
      }
    }

    loadCountries()
    return () => { active = false }
  }, [showCountry])

  const loadList = async () => {
    if (showCountry && !effectiveCountryId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await getPharmacies({ countryId: effectiveCountryId, search, pageNumber, pageSize })
      const pageData = data?.data || data?.Data || data
      const rows = Array.isArray(pageData) ? pageData : (pageData?.data || pageData?.items || pageData?.Items || pageData?.results || pageData?.Results || [])
      const meta = pageData?.meta || pageData?.Meta || data?.meta || data?.Meta || {}
      const count = Number(meta.totalCount ?? meta.TotalCount ?? rows.length)
      const pages = Number(meta.totalPages ?? meta.TotalPages ?? Math.ceil(count / pageSize)) || 1
      setList(Array.isArray(rows) ? rows : [])
      setTotalCount(count)
      setTotalPages(Math.max(1, pages))
    } catch (e) {
      setError(e.message || 'فشل جلب الصيدليات')
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      loadList()
    }, 300)
    return () => clearTimeout(handle)
  }, [country, search, pageNumber, effectiveCountryId, showCountry])

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyPharmacy(), country: effectiveCountryId })
    setModalOpen(true)
    setError('')
    setSuccess('')
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({ ...mapApiToForm(row), countryId: effectiveCountryId, country: effectiveCountryId })
    setModalOpen(true)
    setError('')
    setSuccess('')
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyPharmacy())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitLoading(true)
    try {
      const payload = formToApi({ ...form, countryId: effectiveCountryId })
      if (editingId) {
        await updatePharmacy(editingId, payload)
        setSuccess('تم تحديث الصيدلية بنجاح')
      } else {
        await createPharmacy({ ...payload, id: 0 })
        setSuccess('تم إضافة الصيدلية بنجاح')
      }
      await loadList()
      setTimeout(closeModal, 800)
    } catch (err) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleDelete = (row) => {
    const id = row.id ?? row.Id
    if (!id) return
    setPendingDelete(row)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    const id = pendingDelete?.id ?? pendingDelete?.Id
    if (!id) {
      setConfirmOpen(false)
      setPendingDelete(null)
      return
    }
    setError('')
    try {
      await deletePharmacy(id)
      setSuccess('تم حذف الصيدلية بنجاح')
      await loadList()
    } catch (e) {
      setError(e.message || 'فشل حذف الصيدلية')
    } finally {
      setConfirmOpen(false)
      setPendingDelete(null)
    }
  }

  const handleExportExcel = () => {
    const rows = list.map((row) => ({
      الاسم: row.name ?? row.Name ?? '',
      العنوان: row.address ?? row.Address ?? '',
      الهاتف: row.phoneNumber ?? row.PhoneNumber ?? row.phone ?? row.Phone ?? '',
      'اسم المسؤول': row.managerName ?? row.ManagerName ?? '',
    }))
    exportToExcel(rows, 'الصيدليات')
  }

  const openExcelPicker = () => excelInputRef.current?.click()

  const handleExcelFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setSuccess('')
    setImportLoading(true)
    try {
      await importPharmacies(file, effectiveCountryId)
      setSuccess('تم استيراد ملف الصيدليات بنجاح')
      setPageNumber(1)
      await loadList()
    } catch (err) {
      setError(err.message || 'فشل استيراد ملف الصيدليات')
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className={`pharmacy-page ${!showCountry ? 'non-administrator' : ''}`}>
      <div className="page-header">
        <h2 className="page-title">إدارة الصيدليات</h2>
        <div className="page-header-actions">
          <input ref={excelInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleExcelFile} />
          <button type="button" className="btn btn-outline pharmacy-import-button" onClick={openExcelPicker} disabled={importLoading}>
            📊 تصدير إكسل
          </button>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            + إضافة صيدلية
          </button>
        </div>
      </div>

      <div className="pharmacy-search-bar">
        <div className="pharmacy-search-input-wrap">
          <span className="pharmacy-search-icon" aria-hidden>🔍</span>
          <input
            type="text"
            placeholder="البحث باسم الصيدلية..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPageNumber(1) }}
            className="pharmacy-search-input"
          />
        </div>
        {showCountry && <div className="pharmacy-search-filter">
          <label>الدولة:</label>
          <select value={country} onChange={(e) => { setCountry(Number(e.target.value)); setPageNumber(1) }}>
            {countriesLoading && <option value="">جاري تحميل الدول...</option>}
            {!countriesLoading && countries.length === 0 && <option value="">لا توجد دول متاحة</option>}
            {countries.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>}
      </div>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <div className="table-wrap">
        {loading ? (
          <p className="empty-state">جاري التحميل...</p>
        ) : list.length === 0 ? (
          <p className="empty-state">
            {search.trim() ? 'لا توجد نتائج تطابق البحث.' : 'لا توجد صيدليات.'}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>العنوان</th>
                <th>الهاتف</th>
                <th>اسم المسؤول</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <td>{row.name ?? row.Name}</td>
                  <td>{row.address ?? row.Address}</td>
                  <td>{row.phoneNumber ?? row.PhoneNumber ?? row.phone ?? row.Phone}</td>
                  <td>{row.managerName ?? row.ManagerName}</td>
                  <td>
                    <div className="cell-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => openEdit(row)}>
                        تعديل
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => handleDelete(row)}>
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="pagination" aria-label="صفحات الصيدليات">
          <button type="button" className="btn btn-secondary" disabled={pageNumber <= 1} onClick={() => setPageNumber((page) => Math.max(1, page - 1))}>السابق</button>
          <span>صفحة {pageNumber} من {totalPages} ({totalCount} صيدلية)</span>
          <button type="button" className="btn btn-secondary" disabled={pageNumber >= totalPages} onClick={() => setPageNumber((page) => Math.min(totalPages, page + 1))}>التالي</button>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeModal} aria-label="إغلاق">×</button>
            <h3>{editingId ? 'تعديل الصيدلية' : 'إضافة صيدلية'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>الاسم *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>العنوان</label>
                <input
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>الهاتف</label>
                <input
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>اسم المسؤول</label>
                <input
                  value={form.managerName}
                  onChange={(e) => handleChange('managerName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>الدولة</label>
                <div className="readonly-field">
                  {countries.find((item) => Number(item.value) === Number(form.country))?.label || ''}
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
              {success && <p className="success-msg">{success}</p>}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setConfirmOpen(false)} aria-label="إغلاق">×</button>
            <h3>تأكيد الحذف</h3>
            <p className="confirm-text">
              هل أنت متأكد من حذف الصيدلية
              {' '}
              {pendingDelete?.name ?? pendingDelete?.Name}
              ؟
            </p>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
                إلغاء
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                نعم، حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
