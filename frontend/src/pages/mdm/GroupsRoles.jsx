import { useState, useEffect, useCallback } from 'react'
import Topbar from '../../components/common/Topbar'
import { getMdmUsers, setUserRole, getGroups, createGroup, deleteGroup, wipeGroup } from '../../api/mdmOps'
import { getAllSchools } from '../../api/schools'
import { getDevices } from '../../api/devices'

/* Same tokens as Login.jsx / MdmHub.jsx — kept identical so every page in the app matches. */
const INK = '#1A1A18'
const SUB = '#5C5C57'
const MUTED = '#8A8A85'

const C = {
  bgApp: '#E8E8E3',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F2EE',
  border: INK + '1F',
  borderStrong: INK + '3D',
  textPrimary: INK,
  textSecondary: SUB,
  textMuted: MUTED,
  brandFrom: INK,
  brandTo: '#3A3A36',
  systemBg: '#F2F2EE',
  systemBorder: INK + '3D',
  success: '#17B26A',
  successBg: '#ECFDF5',
  successBorder: '#A7E9C8',
  warning: '#8A6816',
  warningBg: '#FBF3E0',
  warningBorder: '#E7D39C',
  danger: '#8A2A2A',
  dangerBg: '#FBEAE9',
  dangerBorder: '#EFC4C1',
}

// LIVE — roles/groups wired to /easyreach/mdm/users and /easyreach/mdm/groups.

const ROLE_META = {
  'admin': {
    color: C.danger, bg: C.dangerBg, border: C.dangerBorder, icon: 'ti-shield-lock',
    desc: 'Full access — kill switch, all schools, user management',
    perms: [
      { label: 'Kill switch', on: true },
      { label: 'All schools', on: true },
      { label: 'User management', on: true },
    ],
  },
  'developer': {
    color: C.warning, bg: C.warningBg, border: C.warningBorder, icon: 'ti-code',
    desc: 'Same kill-switch access as admin — for ISF engineering team',
    perms: [
      { label: 'Kill switch', on: true },
      { label: 'All schools', on: true },
      { label: 'User management', on: false },
    ],
  },
  'school_admin': {
    color: C.brandFrom, bg: C.systemBg, border: C.systemBorder, icon: 'ti-building-community',
    desc: 'Default role — cannot use kill switch (admin/developer only, per backend)',
    perms: [
      { label: 'Kill switch', on: false },
      { label: 'Own school only', on: true },
      { label: 'User management', on: false },
    ],
  },
  'operator': {
    color: C.warning, bg: C.warningBg, border: C.warningBorder, icon: 'ti-tool',
    desc: 'Day-to-day operations — view devices, run allowed commands',
    perms: [
      { label: 'Kill switch', on: false },
      { label: 'Run commands', on: true },
      { label: 'User management', on: false },
    ],
  },
  'viewer': {
    color: MUTED, bg: C.surfaceAlt, border: C.border, icon: 'ti-eye',
    desc: 'Read-only — can view dashboards and reports',
    perms: [
      { label: 'Kill switch', on: false },
      { label: 'Read only', on: true },
      { label: 'User management', on: false },
    ],
  },
}

const roleMeta = (role) => ROLE_META[role] || ROLE_META['viewer']

export default function GroupsRoles() {
  const [tab, setTab] = useState('roles') // 'roles' | 'groups'
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState(Object.keys(ROLE_META))
  const [groups, setGroups] = useState([])
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [schools, setSchools] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [savingRole, setSavingRole] = useState(null)
  const [err, setErr] = useState('')

  const loadUsers = useCallback(async () => {
    try { const r = await getMdmUsers(); setUsers(r.data || []); if (r.roles) setRoles(r.roles) }
    catch (e) { console.error(e) }
  }, [])
  const loadGroups = useCallback(async () => {
    try { setGroups(await getGroups()) } catch (e) { console.error(e) }
  }, [])

  useEffect(() => {
    loadUsers(); loadGroups()
    getAllSchools().then(s => setSchools(Array.isArray(s) ? s : [])).catch(() => {})
  }, [loadUsers, loadGroups])

  const changeRole = async (userId, newRole) => {
    const prev = users
    setUsers(p => p.map(u => u.id === userId ? { ...u, role: newRole } : u))
    setSavingRole(userId); setErr('')
    try { await setUserRole(userId, newRole) }
    catch (e) { setUsers(prev); setErr(e?.response?.data?.detail || 'Could not change role (admin only)') }
    finally { setSavingRole(null) }
  }

  const removeGroup = async (id) => {
    if (!window.confirm('Delete this group?')) return
    await deleteGroup(id); loadGroups()
  }
  const doWipeGroup = async (g) => {
    if (!window.confirm(`Remote-wipe all ${g.members} device(s) in "${g.name}"? This cannot be undone.`)) return
    try { const r = await wipeGroup(g.id); alert(`Wipe queued for ${r.queued} device(s).`) }
    catch (e) { alert(e?.response?.data?.detail || 'Wipe failed (admin only).') }
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <Topbar C={C} />

      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>

        <div className="flex-1 px-7 py-7 max-w-5xl">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-[20px] font-extrabold uppercase tracking-tight" style={{ color: C.textPrimary }}>Group & Role-Based Management</h1>
              <p className="text-[13px] mt-1" style={{ color: C.textSecondary }}>Assign roles to users and organize systems into groups</p>
            </div>
            <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full"
              style={{ color: C.success, background: C.successBg, border: `1px solid ${C.successBorder}` }}>
              Live
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 mb-6">
            <button onClick={() => setTab('roles')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors"
              style={tab === 'roles'
                ? { background: C.textPrimary, color: '#fff' }
                : { background: C.surface, color: C.textSecondary, border: `1px solid ${C.border}` }}>
              <i className="ti ti-users-group text-[14px]" aria-hidden="true"></i> Roles
            </button>
            <button onClick={() => setTab('groups')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors"
              style={tab === 'groups'
                ? { background: C.textPrimary, color: '#fff' }
                : { background: C.surface, color: C.textSecondary, border: `1px solid ${C.border}` }}>
              <i className="ti ti-server-2 text-[14px]" aria-hidden="true"></i> Device Groups
            </button>
          </div>

          {tab === 'roles' && (
            <>
              {/* Role legend */}
              <div className="grid grid-cols-3 gap-4 mb-7">
                {Object.entries(ROLE_META).map(([role, meta]) => (
                  <div key={role} className="rounded-2xl p-5 flex flex-col transition-all duration-200"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 16px 32px -18px ${meta.color}55`; e.currentTarget.style.borderColor = meta.color + '55'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' }}>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                        <i className={`ti ${meta.icon} text-[18px]`} style={{ color: meta.color }} aria-hidden="true"></i>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                        {role}
                      </span>
                    </div>
                    <p className="text-[12px] mb-4 flex-1" style={{ color: C.textSecondary }}>{meta.desc}</p>
                    <div className="flex flex-col gap-1.5 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                      {meta.perms.map((p) => (
                        <div key={p.label} className="flex items-center gap-2 text-[11.5px] font-medium" style={{ color: p.on ? C.textPrimary : C.textMuted }}>
                          <i className={`ti ${p.on ? 'ti-circle-check-filled' : 'ti-circle-minus'} text-[13px] shrink-0`}
                            style={{ color: p.on ? meta.color : C.textMuted }} aria-hidden="true"></i>
                          {p.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Users list */}
              <div className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>Users</span>
                  <button disabled
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-not-allowed"
                    style={{ color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                    + Invite user
                  </button>
                </div>
                {err && <div className="px-5 py-2 text-[12px]" style={{ color: C.danger, background: C.dangerBg }}>{err}</div>}
                {!users.length && <div className="px-5 py-6 text-[12.5px]" style={{ color: C.textMuted }}>No users found</div>}
                {users.map((u) => {
                  const meta = roleMeta(u.role)
                  return (
                    <div key={u.id} className="flex items-center justify-between px-5 py-3.5 transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                          {(u.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>{u.name}</div>
                          <div className="text-[11.5px]" style={{ color: C.textMuted }}>{u.email} · {u.school || (u.schoolId ? `School #${u.schoolId}` : 'All schools')}</div>
                        </div>
                      </div>
                      <select
                        value={u.role}
                        disabled={savingRole === u.id}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="text-[12.5px] font-semibold px-3 py-1.5 rounded-full outline-none cursor-pointer"
                        style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, opacity: savingRole === u.id ? 0.6 : 1 }}
                      >
                        {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {tab === 'groups' && (
            <>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowNew(true)}
                  className="text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-colors"
                  style={{ color: '#fff', background: C.textPrimary }}>
                  + New group
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {!groups.length && <div className="text-[12.5px] px-1" style={{ color: C.textMuted }}>No device groups yet — create one to target wipes and policies at a set of systems.</div>}
                {groups.map((g) => {
                  const isOpen = expandedGroup === g.id
                  return (
                    <div key={g.id} className="rounded-2xl overflow-hidden transition-all duration-200"
                      style={{ background: C.surface, border: `1px solid ${isOpen ? C.borderStrong : C.border}`, boxShadow: isOpen ? '0 16px 32px -20px rgba(26,26,24,0.25)' : 'none' }}>
                      <button
                        onClick={() => setExpandedGroup(isOpen ? null : g.id)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = C.surfaceAlt }}
                        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
                            <i className="ti ti-server-2 text-[17px]" style={{ color: C.textPrimary }} aria-hidden="true"></i>
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>{g.name}</div>
                            <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{g.scope}{g.description ? ` · ${g.description}` : ''}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full" style={{ color: C.success, background: C.successBg, border: `1px solid ${C.successBorder}` }}>
                            {g.online}/{g.members} online
                          </span>
                          <i className="ti ti-chevron-down text-[16px] transition-transform duration-200"
                            style={{ color: C.textMuted, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} aria-hidden="true"></i>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4" style={{ borderTop: `1px solid ${C.border}`, background: C.surfaceAlt }}>
                          <div className="flex flex-col gap-2 py-3">
                            {(g.devices || []).map((d) => (
                              <div key={d.id} className="flex items-center gap-2 text-[12.5px]" style={{ color: C.textSecondary }}>
                                <i className={`ti ${d.type === 'server' ? 'ti-server' : 'ti-device-desktop'} text-[13px]`} style={{ color: d.online ? C.success : C.textMuted }} aria-hidden="true"></i>
                                {d.name} <span className="text-[10.5px]" style={{ color: d.online ? C.success : C.textMuted }}>· {d.online ? 'online' : 'offline'}</span>
                              </div>
                            ))}
                            {!(g.devices || []).length && <div className="text-[12px]" style={{ color: C.textMuted }}>No devices in this group</div>}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button onClick={() => doWipeGroup(g)}
                              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                              style={{ color: C.danger, background: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
                              <i className="ti ti-eraser text-[13px] mr-1" aria-hidden="true"></i> Remote wipe group
                            </button>
                            <button onClick={() => removeGroup(g.id)}
                              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                              style={{ color: C.textSecondary, background: C.surface, border: `1px solid ${C.border}` }}>
                              Delete group
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {showNew && (
        <NewGroupModal C={C} schools={schools} onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); loadGroups() }} />
      )}
    </div>
  )
}

function NewGroupModal({ C, schools, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [devices, setDevices] = useState({ server: [], systems: [] })
  const [picked, setPicked] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!schoolId) { setDevices({ server: [], systems: [] }); setPicked([]); return }
    getDevices(schoolId).then(d => setDevices(d || { server: [], systems: [] })).catch(() => {})
  }, [schoolId])

  const allDevs = [...(devices.server || []), ...(devices.systems || [])]
  const toggle = (id) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const submit = async () => {
    if (!name.trim()) { setError('Group name is required'); return }
    setBusy(true); setError('')
    try {
      await createGroup({ name: name.trim(), description: description.trim(), schoolId: schoolId || null, deviceIds: picked })
      onCreated()
    } catch (e) { setError(e?.response?.data?.detail || 'Could not create group (admin only)') }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(16,16,14,0.45)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div className="text-[15px] font-bold mb-4" style={{ color: C.textPrimary }}>New device group</div>
        <label className="text-[12px] font-semibold" style={{ color: C.textSecondary }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Computer Lab A"
          className="w-full mt-1 mb-3 px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textPrimary }} />
        <label className="text-[12px] font-semibold" style={{ color: C.textSecondary }}>Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="optional"
          className="w-full mt-1 mb-3 px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textPrimary }} />
        <label className="text-[12px] font-semibold" style={{ color: C.textSecondary }}>Institution</label>
        <select value={schoolId} onChange={e => setSchoolId(e.target.value)}
          className="w-full mt-1 mb-3 px-3 py-2 rounded-lg text-[13px] outline-none cursor-pointer" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textPrimary }}>
          <option value="">Select institution…</option>
          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {!!allDevs.length && (
          <div className="mb-3">
            <div className="text-[12px] font-semibold mb-1" style={{ color: C.textSecondary }}>Devices ({picked.length} selected)</div>
            <div className="max-h-40 overflow-y-auto rounded-lg" style={{ border: `1px solid ${C.border}` }}>
              {allDevs.map(d => (
                <label key={d.id} className="flex items-center gap-2 px-3 py-2 text-[12.5px] cursor-pointer" style={{ color: C.textPrimary, borderBottom: `1px solid ${C.border}` }}>
                  <input type="checkbox" checked={picked.includes(d.id)} onChange={() => toggle(d.id)} />
                  {d.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {error && <div className="text-[12px] mb-2" style={{ color: C.danger }}>{error}</div>}
        <div className="flex justify-end gap-2 mt-2">
          <button onClick={onClose} className="text-[12.5px] font-semibold px-4 py-2 rounded-lg" style={{ color: C.textSecondary, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>Cancel</button>
          <button onClick={submit} disabled={busy} className="text-[12.5px] font-semibold px-4 py-2 rounded-lg" style={{ color: '#fff', background: C.textPrimary, opacity: busy ? 0.6 : 1 }}>{busy ? 'Creating…' : 'Create group'}</button>
        </div>
      </div>
    </div>
  )
}