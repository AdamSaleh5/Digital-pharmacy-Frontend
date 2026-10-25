import { useEffect, useState } from 'react'
import { createCountry, deleteCountry, getCountries, updateCountry } from '../api/countries'
import './Countries.css'

const countryRows = (response) => {
  const data = response?.data ?? response?.Data ?? response
  return Array.isArray(data) ? data : []
}

export default function Countries() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCountry, setEditingCountry] = useState(null)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadCountries = async () => {
    setLoading(true)
    try {
      setCountries(countryRows(await getCountries()))
    } catch (err) {
      setError(err.message || 'تعذر جلب قائمة الدول')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCountries() }, [])

  const openAdd = () => {
    setEditingCountry(null)
    setName('')
    setError('')
    setModalOpen(true)
  }

  const openEdit = (country) => {
    setEditingCountry(country)
    setName(country.name ?? country.Name ?? '')
    setError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (!submitting) {
      setModalOpen(false)
      setEditingCountry(null)
      setName('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      if (editingCountry) {
        await updateCountry(editingCountry.id ?? editingCountry.Id, name)
        setSuccess('تم تحديث الدولة بنجاح')
      } else {
        await createCountry(name)
        setSuccess('تمت إضافة الدولة بنجاح')
      }
      setModalOpen(false)
      await loadCountries()
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حفظ الدولة')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (country) => {
    const id = country.id ?? country.Id
    const countryName = country.name ?? country.Name ?? ''
    if (!window.confirm(`هل أنت متأكد من حذف دولة ${countryName}؟`)) return
    setError('')
    setSuccess('')
    setDeletingId(id)
    try {
      await deleteCountry(id)
      setSuccess('تم حذف الدولة بنجاح')
      await loadCountries()
    } catch (err) {
      setError(err.message || 'تعذر حذف الدولة')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="countries-page" dir="rtl">
      <div className="page-header">
        <h2 className="page-title">إدارة الدول</h2>
        <button type="button" className="btn btn-primary" onClick={openAdd}>+ إضافة دولة</button>
      </div>
      <p className="countries-description">إضافة الدول المتاحة وتعديلها أو حذفها.</p>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <div className="table-wrap">
        {loading ? <p className="empty-state">جاري تحميل الدول...</p> : countries.length === 0 ? (
          <p className="empty-state">لا توجد دول متاحة.</p>
        ) : (
          <table className="data-table">
            <thead><tr><th>المعرف</th><th>اسم الدولة</th><th aria-label="الإجراءات" /></tr></thead>
            <tbody>{countries.map((country) => {
              const id = country.id ?? country.Id
              return <tr key={id}><td>{id}</td><td>{country.name ?? country.Name}</td><td><div className="cell-actions">
                <button type="button" className="btn btn-secondary" onClick={() => openEdit(country)}>تعديل</button>
                <button type="button" className="btn btn-danger" onClick={() => handleDelete(country)} disabled={deletingId === id}>{deletingId === id ? 'جاري الحذف...' : 'حذف'}</button>
              </div></td></tr>
            })}</tbody>
          </table>
        )}
      </div>

      {modalOpen && <div className="modal-overlay" onClick={closeModal}>
        <div className="modal countries-modal" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="modal-close" onClick={closeModal} aria-label="إغلاق">×</button>
          <h3>{editingCountry ? 'تعديل الدولة' : 'إضافة دولة جديدة'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label htmlFor="country-name">اسم الدولة *</label>
              <input id="country-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="أدخل اسم الدولة" required autoFocus />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'جاري الحفظ...' : editingCountry ? 'حفظ التعديلات' : 'إضافة'}</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  )
}
