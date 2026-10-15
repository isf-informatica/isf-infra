import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { UserPlus, MoreVertical, X, MailCheck, AlertTriangle, Copy } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api.js'

const ROLES = ['Super Admin', 'Security Admin', 'Support Admin', 'Fraud Analyst']

const roleColors = {
  'Super Admin': 'bg-amber-500/10 text-amber-400',
  'Security Admin': 'bg-signal-500/10 text-signal-400',
  'Support Admin': 'bg-signal-500/10 text-signal-400',
  'Fraud Analyst': 'bg-mist-400/10 text-mist-300'
}

const statusColors = {
  Active: 'text-signal-400',
  Invited: 'text-amber-400'
}

const inputClass =
  'w-full px-3 py-2 bg-abyss-950 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 placeholder:text-mist-400 clip-facet-r'

export default function AdminUsersTable() {
  const [openMenu, setOpenMenu] = useState(null)
  // Admin accounts — GET/POST/PUT/DELETE /fortimates/admins
  const [adminUsers, setAdminUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'Support Admin' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  // invite / resend outcome: mail sent, or the credentials to share manually
  const [notice, setNotice] = useState(null)
  const [menuPos, setMenuPos] = useState(null)

  useEffect(() => {
    apiGet('/admins')
      .then(setAdminUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function invite(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // Creates the EasyReach login (Login ID = email + temporary password) and mails it
      const created = await apiPost('/admins', form)
      setAdminUsers((prev) => [...prev, created])
      setNotice(created)
      setForm({ name: '', email: '', role: 'Support Admin' })
      setShowInvite(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function changeRole(admin, role) {
    setError('')
    try {
      const updated = await apiPut(`/admins/${admin.id}`, { role })
      setAdminUsers((prev) => prev.map((a) => (a.id === admin.id ? updated : a)))
    } catch (err) {
      setError(err.message)
    } finally {
      setEditingId(null)
    }
  }

  async function resendInvite(admin) {
    setOpenMenu(null)
    const msg = admin.account_created
      ? `Send a new temporary password to ${admin.email}? The old password will stop working.`
      : `Send the invite email to ${admin.email} again?`
    if (!window.confirm(msg)) return
    setError('')
    try {
      const res = await apiPost(`/admins/${admin.id}/resend`)
      setNotice(res)
    } catch (err) {
      setError(err.message)
    }
  }

  function openRowMenu(e, admin) {
    if (openMenu === admin.id) {
      setOpenMenu(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 6, left: rect.right - 176 })
    setOpenMenu(admin.id)
  }

  async function removeAccess(admin) {
    setOpenMenu(null)
    if (!window.confirm(`Remove dashboard access for ${admin.name}?`)) return
    setError('')
    try {
      await apiDelete(`/admins/${admin.id}`)
      setAdminUsers((prev) => prev.filter((a) => a.id !== admin.id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="bg-facet-card border border-white/5 clip-facet overflow-hidden">
      <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-mist-100">Admin accounts</h3>
          <p className="text-xs text-mist-400 mt-1">People with access to this dashboard.</p>
        </div>
        <Button variant="primary" className="!py-2.5 !px-4 !text-xs" onClick={() => setShowInvite((v) => !v)}>
          {showInvite ? <X size={14} /> : <UserPlus size={14} />}
          {showInvite ? 'Cancel' : 'Invite Admin'}
        </Button>
      </div>

      {showInvite && (
        <form onSubmit={invite} className="px-6 pb-5 grid sm:grid-cols-4 gap-3 items-end">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
            className={inputClass}
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className={inputClass}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={inputClass}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <Button variant="primary" type="submit" disabled={saving} className="!py-2.5 !px-4 !text-xs justify-center">
            {saving ? 'Sending invite…' : 'Send invite'}
          </Button>
        </form>
      )}

      {error && <p className="px-6 pb-4 text-xs text-red-400">{error}</p>}

      {notice && (
        <div
          className="mx-6 mb-5 p-4 border text-xs"
          style={
            notice.email_sent
              ? { background: 'rgba(43,196,217,0.08)', borderColor: 'rgba(79,214,232,0.35)', color: '#DCE4F2' }
              : { background: 'rgba(245,174,14,0.08)', borderColor: 'rgba(245,174,14,0.4)', color: '#DCE4F2' }
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              {notice.email_sent ? (
                <MailCheck size={16} style={{ color: '#4FD6E8' }} className="shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} style={{ color: '#F5AE0E' }} className="shrink-0 mt-0.5" />
              )}
              <div>
                {notice.email_sent ? (
                  <p>
                    Invite email sent to <b>{notice.email}</b>
                    {notice.account_created ? ' with their Login ID and password.' : ' (they will use their existing EasyReach password).'}
                  </p>
                ) : (
                  <>
                    <p>
                      Access saved for <b>{notice.email}</b>, but the email could not be sent.
                    </p>
                    <p className="mt-1" style={{ color: '#AAB8D6' }}>{notice.email_error}</p>
                    {notice.temp_password && (
                      <div className="mt-3">
                        <p style={{ color: '#AAB8D6' }}>Share these login details manually — the password is shown only once:</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[13px]">
                          <span>Login ID: <b>{notice.email}</b></span>
                          <span>Password: <b style={{ color: '#F5AE0E' }}>{notice.temp_password}</b></span>
                          <button
                            onClick={() =>
                              navigator.clipboard?.writeText(`Login ID: ${notice.email}\nPassword: ${notice.temp_password}`)
                            }
                            className="flex items-center gap-1 font-sans text-xs hover:opacity-80"
                            style={{ color: '#4FD6E8' }}
                          >
                            <Copy size={13} /> Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <button onClick={() => setNotice(null)} className="shrink-0 hover:opacity-80" style={{ color: '#AAB8D6' }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-mist-400 border-t border-white/5">
              <th className="px-6 py-3 font-normal">Name</th>
              <th className="px-6 py-3 font-normal">Email</th>
              <th className="px-6 py-3 font-normal">Role</th>
              <th className="px-6 py-3 font-normal">Status</th>
              <th className="px-6 py-3 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-mist-400 text-sm">Loading admins…</td>
              </tr>
            )}
            {!loading && adminUsers.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-mist-400 text-sm">No admin accounts yet.</td>
              </tr>
            )}
            {adminUsers.map((admin) => (
              <tr key={admin.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-3.5 text-mist-100">{admin.name}</td>
                <td className="px-6 py-3.5 text-mist-400">{admin.email}</td>
                <td className="px-6 py-3.5">
                  {editingId === admin.id ? (
                    <select
                      autoFocus
                      defaultValue={admin.role}
                      onChange={(e) => changeRole(admin, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      className="px-2 py-1 bg-abyss-950 border border-white/10 text-xs text-mist-100 outline-none"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`px-2.5 py-1 text-xs clip-facet-r ${roleColors[admin.role] ?? roleColors['Fraud Analyst']}`}>
                      {admin.role}
                    </span>
                  )}
                </td>
                <td className={`px-6 py-3.5 text-xs font-medium ${statusColors[admin.status] ?? 'text-mist-400'}`}>
                  {admin.status}
                </td>
                <td className="px-6 py-3.5 text-right relative">
                  <button
                    onClick={(e) => openRowMenu(e, admin)}
                    className="text-mist-400 hover:text-mist-200"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenu === admin.id && menuPos && createPortal(
                    <>
                      {/* click outside closes the menu */}
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                    <div
                      className="fixed z-50 w-44 border border-white/10 text-left text-xs shadow-2xl"
                      style={{ top: menuPos.top, left: menuPos.left, background: '#0A1730' }}
                    >
                      <button
                        onClick={() => {
                          setOpenMenu(null)
                          setEditingId(admin.id)
                        }}
                        className="w-full px-4 py-2.5 text-mist-200 hover:bg-white/5 text-left"
                      >
                        Edit role
                      </button>
                      <button
                        onClick={() => resendInvite(admin)}
                        className="w-full px-4 py-2.5 text-mist-200 hover:bg-white/5 text-left"
                      >
                        {admin.account_created ? 'Resend invite (new password)' : 'Resend invite'}
                      </button>
                      <button
                        onClick={() => removeAccess(admin)}
                        className="w-full px-4 py-2.5 text-red-400 hover:bg-white/5 text-left"
                      >
                        Remove access
                      </button>
                    </div>
                    </>,
                    document.querySelector('.fm-root') ?? document.body
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}