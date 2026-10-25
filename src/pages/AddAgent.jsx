import { useEffect, useMemo, useState } from 'react'
import { createUser, deleteUser, getAllAgents, updateUser } from '../api/users'
import { getCountries } from '../api/countries'
import { getCurrentRole } from '../utils/permissions'
import './AddUser.css'
import './AddAgent.css'

const emptyForm = () => ({
  name: '',
  company: '',
  phone: '',
  email: '',
  password: '',
  countryId: '',
})

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const generateActivationCode = () => Array.from(
  { length: 8 },
  () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
).join('')

const getRows = (response) => {
  const data = response?.data ?? response?.Data ?? response
  if (Array.isArray(data)) return data
  return data?.items ?? data?.Items ?? data?.results ?? data?.Results ?? []
}

const normalizeCountries = (response) => {
  const data = response?.data ?? response?.Data ?? response
  const rows = Array.isArray(data)
    ? data
    : (data?.items ?? data?.Items ?? data?.results ?? data?.Results ?? [])

  return rows
    .map((item) => ({ value: item.id ?? item.Id, label: item.name ?? item.Name ?? '' }))
    .filter((item) => item.value != null && item.label)
}

const mapApiAgent = (agent, index) => ({
  id: agent.id ?? agent.Id ?? agent.userId ?? agent.UserId ?? index,
  name: agent.name ?? agent.Name ?? agent.fullName ?? agent.FullName ?? '',
  company: agent.company ?? agent.Company ?? agent.agentName ?? agent.AgentName ?? '',
  phone: String(agent.phone ?? agent.Phone ?? agent.phoneNumber ?? agent.PhoneNumber ?? ''),
  email: agent.email ?? agent.Email ?? '',
  password: agent.password ?? agent.Password ?? '',
  activationCode: agent.activationCode ?? agent.ActivationCode ?? '',
})

export default function AddAgent() {
  const currentRole = getCurrentRole()
  const showCountry = currentRole === 'Administrator'
  const [list, setList] = useState([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const storedCountryId = sessionStorage.getItem('countryId')
  const adminCountryId = currentRole === 'Admin' && storedCountryId ? Number(storedCountryId) : null
  const assignedCountryId = Number.isFinite(adminCountryId) && adminCountryId >= 0 ? adminCountryId : 2
  const [country, setCountry] = useState('')
  const [countries, setCountries] = useState([])
  const [countriesLoading, setCountriesLoading] = useState(showCountry)
  const countryId = showCountry ? country : assignedCountryId

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

  useEffect(() => {
    let active = true

    const loadAgents = async () => {
      if (showCountry && !countryId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const response = await getAllAgents(countryId)
        if (active) setList(getRows(response).map(mapApiAgent))
      } catch (err) {
        if (active) {
          setList([])
          setError(err.message || 'تعذر جلب الوكلاء')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadAgents()
    return () => { active = false }
  }, [countryId, showCountry])

  const filteredList = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return list
    return list.filter((agent) => [agent.name, agent.company, agent.phone, agent.email, agent.password]
      .some((value) => value.toLowerCase().includes(term)))
  }, [list, search])

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm(), countryId: country })
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const openEdit = (agent) => {
    setEditingId(agent.id)
    setForm({ name: agent.name, company: agent.company, phone: agent.phone, email: agent.email, password: agent.password, countryId: country })
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const agent = {
      name: form.name.trim(),
      company: form.company.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password,
    }
    const selectedCountryId = showCountry ? Number(form.countryId) : countryId

    if (!agent.name) {
      setError('يرجى إدخال اسم الوكيل')
      return
    }
    if (showCountry && !selectedCountryId) {
      setError('يرجى اختيار الدولة')
      return
    }

    if (editingId) {
      const existingAgent = list.find((item) => item.id === editingId)
      setSaving(true)
      setError('')
      try {
        await updateUser(editingId, {
          name: agent.name,
          phoneNumber: agent.phone,
          role: 3,
          activationCode: existingAgent?.activationCode || generateActivationCode(),
          email: agent.email,
          password: agent.password,
          agentName: agent.company,
          countryId: selectedCountryId,
        })
        setList((current) => current.map((item) => (item.id === editingId ? { ...item, ...agent } : item)))
        setSuccess('تم تحديث الوكيل بنجاح')
        setTimeout(closeModal, 500)
      } catch (err) {
        setError(err.message || 'تعذر تحديث الوكيل')
      } finally {
        setSaving(false)
      }
    } else {
      setSaving(true)
      setError('')
      try {
        const activationCode = generateActivationCode()
        await createUser({
          name: agent.name,
          phoneNumber: agent.phone,
          role: 3,
          activationCode,
          email: agent.email,
          password: agent.password,
          agentName: agent.company,
          countryId: selectedCountryId,
        })
        setList((current) => [...current, { id: Date.now(), activationCode, ...agent }])
        setSuccess('تم إضافة الوكيل بنجاح')
        setTimeout(closeModal, 500)
      } catch (err) {
        setError(err.message || 'تعذر إضافة الوكيل')
      } finally {
        setSaving(false)
      }
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setSaving(true)
    setError('')
    try {
      await deleteUser(pendingDelete.id)
      setList((current) => current.filter((agent) => agent.id !== pendingDelete.id))
      setSuccess('تم حذف الوكيل بنجاح')
      setPendingDelete(null)
      setConfirmOpen(false)
    } catch (err) {
      setError(err.message || 'تعذر حذف الوكيل')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="add-user-page add-agent-page">
      <div className="page-header">
        <h2 className="page-title">إدارة الوكلاء</h2>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          + إضافة وكيل
        </button>
      </div>
      <p className="page-desc">إدارة بيانات وكلاء الأدوية.</p>

      <div className="users-search-bar">
        <div className="users-search-input-wrap">
          <span className="users-search-icon" aria-hidden>🔍</span>
          <input
          type="text"
          placeholder="البحث بالاسم أو الشركة أو الهاتف..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="users-search-input"
          />
        </div>
        {showCountry && (
          <div className="users-search-filter">
            <label htmlFor="agents-country">الدولة:</label>
            <select id="agents-country" value={country} onChange={(event) => setCountry(Number(event.target.value))}>
              {countriesLoading && <option value="">جاري تحميل الدول...</option>}
              {!countriesLoading && countries.length === 0 && <option value="">لا توجد دول متاحة</option>}
              {countries.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <div className="table-wrap">
        {loading ? (
          <p className="empty-state">جارٍ تحميل الوكلاء...</p>
        ) : filteredList.length === 0 ? (
          <p className="empty-state">لا توجد وكلاء.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم الوكيل</th>
                <th>الشركة</th>
                <th>الهاتف</th>
                <th>البريد الإلكتروني</th>
                <th>كلمة المرور</th>
                <th aria-label="الإجراءات" />
              </tr>
            </thead>
            <tbody>
              {filteredList.map((agent) => (
                <tr key={agent.id}>
                  <td>{agent.name}</td>
                  <td>{agent.company || '-'}</td>
                  <td>{agent.phone || '-'}</td>
                  <td>{agent.email || '-'}</td>
                  <td>{agent.password || '-'}</td>
                  <td>
                    <div className="cell-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => openEdit(agent)}>تعديل</button>
                      <button type="button" className="btn btn-danger" onClick={() => { setPendingDelete(agent); setConfirmOpen(true) }}>حذف</button>
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
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeModal} aria-label="إغلاق">×</button>
            <h3>{editingId ? 'تعديل وكيل' : 'إضافة وكيل'}</h3>
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="form-group">
                <label>اسم الوكيل *</label>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              </div>
              <div className="form-group">
                <label>الشركة</label>
                <input value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>رقم الهاتف</label>
                <input type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input type="email" value={form.email} autoComplete="off" onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>كلمة المرور</label>
                <input type="password" value={form.password} autoComplete="new-password" onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
              </div>
              {showCountry && (
                <div className="form-group">
                  <label htmlFor="agent-country">الدولة *</label>
                  <select
                    id="agent-country"
                    value={form.countryId}
                    onChange={(event) => setForm((current) => ({ ...current, countryId: Number(event.target.value) }))}
                    disabled={countriesLoading || countries.length === 0}
                    required
                  >
                    <option value="">{countriesLoading ? 'جاري تحميل الدول...' : 'اختر الدولة'}</option>
                    {countries.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {error && <p className="error-msg">{error}</p>}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setConfirmOpen(false)} aria-label="إغلاق">×</button>
            <h3>تأكيد الحذف</h3>
            <p className="confirm-text">هل أنت متأكد من حذف الوكيل {pendingDelete?.name}؟</p>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>إلغاء</button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={saving}>{saving ? 'جارٍ الحذف...' : 'نعم، حذف'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
