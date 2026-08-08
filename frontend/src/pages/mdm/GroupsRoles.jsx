import { useState } from 'react'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'

/* Same tokens as Dashboard.jsx — kept identical so every page in the app matches. */
const C = {
  bgApp: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E4E9F2',
  textPrimary: '#101828',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  brandFrom: '#3B6FE0',
  brandTo: '#16B8A6',
  systemBg: '#EDF3FF',
  systemBorder: '#D8E6FF',
  success: '#17B26A',
  successBg: '#ECFDF5',
  successBorder: '#A7E9C8',
  warning: '#F79420',
  warningBg: '#FFF7EB',
  warningBorder: '#FDDDA8',
  danger: '#E4483C',
  dangerBg: '#FEF1F0',
  dangerBorder: '#FBD5D2',
}

// ⚠️ MOCK DATA — no backend endpoints exist for roles/groups yet.
// Replace these with real API calls (e.g. api/mdm/roles.js, api/mdm/groups.js)
// once the backend files are shared and the DB tables/controllers are built.

const ROLE_META = {
  'admin': { color: C.danger, bg: C.dangerBg, border: C.dangerBorder, desc: 'Full access — kill switch, all schools, user management' },
  'developer': { color: C.warning, bg: C.warningBg, border: C.warningBorder, desc: 'Same kill-switch access as admin — for ISF engineering team' },
  'school_admin': { color: C.brandFrom, bg: C.systemBg, border: C.systemBorder, desc: 'Default role — cannot use kill switch (admin/developer only, per backend)' },
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
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      <Topbar C={C} />

      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 px-7 py-7 max-w-5xl">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-[20px] font-semibold" style={{ color: C.textPrimary }}>Group & Role-Based Management</h1>
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
              className="px-4 py-2 rounded-xl text-[13px] font-semibold"
              style={tab === 'roles'
                ? { background: C.textPrimary, color: '#fff' }
                : { background: C.surface, color: C.textSecondary, border: `1px solid ${C.border}` }}>
              Roles
            </button>
            <button onClick={() => setTab('groups')}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold"
              style={tab === 'groups'
                ? { background: C.textPrimary, color: '#fff' }
                : { background: C.surface, color: C.textSecondary, border: `1px solid ${C.border}` }}>
              Device Groups
            </button>
          </div>

          {tab === 'roles' && (
            <>
              {/* Role legend */}
              <div className="grid grid-cols-3 gap-4 mb-7">
                {Object.entries(ROLE_META).map(([role, meta]) => (
                  <div key={role} className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <span className="inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2"
                      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                      {role}
                    </span>
                    <p className="text-[12px]" style={{ color: C.textSecondary }}>{meta.desc}</p>
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
                    <div key={u.id} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.border}` }}>
                      <div>
                        <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>{u.name}</div>
                        <div className="text-[11.5px]" style={{ color: C.textMuted }}>{u.email} · {u.scope}</div>
                      </div>
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg outline-none cursor-pointer"
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
                    <div key={g.id} className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                      <button
                        onClick={() => setExpandedGroup(isOpen ? null : g.id)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left"
                      >
                        <div>
                          <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>{g.name}</div>
                          <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{g.school} · {g.systemCount} systems</div>
                        </div>
                        <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} text-[16px]`} style={{ color: C.textMuted }} aria-hidden="true"></i>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 flex flex-col gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
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