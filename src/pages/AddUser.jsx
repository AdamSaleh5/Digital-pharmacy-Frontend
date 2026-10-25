import { useEffect, useMemo, useState } from 'react'
import { createUser, deleteUser, getAllUsers, updateUser } from '../api/users'
import { getCountries } from '../api/countries'
import { getCurrentRole } from '../utils/permissions'
import './AddUser.css'

const emptyForm = () => ({
  name: '',
  phone: '',
  countryId: '',
})

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const getUserRows = (response) => {
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

const mapApiUser = (user, index) => ({
  id: user.id ?? user.Id ?? user.userId ?? user.UserId ?? index,
  name: user.name ?? user.Name ?? user.fullName ?? user.FullName ?? user.userName ?? user.UserName ?? '',
  phone: String(user.phone ?? user.Phone ?? user.phoneNumber ?? user.PhoneNumber ?? ''),
  code: user.activationCode ?? user.ActivationCode ?? user.code ?? user.Code ?? user.userCode ?? user.UserCode ?? '',
  role: Number(user.role ?? user.Role),
})

const generateCode = () => {
  const chars = Array.from({ length: 8 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)])
  return chars.join('')
}

const generateUniqueCode = (list) => {
  let code = generateCode()
  const used = new Set(list.map((item) => item.code))
  while (used.has(code)) {
    code = generateCode()
  }
  return code
}

const normalizePhone = (value) => value.replace(/[^\d]/g, '')

const isValidPhone = (value) => value.length === 10

export function UserManagement({ userRole = 4, pageTitle = 'إدارة المستخدمين', entityName = 'مستخدم' }) {
  const currentRole = getCurrentRole()
  const showCountry = currentRole === 'Administrator'
  const canResetDevice = ['Administrator', 'Admin'].includes(currentRole)
  const storedCountryId = sessionStorage.getItem('countryId')
  const adminCountryId = currentRole === 'Admin' && storedCountryId ? Number(storedCountryId) : null
  const assignedCountryId = Number.isFinite(adminCountryId) && adminCountryId >= 0 ? adminCountryId : 1
  const [country, setCountry] = useState('')
  const [countries, setCountries] = useState([])
  const [countriesLoading, setCountriesLoading] = useState(showCountry)
  const countryId = showCountry ? country : assignedCountryId
  const shouldIncludeCountry = currentRole === 'Admin' || showCountry
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [pendingCodeId, setPendingCodeId] = useState(null)
  const [currentCode, setCurrentCode] = useState('')
  const [pendingReset, setPendingReset] = useState(null)

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

    const loadUsers = async () => {
      if (showCountry && !countryId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const response = await getAllUsers(countryId)
        if (active) {
          setList(getUserRows(response)
            .map(mapApiUser)
            .filter((user) => Number.isNaN(user.role) || user.role === userRole))
        }
      } catch (err) {
        if (active) {
          setList([])
          setError(err.message || 'Unable to load users')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUsers()
    return () => { active = false }
  }, [countryId, showCountry])

  const existingPhoneUser = useMemo(() => {
    const phone = normalizePhone(form.phone)
    if (!phone) return null
    return list.find((row) => row.phone === phone && row.id !== editingId) || null
  }, [form.phone, list, editingId])

  const filteredList = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return list
    return list.filter((row) => (
      row.name.toLowerCase().includes(term)
      || row.phone.toLowerCase().includes(term)
    ))
  }, [list, search])

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm(), countryId: country })
    setModalOpen(true)
    setError('')
    setSuccess('')
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({ name: row.name, phone: row.phone, countryId: country })
    setModalOpen(true)
    setError('')
    setSuccess('')
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  const handleChange = (field, value) => {
    if (field === 'phone') {
      setForm((f) => ({ ...f, [field]: normalizePhone(value) }))
      return
    }
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitLoading(true)
    try {
      const name = form.name.trim()
      const phone = normalizePhone(form.phone)
      const selectedCountryId = showCountry ? Number(form.countryId) : countryId
      if (!name || !phone) {
        setError('يرجى تعبئة جميع الحقول المطلوبة')
        return
      }
      if (!isValidPhone(phone)) {
        setError('رقم الهاتف يجب أن يتكون من 10 أرقام')
        return
      }
      if (showCountry && !selectedCountryId) {
        setError('يرجى اختيار الدولة')
        return
      }
      if (existingPhoneUser) {
        setError(`رقم الهاتف موجود بالفعل لصاحب الاسم: ${existingPhoneUser.name}`)
        return
      }
      if (editingId) {
        const existingUser = list.find((row) => row.id === editingId)
        await updateUser(editingId, {
          name,
          phoneNumber: phone,
          role: userRole,
          activationCode: existingUser?.code || '',
          ...(shouldIncludeCountry ? { countryId: selectedCountryId } : {}),
        })
        setList((prev) => prev.map((row) => (
          row.id === editingId ? { ...row, name, phone } : row
        )))
        setSuccess(`تم تحديث ${entityName} بنجاح`)
      } else {
        const code = generateUniqueCode(list)
        const createdUser = await createUser({
          name,
          phoneNumber: phone,
          role: userRole,
          activationCode: code,
          ...(shouldIncludeCountry ? { countryId: selectedCountryId } : {}),
        })
        const newUser = mapApiUser(createdUser?.data ?? createdUser?.Data ?? createdUser, Date.now())
        if (!newUser.name) newUser.name = name
        if (!newUser.phone) newUser.phone = phone
        if (!newUser.code) newUser.code = code
        setList((prev) => [...prev, newUser])
        setSuccess(`تم إضافة ${entityName} بنجاح`)
        setPendingCodeId(newUser.id)
        setCurrentCode(code)
        setCodeModalOpen(true)
      }
      setTimeout(closeModal, 600)
    } catch (err) {
      setError(err.message || 'حدث خطأ')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = (row) => {
    setPendingDelete(row)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    const id = pendingDelete?.id
    if (id == null) {
      setConfirmOpen(false)
      setPendingDelete(null)
      return
    }

    setDeleteLoading(true)
    setError('')
    setSuccess('')
    try {
      await deleteUser(id)
      setList((prev) => prev.filter((row) => row.id !== id))
    setSuccess(`تم حذف ${entityName} بنجاح`)
      setConfirmOpen(false)
      setPendingDelete(null)
    } catch (err) {
      setError(err.message || 'فشل حذف المستخدم')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCopyCode = async () => {
    if (!currentCode) return
    try {
      await navigator.clipboard.writeText(currentCode)
      setSuccess('تم نسخ الكود')
    } catch (e) {
      setError('تعذر نسخ الكود')
    }
  }

  const handleChangeCode = async () => {
    if (!pendingCodeId) return
    const newCode = generateUniqueCode(list)
    const user = list.find((row) => row.id === pendingCodeId)
    if (!user) return

    setSubmitLoading(true)
    setError('')
    try {
      await updateUser(pendingCodeId, {
        name: user.name,
        phoneNumber: user.phone,
        role: userRole,
        activationCode: newCode,
        ...(shouldIncludeCountry ? { countryId } : {}),
      })
      setList((prev) => prev.map((row) => (
        row.id === pendingCodeId ? { ...row, code: newCode } : row
      )))
      setCurrentCode(newCode)
      setSuccess('تم تغيير الكود وحفظه')
    } catch (err) {
      setError(err.message || 'Unable to update user')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleRandomizeCodeForEdit = async () => {
    if (!editingId) return
    const newCode = generateUniqueCode(list)
    const user = list.find((row) => row.id === editingId)
    if (!user) return

    setSubmitLoading(true)
    setError('')
    try {
      await updateUser(editingId, {
        name: user.name,
        phoneNumber: user.phone,
        role: userRole,
        activationCode: newCode,
        ...(shouldIncludeCountry ? { countryId } : {}),
      })
      setList((prev) => prev.map((row) => (
        row.id === editingId ? { ...row, code: newCode } : row
      )))
      setSuccess('تم تغيير الكود')
    } catch (err) {
      setError(err.message || 'Unable to update user')
    } finally {
      setSubmitLoading(false)
    }
  }

  const confirmResetDevice = () => {
    // TODO: استدعاء API إعادة تعيين الجهاز عند توفره
    setPendingReset(null)
  }

  const closeCodeModal = () => {
    setCodeModalOpen(false)
    setPendingCodeId(null)
    setCurrentCode('')
  }

  return (
    <div className="add-user-page">
      <div className="page-header">
        <h2 className="page-title">{pageTitle}</h2>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          + إضافة {entityName}
        </button>
      </div>
      <p className="page-desc">إدارة قائمة المستخدمين من النظام.</p>

      <div className="users-search-bar">
        <div className="users-search-input-wrap">
          <span className="users-search-icon" aria-hidden>🔍</span>
          <input
          type="text"
          placeholder="البحث بالاسم أو الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="users-search-input"
          />
        </div>
        {showCountry && (
          <div className="users-search-filter">
            <label htmlFor="users-country">الدولة:</label>
            <select id="users-country" value={country} onChange={(event) => setCountry(Number(event.target.value))}>
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
          <p className="empty-state">جارٍ تحميل المستخدمين...</p>
        ) : filteredList.length === 0 ? (
          <p className="empty-state">لا توجد نتائج. أضف مستخدماً جديداً.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>الكود</th>
                <th aria-label="الإجراءات"></th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.phone}</td>
                  <td>
                    <span className="code-pill">{row.code}</span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => openEdit(row)}>
                        تعديل
                      </button>
                      {canResetDevice && (
                        <button type="button" className="btn btn-secondary" onClick={() => setPendingReset(row)}>
                          إعادة تعيين الجهاز
                        </button>
                      )}
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
            <h3>{editingId ? `تعديل ${entityName}` : `إضافة ${entityName}`}</h3>
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
                <label>رقم الهاتف *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                />
                {existingPhoneUser && (
                  <p className="info-msg">
                    الرقم موجود باسم: {existingPhoneUser.name} — الكود: {existingPhoneUser.code}
                  </p>
                )}
              </div>
              {showCountry && (
                <div className="form-group">
                  <label htmlFor="user-country">الدولة *</label>
                  <select
                    id="user-country"
                    value={form.countryId}
                    onChange={(event) => handleChange('countryId', Number(event.target.value))}
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
              {editingId ? (
                <div className="form-group">
                  <label>الكود</label>
                  <div className="readonly-field">{list.find((u) => u.id === editingId)?.code}</div>
                  <div className="code-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleRandomizeCodeForEdit} disabled={submitLoading}>
                      تغيير الكود
                    </button>
                  </div>
                </div>
              ) : (
                <p className="hint-text">سيتم توليد كود عشوائي تلقائياً عند الإضافة.</p>
              )}
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
              هل أنت متأكد من حذف المستخدم
              {' '}
              {pendingDelete?.name}
              ؟
            </p>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
                إلغاء
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleteLoading}>
                {deleteLoading ? 'جاري الحذف...' : 'نعم، حذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingReset && (
        <div className="modal-overlay" onClick={() => setPendingReset(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setPendingReset(null)} aria-label="إغلاق">×</button>
            <h3>إعادة تعيين الجهاز</h3>
            <p className="confirm-text">
              هل تريد السماح للمستخدم
              {' '}
              {pendingReset.name}
              {' '}
              بإعادة استخدام الكود على جهاز جديد؟
            </p>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setPendingReset(null)}>
                إلغاء
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmResetDevice}>
                موافق
              </button>
            </div>
          </div>
        </div>
      )}

      {codeModalOpen && (
        <div className="modal-overlay" onClick={closeCodeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeCodeModal} aria-label="إغلاق">×</button>
            <h3>كود المستخدم</h3>
            <div className="code-box">
              <span className="code-value">{currentCode}</span>
              <button type="button" className="btn btn-secondary" onClick={handleCopyCode}>
                نسخ
              </button>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={closeCodeModal}>
                إغلاق
              </button>
              <button type="button" className="btn btn-primary" onClick={handleChangeCode} disabled={submitLoading}>
                تغيير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AddUser() {
  return <UserManagement />
}
