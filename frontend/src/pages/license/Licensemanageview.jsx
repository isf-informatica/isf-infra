import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLicenses, updateLicense, deleteLicense } from '../../api/license'

const INK = '#1A1A18'
const SUB = '#5C5C57'
const BG = '#E8E8E3'

const STATUS_COLOR = {
  active: '#1F7A3D',
  expired: '#8A2A2A',
  suspended: '#8A6D1A',
  revoked: '#5C5C57',
}

export default function LicenseManageView() {
  const navigate = useNavigate()
  const [licenses, setLicenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getLicenses()
      .then(setLicenses)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return licenses.filter(l => {
      const matchesStatus = !statusFilter || l.status === statusFilter
      const matchesType = !typeFilter || l.organization_type === typeFilter
      const matchesSearch = !term ||
        l.license_key.toLowerCase().includes(term) ||
        (l.organization_name && l.organization_name.toLowerCase().includes(term))
      return matchesStatus && matchesType && matchesSearch
    })
  }, [licenses, statusFilter, typeFilter, search])

  const openEdit = (l) => setEditing({ ...l })

  const saveEdit = async () => {
    setSaving(true)
    try {
      await updateLicense(editing.id, {
        status: editing.status,
        max_students: Number(editing.max_students),
        max_mentors: Number(editing.max_mentors),
        max_classrooms: Number(editing.max_classrooms),
        notes: editing.notes,
      })
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('This will permanently delete the license. Continue?')) return
    try {
      await deleteLicense(id)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="p-8" style={{ background: BG, minHeight: '100%' }}>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-extrabold uppercase tracking-tight" style={{ color: INK }}>
            <i className="ti ti-list-details mr-2" aria-hidden="true"></i>Manage Licenses
          </h2>
          <p className="text-sm mt-1.5" style={{ color: SUB }}>View, edit, and manage all license keys</p>
        </div>
        <button onClick={() => navigate('/license/generate')} className="px-4 py-2.5 text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: INK }}>
          <i className="ti ti-plus text-[15px]" aria-hidden="true"></i>Generate New
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 text-[13px] border" style={{ background: '#FDECEC', borderColor: '#E8A5A5', color: '#8A2A2A' }}>
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <select className="px-3.5 py-2.5 text-sm border outline-none" style={{ borderColor: INK + '33', color: INK }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
          <option value="revoked">Revoked</option>
        </select>
        <select className="px-3.5 py-2.5 text-sm border outline-none" style={{ borderColor: INK + '33', color: INK }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="School">School</option>
          <option value="College">College</option>
          <option value="University">University</option>
          <option value="Enterprise">Enterprise</option>
        </select>
        <input
          className="md:col-span-2 px-3.5 py-2.5 text-sm border outline-none"
          style={{ borderColor: INK + '33', color: INK }}
          placeholder="Search by license key or organization..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white border overflow-x-auto" style={{ borderColor: INK + '1A' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: INK + '1A' }}>
              {['ID', 'License Key', 'Organization', 'Type', 'Capacity', 'Subscription', 'Expires', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 font-semibold uppercase tracking-wide text-[11px]" style={{ color: SUB }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="9" className="text-center py-8" style={{ color: SUB }}>Loading licenses…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan="9" className="text-center py-8" style={{ color: SUB }}>No licenses found</td></tr>
            )}
            {!loading && filtered.map(l => (
              <tr key={l.id} className="border-b" style={{ borderColor: INK + '0D' }}>
                <td className="px-4 py-3" style={{ color: INK }}>{l.id}</td>
                <td className="px-4 py-3 font-mono" style={{ color: INK }}>{l.license_key}</td>
                <td className="px-4 py-3" style={{ color: INK }}>{l.organization_name || <em style={{ color: SUB }}>Not Assigned</em>}</td>
                <td className="px-4 py-3" style={{ color: SUB }}>{l.organization_type || 'N/A'}</td>
                <td className="px-4 py-3" style={{ color: SUB }}>
                  S: {l.max_students || 0} | M: {l.max_mentors || 0} | C: {l.max_classrooms || 0}
                </td>
                <td className="px-4 py-3" style={{ color: SUB }}>{l.subscription_type || 'N/A'}</td>
                <td className="px-4 py-3" style={{ color: SUB }}>{l.subscription_end_date || 'N/A'}</td>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-bold uppercase px-2 py-1" style={{ color: '#fff', background: STATUS_COLOR[l.status] || SUB }}>{l.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(l)} title="Edit" style={{ color: INK }}><i className="ti ti-edit"></i></button>
                    <button onClick={() => handleDelete(l.id)} title="Delete" style={{ color: '#8A2A2A' }}><i className="ti ti-trash"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#00000066' }} onClick={() => setEditing(null)}>
          <div className="bg-white w-full max-w-lg p-6" style={{ borderColor: INK + '1A' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-[15px] font-bold mb-4" style={{ color: INK }}>Edit License</h3>
            <p className="text-[12px] font-mono mb-4" style={{ color: SUB }}>{editing.license_key}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[12.5px] font-semibold mb-1" style={{ color: INK }}>Status</label>
                <select className="w-full px-3 py-2 text-sm border outline-none" style={{ borderColor: INK + '33', color: INK }}
                  value={editing.status} onChange={e => setEditing(v => ({ ...v, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold mb-1" style={{ color: INK }}>Max Students</label>
                <input type="number" className="w-full px-3 py-2 text-sm border outline-none" style={{ borderColor: INK + '33', color: INK }}
                  value={editing.max_students} onChange={e => setEditing(v => ({ ...v, max_students: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold mb-1" style={{ color: INK }}>Max Mentors</label>
                <input type="number" className="w-full px-3 py-2 text-sm border outline-none" style={{ borderColor: INK + '33', color: INK }}
                  value={editing.max_mentors} onChange={e => setEditing(v => ({ ...v, max_mentors: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold mb-1" style={{ color: INK }}>Max Classrooms</label>
                <input type="number" className="w-full px-3 py-2 text-sm border outline-none" style={{ borderColor: INK + '33', color: INK }}
                  value={editing.max_classrooms} onChange={e => setEditing(v => ({ ...v, max_classrooms: e.target.value }))} />
              </div>
            </div>

            <label className="block text-[12.5px] font-semibold mb-1" style={{ color: INK }}>Notes</label>
            <textarea rows="3" className="w-full px-3 py-2 text-sm border outline-none mb-5" style={{ borderColor: INK + '33', color: INK }}
              value={editing.notes || ''} onChange={e => setEditing(v => ({ ...v, notes: e.target.value }))} />

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-[13px] font-semibold border" style={{ borderColor: INK + '33', color: INK }}>Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60" style={{ background: INK }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}