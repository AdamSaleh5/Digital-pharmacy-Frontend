import { useEffect, useMemo, useState } from 'react'
import { createUser, deleteUser, getAllAdmins, updateUser } from '../api/users'
import { getCountries } from '../api/countries'
import './AddUser.css'
import './AddAgent.css'
import './AddAdmin.css'

const emptyForm = () => ({ name: '', phone: '', email: '', password: '', countryId: '' })

const getRows = (response) => {
  const data = response?.data ?? response?.Data ?? response
  return Array.isArray(data) ? data : (data?.items ?? data?.Items ?? data?.results ?? data?.Results ?? [])
}

const normalizeCountries = (response) => getRows(response)
  .map((item) => ({ value: item.id ?? item.Id, label: item.name ?? item.Name ?? '' }))
  .filter((item) => item.value != null && item.label)

const mapApiAdmin = (admin, index) => ({
  id: admin.id ?? admin.Id ?? admin.userId ?? admin.UserId ?? index,
  role: Number(admin.role ?? admin.Role ?? admin.userType ?? admin.UserType),
  name: admin.name ?? admin.Name ?? admin.fullName ?? admin.FullName ?? '',
  phone: String(admin.phone ?? admin.Phone ?? admin.phoneNumber ?? admin.PhoneNumber ?? ''),
  email: admin.email ?? admin.Email ?? '',
  password: admin.password ?? admin.Password ?? '',
  countryId: admin.countryId ?? admin.CountryId ?? '',
  activationCode: admin.activationCode ?? admin.ActivationCode ?? '',
})

export default function AddAdmin() {
  const [list, setList] = useState([])
  const [countries, setCountries] = useState([])
  const [country, setCountry] = useState('')
  const [countriesLoading, setCountriesLoading] = useState(true)
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

  useEffect(() => {
    let active = true
    getCountries().then((response) => {
      if (!active) return
      const options = normalizeCountries(response)
      setCountries(options)
      setCountry(String(options[0]?.value ?? ''))
    }).catch((err) => active && setError(err.message || 'تعذر جلب قائمة الدول'))
      .finally(() => active && setCountriesLoading(false))
    return () => { active = false }
  }, [])

  const loadAdmins = async () => {
    if (!country) {
      setList([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      setList(getRows(await getAllAdmins(country)).map(mapApiAdmin))
    } catch (err) {
      setList([])
      setError(err.message || 'تعذر جلب المدراء')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAdmins() }, [country])

  const filteredList = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? list.filter((admin) => [admin.name, admin.phone, admin.email].some((value) => value.toLowerCase().includes(term))) : list
  }, [list, search])

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingId(null)
    setForm({ ...emptyForm(), countryId: String(countries[0]?.value ?? country ?? '') })
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm())
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const openEdit = (admin) => {
    setEditingId(admin.id)
    setForm({ name: admin.name, phone: admin.phone, email: admin.email, password: admin.password, countryId: admin.countryId ?? country })
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const payload = () => ({
    name: form.name.trim(), phoneNumber: form.phone.trim(), role: 2, activationCode: null,
    email: form.email.trim(), password: form.password, agentName: null, countryId: Number(form.countryId),
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.countryId) {
      setError('يرجى إدخال الاسم واختيار الدولة')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await updateUser(editingId, payload())
        setSuccess('تم تحديث الأدمن بنجاح')
      } else {
        await createUser(payload())
        setSuccess('تمت إضافة الأدمن بنجاح')
      }
      setModalOpen(false)
      await loadAdmins()
    } catch (err) {
      setError(err.message || 'تعذر حفظ بيانات الأدمن')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setSaving(true)
    setError('')
    try {
      await deleteUser(pendingDelete.id)
      setSuccess('تم حذف الأدمن بنجاح')
      setConfirmOpen(false)
      setPendingDelete(null)
      await loadAdmins()
    } catch (err) {
      setError(err.message || 'تعذر حذف الأدمن')
    } finally {
      setSaving(false)
    }
  }

  return <div className="add-user-page add-agent-page add-admin-page" dir="rtl">
    <div className="page-header"><h2 className="page-title">إدارة الأدمن</h2><button type="button" className="btn btn-primary" onClick={openAdd}>+ إضافة أدمن</button></div>
    <p className="page-desc">إضافة وتعديل وحذف مدراء النظام.</p>
    <div className="users-search-bar">
    <div className="users-search-input-wrap"><span className="users-search-icon" aria-hidden>🔍</span><input type="text" className="users-search-input" placeholder="البحث بالاسم أو الهاتف أو البريد..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <div className="users-search-filter"><label htmlFor="admins-country">الدولة:</label><select id="admins-country" value={country} onChange={(event) => setCountry(event.target.value)} disabled={countriesLoading}>{countriesLoading ? <option>جاري تحميل الدول...</option> : <><option value="">اختر الدولة</option>{countries.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</>}</select></div>
    </div>
    {error && <p className="error-msg">{error}</p>}{success && <p className="success-msg">{success}</p>}
    <div className="table-wrap">{loading ? <p className="empty-state">جاري تحميل المدراء...</p> : filteredList.length === 0 ? <p className="empty-state">لا يوجد أدمن.</p> : <table className="data-table"><thead><tr><th>الاسم</th><th>الهاتف</th><th>البريد الإلكتروني</th><th>كلمة المرور</th><th aria-label="الإجراءات" /></tr></thead><tbody>{filteredList.map((admin) => <tr key={admin.id}><td>{admin.name}</td><td>{admin.phone || '-'}</td><td>{admin.email || '-'}</td><td>{admin.password || '-'}</td><td><div className="cell-actions"><button type="button" className="btn btn-secondary" onClick={() => openEdit(admin)}>تعديل</button><button type="button" className="btn btn-danger" onClick={() => { setPendingDelete(admin); setConfirmOpen(true) }}>حذف</button></div></td></tr>)}</tbody></table>}</div>
    {modalOpen && <div className="modal-overlay" onClick={closeModal}><div className="modal" onClick={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={closeModal} aria-label="إغلاق">×</button><h3>{editingId ? 'تعديل أدمن' : 'إضافة أدمن'}</h3><form onSubmit={handleSubmit} autoComplete="off">
      <div className="form-group"><label>اسم الأدمن *</label><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></div>
      <div className="form-group"><label>رقم الهاتف</label><input type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></div>
      <div className="form-group"><label>البريد الإلكتروني</label><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></div>
      <div className="form-group"><label>كلمة المرور</label><input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /></div>
      <div className="form-group"><label htmlFor="admin-country">الدولة *</label><select id="admin-country" value={form.countryId} onChange={(event) => setForm((current) => ({ ...current, countryId: event.target.value }))} disabled={countriesLoading} required><option value="">اختر الدولة</option>{countries.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      {error && <p className="error-msg">{error}</p>}<div className="form-actions"><button type="button" className="btn btn-secondary" onClick={closeModal}>إلغاء</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة'}</button></div>
    </form></div></div>}
    {confirmOpen && <div className="modal-overlay" onClick={() => !saving && setConfirmOpen(false)}><div className="modal" onClick={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setConfirmOpen(false)} aria-label="إغلاق">×</button><h3>تأكيد الحذف</h3><p className="confirm-text">هل أنت متأكد من حذف الأدمن {pendingDelete?.name}؟</p><div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>إلغاء</button><button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={saving}>{saving ? 'جاري الحذف...' : 'نعم، حذف'}</button></div></div></div>}
  </div>
}
