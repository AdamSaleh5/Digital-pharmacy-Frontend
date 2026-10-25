import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { deleteMedication, getMedicationDetails, updateMedication } from '../api/medications'
import { getCurrentRole, isAgent } from '../utils/permissions'
import './Medications.css'

const SEARCH_TYPE = 1

// Support PascalCase (.NET) and camelCase field names
function mapApiToForm(api) {
  return {
    id: api.id ?? api.Id,
    tradeName: api.tradeName ?? api.TradeName ?? '',
    scientificName: api.scientificName ?? api.ScientificName ?? '',
    usage: api.usage ?? api.Usage ?? '',
    company: api.company ?? api.Company ?? '',
    agent: api.agent ?? api.Agent ?? '',
    pharmaceuticalForm: api.pharmaceuticalForm ?? api.PharmaceuticalForm ?? '',
    price: api.price ?? api.Price ?? '',
    agentsPhoneNumber: api.agentsPhoneNumber ?? api.AgentsPhoneNumber ?? '',
    country: api.country ?? api.Country ?? 0,
  }
}

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

export default function MedicationDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const country = Number(searchParams.get('country')) || 0
  const agentMode = isAgent()
  const showCountry = getCurrentRole() === 'Administrator'
  const agentName = sessionStorage.getItem('agentName') || sessionStorage.getItem('userName') || ''
  const agentPhoneNumber = sessionStorage.getItem('agentPhoneNumber') || ''
  const agentCountryId = Number(sessionStorage.getItem('countryId') || country || 0)

  const [detailsLoading, setDetailsLoading] = useState(true)
  const [detailsList, setDetailsList] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [form, setForm] = useState(mapApiToForm({ country }))
  const [submitLoading, setSubmitLoading] = useState(false)

  const loadDetails = async () => {
    setDetailsLoading(true)
    setError('')
    try {
      const data = await getMedicationDetails({ id, searchType: SEARCH_TYPE })
      const pageData = data?.data || data?.Data || data
      const rows = Array.isArray(pageData) ? pageData : (pageData?.data || pageData?.items || pageData?.Items || [])
      setDetailsList(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setDetailsList([])
      setError(e.message || 'فشل جلب تفاصيل الدواء')
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadDetails()
    } else {
      setDetailsLoading(false)
      setDetailsList([])
    }
  }, [id, country])

  const handleEdit = (row) => {
    setEditingId(row.id ?? row.Id)
    setForm({
      ...mapApiToForm(row),
      countryId: agentCountryId,
      ...(agentMode ? { agent: agentName, agentsPhoneNumber: agentPhoneNumber } : {}),
    })
    setModalOpen(true)
    setError('')
    setSuccess('')
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
      await deleteMedication(id)
      setSuccess('تم حذف الدواء بنجاح')
      await loadDetails()
    } catch (e) {
      setError(e.message || 'فشل حذف الدواء')
    } finally {
      setConfirmOpen(false)
      setPendingDelete(null)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(mapApiToForm({ country }))
  }

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitLoading(true)
    try {
      const payload = formToApi({
        ...form,
        countryId: agentCountryId,
        ...(agentMode ? { agent: agentName, agentsPhoneNumber: agentPhoneNumber } : {}),
      })
      await updateMedication(editingId || form.id || id, payload)
      setSuccess('تم تحديث الدواء بنجاح')
      await loadDetails()
      setTimeout(closeModal, 800)
    } catch (err) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className={`medications-page medication-details-page ${agentMode ? 'agent-mode' : ''} ${!showCountry ? 'non-administrator' : ''}`}>
      <div className="page-header">
        <h2 className="page-title">تفاصيل الدواء</h2>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/medications')}>
          رجوع
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <div className="table-wrap">
        {detailsLoading ? (
          <p className="empty-state">جاري التحميل...</p>
        ) : detailsList.length === 0 ? (
          <p className="empty-state">لا توجد بيانات لهذا الدواء.</p>
        ) : (
          <table className="data-table medication-details-table">
            <thead>
              <tr>
                <th>الاسم التجاري</th>
                <th>الاسم العلمي</th>
                <th>الاستخدام</th>
                <th>الشركة</th>
                <th>الوكيل</th>
                <th>الشكل الصيدلاني</th>
                <th>السعر</th>
                <th>هاتف الوكيل</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {detailsList.map((row) => (
                <tr key={row.id ?? row.tradeName ?? row.TradeName}>
                  <td data-label="الاسم التجاري">{row.tradeName ?? row.TradeName}</td>
                  <td data-label="الاسم العلمي">{row.scientificName ?? row.ScientificName}</td>
                  <td data-label="الاستخدام">{row.usage ?? row.Usage}</td>
                  <td data-label="الشركة">{row.company ?? row.Company}</td>
                  <td data-label="الوكيل">{row.agent ?? row.Agent}</td>
                  <td data-label="الشكل الصيدلاني">{row.pharmaceuticalForm ?? row.PharmaceuticalForm}</td>
                  <td data-label="السعر">{row.price ?? row.Price}</td>
                  <td data-label="هاتف الوكيل">{row.agentsPhoneNumber ?? row.AgentsPhoneNumber}</td>
                  <td data-label="الإجراءات">
                    <div className="cell-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => handleEdit(row)}>
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

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeModal} aria-label="إغلاق">×</button>
            <h3>تعديل الدواء</h3>
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
                <div className="readonly-field">
                  {form.country === 1 ? 'فلسطين' : 'الأردن'}
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
              {success && <p className="success-msg">{success}</p>}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
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
              هل أنت متأكد من حذف الدواء
              {' '}
              {pendingDelete?.tradeName ?? pendingDelete?.TradeName}
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
