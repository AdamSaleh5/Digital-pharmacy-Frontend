import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMedications, createMedication, importMedications } from '../api/medications'
import { getCountries } from '../api/countries'
import { getCurrentRole, isAgent } from '../utils/permissions'
import './Medications.css'

function normalizeCountries(response) {
  const data = response?.data ?? response?.Data ?? response
  const rows = Array.isArray(data)
    ? data
    : (data?.items ?? data?.Items ?? data?.results ?? data?.Results ?? [])

  return rows
    .map((item) => ({ value: item.id ?? item.Id, label: item.name ?? item.Name ?? '' }))
    .filter((item) => item.value != null && item.label)
}

const emptyMedication = () => ({
  tradeName: '',
  scientificName: '',
  usage: '',
  company: '',
  agent: '',
  pharmaceuticalForm: '',
  price: '',
  agentsPhoneNumber: '',
  country: 0,
})

function formToApi(form) {
  return {
    tradeName: form.tradeName,
    scientificName: form.scientificName,
    usage: form.usage,
    company: form.company,
    agent: form.agent,
    pharmaceuticalForm: form.pharmaceuticalForm,
    price: Number(form.price) || 0,
    agentsPhoneNumber: form.agentsPhoneNumber,
    countryId: Number(form.countryId ?? form.country) || 0,
  }
}

const SEARCH_TYPE_LABELS = { 1: 'الاسم التجاري', 2: 'الاسم العلمي', 3: 'الشركة', 4: 'الوكيل', 5: 'الشكل الصيدلاني' }

export default function Medications() {
  const navigate = useNavigate()
  const agentMode = isAgent()
  const currentRole = getCurrentRole()
  const showCountry = currentRole === 'Administrator'
  const canSendNotifications = ['Administrator', 'Admin'].includes(currentRole)
  const agentCountryId = Number(sessionStorage.getItem('countryId') || 0)
  const agentName = sessionStorage.getItem('agentName') || sessionStorage.getItem('userName') || ''
  const agentPhoneNumber = sessionStorage.getItem('agentPhoneNumber') || ''
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [countries, setCountries] = useState([])
  const [countriesLoading, setCountriesLoading] = useState(showCountry)
  const countryOptions = countries
  const effectiveCountryId = showCountry ? country : agentCountryId
  const searchType = 1
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 20
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyMedication())
  const [submitLoading, setSubmitLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [notifyConfirmOpen, setNotifyConfirmOpen] = useState(false)
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
      const data = await getMedications({ search, countryId: effectiveCountryId, pageNumber, pageSize })
      const pageData = data?.data || data?.Data || data
      const rows = Array.isArray(pageData) ? pageData : (pageData?.data || pageData?.items || pageData?.Items || pageData?.results || pageData?.Results || pageData?.medications || pageData?.Medications || [])
      const meta = pageData?.meta || pageData?.Meta || data?.meta || data?.Meta || {}
      const count = Number(meta.totalCount ?? meta.TotalCount ?? pageData?.totalCount ?? pageData?.TotalCount ?? rows.length)
      const pagesValue = meta.totalPages ?? meta.TotalPages ?? pageData?.totalPages ?? pageData?.TotalPages ?? Math.ceil(count / pageSize)
      const pages = Number(pagesValue) || 1
      setList(Array.isArray(rows) ? rows : [])
      setTotalCount(count)
      setTotalPages(Math.max(1, pages))
    } catch (e) {
      setError(e.message || 'فشل جلب الأدوية')
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
  }, [search, country, pageNumber, agentMode, agentCountryId, effectiveCountryId, showCountry])

  const handleSearch = (e) => {
    e?.preventDefault()
    setPageNumber(1)
    loadList()
  }

  const openAdd = () => {
    setForm(emptyMedication())
    setForm((f) => ({
      ...f,
      countryId: effectiveCountryId,
      country: effectiveCountryId,
      ...(agentMode ? { agent: agentName, agentsPhoneNumber: agentPhoneNumber } : {}),
    }))
    setModalOpen(true)
    setError('')
    setSuccess('')
  }

  const closeModal = () => {
    setModalOpen(false)
    setForm(emptyMedication())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitLoading(true)
    try {
      const payload = formToApi({
        ...form,
        countryId: effectiveCountryId,
        ...(agentMode ? { agent: agentName, agentsPhoneNumber: agentPhoneNumber } : {}),
      })
      await createMedication(payload)
      setSuccess('تم إضافة الدواء بنجاح')
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

  const handleRowClick = (row) => {
    const id = row.id ?? row.Id
    if (id == null) return
    navigate(`/medications/${id}?country=${effectiveCountryId}`)
  }

  const openExcelPicker = () => {
    excelInputRef.current?.click()
  }

  /** اختيار ملف إكسل فقط — عند توفر الـ API: استخدم e.target.files?.[0] قبل إفراغ الحقل */
  const handleExcelFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setSuccess('')
    setImportLoading(true)
    try {
      const countryId = effectiveCountryId
      await importMedications(file, countryId)
      setSuccess('تم استيراد ملف الأدوية بنجاح')
      setPageNumber(1)
      await loadList()
    } catch (err) {
      setError(err.message || 'فشل استيراد ملف الأدوية')
    } finally {
      setImportLoading(false)
    }
  }

  const handleConfirmNotify = () => {
    // TODO: استدعاء API إرسال الإشعارات عند توفره
    setNotifyConfirmOpen(false)
  }

  return (
    <div className={`medications-page ${agentMode ? 'agent-mode' : ''} ${!showCountry ? 'non-administrator' : ''}`}>
      <div className="page-header">
        <h2 className="page-title">إدارة الأدوية</h2>
        <div className="page-header-actions">
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            style={{ display: 'none' }}
            aria-hidden
            tabIndex={-1}
            onChange={handleExcelFile}
          />
          <button
            type="button"
            className="btn btn-outline"
            onClick={openExcelPicker}
            disabled={importLoading}
            title="اختر ملف .xlsx أو .xls"
          >
            📥 رفع ملف إكسل
          </button>
          {canSendNotifications && (
            <button type="button" className="btn btn-outline" onClick={() => setNotifyConfirmOpen(true)}>
              🔔 إرسال إشعارات
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            + إضافة دواء
          </button>
        </div>
      </div>

      <form className="medications-search-bar" onSubmit={handleSearch}>
        <div className="medications-search-input-wrap">
          <span className="medications-search-icon" aria-hidden>🔍</span>
          <input
            type="text"
            placeholder={`البحث بـ ${SEARCH_TYPE_LABELS[searchType] || 'الاسم التجاري'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="medications-search-input"
          />
        </div>
          {showCountry && (
            <div className="medications-search-filter">
              <label htmlFor="medications-country">الدولة:</label>
              <select id="medications-country" value={country} onChange={(e) => { setCountry(Number(e.target.value)); setPageNumber(1) }} aria-label="الدولة">
              {countriesLoading && <option value="">جاري تحميل الدول...</option>}
              {!countriesLoading && countryOptions.length === 0 && <option value="">لا توجد دول متاحة</option>}
              {countryOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            </div>
          )}
          {loading && <span className="loading-inline">جاري التحميل...</span>}
      </form>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <div className="table-wrap">
        {loading ? (
          <p className="empty-state">جاري التحميل...</p>
        ) : list.length === 0 ? (
          <p className="empty-state">لا توجد أدوية. استخدم البحث أو أضف دواءً جديداً.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>الاسم التجاري</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id ?? row.Id ?? row.value ?? row.Value} className="clickable-row" onClick={() => handleRowClick(row)}>
                  <td>{row.value ?? row.Value ?? row.tradeName ?? row.TradeName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="pagination" aria-label="صفحات الأدوية">
          <button type="button" className="btn btn-secondary" disabled={pageNumber <= 1} onClick={() => setPageNumber((page) => Math.max(1, page - 1))}>السابق</button>
          <span>صفحة {pageNumber} من {totalPages} ({totalCount} دواء)</span>
          <button type="button" className="btn btn-secondary" disabled={pageNumber >= totalPages} onClick={() => setPageNumber((page) => Math.min(totalPages, page + 1))}>التالي</button>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal medication-add-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeModal} aria-label="إغلاق">×</button>
            <h3>إضافة دواء</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>الاسم التجاري *</label>
                <input
                  value={form.tradeName}
                  onChange={(e) => handleChange('tradeName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>الاسم العلمي</label>
                <input
                  value={form.scientificName}
                  onChange={(e) => handleChange('scientificName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>الاستخدام</label>
                <input
                  value={form.usage}
                  onChange={(e) => handleChange('usage', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>الشركة</label>
                <input
                  value={form.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>الوكيل</label>
                <input
                  value={form.agent}
                  readOnly={agentMode}
                  onChange={(e) => handleChange('agent', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>الشكل الصيدلاني</label>
                <input
                  value={form.pharmaceuticalForm}
                  onChange={(e) => handleChange('pharmaceuticalForm', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>السعر</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>هاتف الوكيل</label>
                <input
                  value={form.agentsPhoneNumber}
                  readOnly={agentMode}
                  onChange={(e) => handleChange('agentsPhoneNumber', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>الدولة</label>
                {showCountry && <select
                  className="agent-country-select"
                  value={form.country}
                  onChange={(e) => handleChange('country', Number(e.target.value))}
                >
                  {countriesLoading && <option value="">جاري تحميل الدول...</option>}
                  {countryOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>}
              </div>
              {error && <p className="error-msg">{error}</p>}
              {success && <p className="success-msg">{success}</p>}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'جاري الحفظ...' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notifyConfirmOpen && (
        <div className="modal-overlay" onClick={() => setNotifyConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setNotifyConfirmOpen(false)} aria-label="إغلاق">×</button>
            <h3>إرسال إشعارات</h3>
            <p>هل تريد إرسال إشعار بأن هناك تعديلات جديدة لمستخدمي التطبيق؟</p>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setNotifyConfirmOpen(false)}>
                إلغاء
              </button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmNotify}>
                موافق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
