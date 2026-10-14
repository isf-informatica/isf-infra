import { useState } from 'react'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'

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

// ⚠️ MOCK DATA — no backend endpoints exist for roles/groups yet.
// Replace these with real API calls (e.g. api/mdm/roles.js, api/mdm/groups.js)
// once the backend files are shared and the DB tables/controllers are built.

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
}

const INITIAL_USERS = [
  { id: 1, name: 'Yash', email: 'yash@isf.com', role: 'admin', scope: 'All schools' },
  { id: 2, name: 'Shyam', email: 'shyam@isf.com', role: 'admin', scope: 'All schools' },
]

const INITIAL_GROUPS = [
  {
    id: 1,
    school: 'MBSE School',
    name: 'All MBSE Systems',
    systemCount: 3,
    systems: ['EasyLearningERP-SRV (server)', 'IOE-TNPLAB', 'DESKTOP-QK34H3A'],
  },
]

export default function GroupsRoles() {
  const [tab, setTab] = useState('roles') // 'roles' | 'groups'
  const [users, setUsers] = useState(INITIAL_USERS)
  const [groups] = useState(INITIAL_GROUPS)
  const [expandedGroup, setExpandedGroup] = useState(null)

  const changeRole = (userId, newRole) => {
    // TODO: call PATCH /easyreach/mdm/users/{id}/role once backend exists
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <Topbar C={C} />

      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 px-7 py-7 max-w-5xl">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-[20px] font-extrabold uppercase tracking-tight" style={{ color: C.textPrimary }}>Group & Role-Based Management</h1>
              <p className="text-[13px] mt-1" style={{ color: C.textSecondary }}>Assign roles to users and organize systems into groups</p>
            </div>
            <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full"
              style={{ color: C.warning, background: C.warningBg, border: `1px solid ${C.warningBorder}` }}>
              UI preview — not yet wired to backend
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
                {users.map((u) => {
                  const meta = ROLE_META[u.role]
                  return (
                    <div key={u.id} className="flex items-center justify-between px-5 py-3.5 transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>{u.name}</div>
                          <div className="text-[11.5px]" style={{ color: C.textMuted }}>{u.email} · {u.scope}</div>
                        </div>
                      </div>
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="text-[12.5px] font-semibold px-3 py-1.5 rounded-full outline-none cursor-pointer"
                        style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
                      >
                        {Object.keys(ROLE_META).map((r) => <option key={r} value={r}>{r}</option>)}
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
                <button disabled
                  className="text-[12.5px] font-semibold px-4 py-2 rounded-xl cursor-not-allowed"
                  style={{ color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                  + New group
                </button>
              </div>

              <div className="flex flex-col gap-3">
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
                            <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{g.school}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full" style={{ color: C.textPrimary, background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
                            {g.systemCount} systems
                          </span>
                          <i className="ti ti-chevron-down text-[16px] transition-transform duration-200"
                            style={{ color: C.textMuted, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} aria-hidden="true"></i>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 flex flex-col gap-2" style={{ borderTop: `1px solid ${C.border}`, background: C.surfaceAlt }}>
                          {g.systems.map((s) => (
                            <div key={s} className="flex items-center gap-2 text-[12.5px] pt-3" style={{ color: C.textSecondary }}>
                              <i className="ti ti-device-desktop text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
                              {s}
                            </div>
                          ))}
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
    </div>
  )
}