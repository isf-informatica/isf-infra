import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'

/* Same base tokens as Dashboard.jsx / Login.jsx — kept identical so the page
   shell (background, text, buttons) still matches the rest of the app.
   Category headers get their own accent colour + gradient for a glass card look. */
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
  warning: '#8A6816',
  warningBg: '#FBF3E0',
  warningBorder: '#E7D39C',
}

// Glass-card treatment tokens — additive only, no change to C.bgApp or C.surface
// so the rest of the app shell is untouched.
const GLASS = {
  cardBg: 'rgba(255,255,255,0.62)',
  cardBgSoon: 'rgba(255,255,255,0.42)',
  cardBorder: 'rgba(255,255,255,0.85)',
  cardBorderSoon: 'rgba(26,26,24,0.08)',
  shadow: '0 1px 1px rgba(26,26,24,0.04), 0 16px 32px -18px rgba(26,26,24,0.22)',
  shadowHover: '0 1px 1px rgba(26,26,24,0.05), 0 28px 48px -18px rgba(26,26,24,0.30)',
}

// `features` lists ONLY the sub-capabilities that actually exist today —
// nothing planned or missing is mentioned inside the card. A category with
// an empty features list is fully "planned" (nothing built yet).
const CATEGORIES = [
  {
    key: 'enrollment',
    title: 'Device Enrollment & Provisioning',
    icon: 'ti-plug-connected',
    accent: '#3B6FE0',
    gradient: 'linear-gradient(135deg, #3B6FE0, #16B8A6)',
    path: '/mdm/enrollment',
    features: ['Add device', 'List devices', 'Delete device', 'Agent installer ZIP generator'],
  },
  {
    key: 'remote-management',
    title: 'Remote Device Management',
    icon: 'ti-device-desktop-analytics',
    accent: '#7C5CFC',
    gradient: 'linear-gradient(135deg, #7C5CFC, #A78BFA)',
    path: '/mdm/remote-management',
    features: ['Network info', 'Disk info', 'Process list', 'Restart / Shutdown', 'Lock device', 'Run script'],
  },
  {
    key: 'app-management',
    title: 'App Management',
    icon: 'ti-apps',
    accent: '#F79420',
    gradient: 'linear-gradient(135deg, #F79420, #F7B733)',
    path: null,
    features: [],
  },
  {
    key: 'policy-management',
    title: 'Policy Management',
    icon: 'ti-shield-check',
    accent: '#17B26A',
    gradient: 'linear-gradient(135deg, #17B26A, #6EE7B7)',
    path: null,
    features: [],
  },
  {
    key: 'groups-roles',
    title: 'Group & Role-Based Management',
    icon: 'ti-users-group',
    accent: '#E4483C',
    gradient: 'linear-gradient(135deg, #E4483C, #F5766D)',
    path: '/mdm/groups-roles',
    features: ['Role assignment (UI preview)', 'Device grouping (UI preview)'],
  },
  {
    key: 'hardware-security',
    title: 'Data Security & Hardware Restriction',
    icon: 'ti-lock',
    accent: INK,
    gradient: `linear-gradient(135deg, ${INK}, #475467)`,
    path: '/schools/1/kill',
    features: ['Kill Switch — Level 1 / 2 / 3', 'Restore from Kill Switch'],
  },
  {
    key: 'geofencing',
    title: 'Geofencing & Location Tracking',
    icon: 'ti-map-pin',
    accent: '#16B8A6',
    gradient: 'linear-gradient(135deg, #16B8A6, #3B6FE0)',
    path: '/mdm/geofencing',
    features: ['IP-based location (approximate)', 'Manual location correction'],
  },
  {
    key: 'content-publishing',
    title: 'Content Publishing',
    icon: 'ti-upload',
    accent: '#A78BFA',
    gradient: 'linear-gradient(135deg, #A78BFA, #7C5CFC)',
    path: null,
    features: [],
  },
  {
    key: 'secure-browser',
    title: 'Secure Browser',
    icon: 'ti-world',
    accent: '#F5766D',
    gradient: 'linear-gradient(135deg, #F5766D, #E4483C)',
    path: null,
    features: [],
  },
  {
    key: 'reports',
    title: 'Real-Time Reports & Identity',
    icon: 'ti-chart-bar',
    accent: '#17B26A',
    gradient: 'linear-gradient(135deg, #6EE7B7, #17B26A)',
    path: '/mdm/reports',
    features: ['Total institutions count', 'Active / Pending / Killed counts'],
  },
]

export default function MdmHub() {
  const navigate = useNavigate()
  const liveCount = CATEGORIES.filter(c => c.features.length > 0).length

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <Topbar C={C} />

      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 px-7 py-7">
          <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: C.textPrimary }}>MDM software</h1>
              <p className="text-[13px] mt-1.5" style={{ color: C.textSecondary }}>Choose a category to manage</p>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${C.border}`, color: C.textSecondary, backdropFilter: 'blur(6px)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#17B26A' }} />
              {liveCount} of {CATEGORIES.length} modules live
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {CATEGORIES.map((cat) => {
              const built = cat.features.length > 0

              return (
                <div key={cat.key}
                  className="group rounded-[26px] overflow-hidden flex flex-col transition-all duration-300 ease-out"
                  style={{
                    background: built ? GLASS.cardBg : GLASS.cardBgSoon,
                    border: `1px solid ${built ? cat.accent + '40' : GLASS.cardBorderSoon}`,
                    boxShadow: GLASS.shadow,
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    transform: 'translateY(0)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = built ? `0 1px 1px rgba(26,26,24,0.05), 0 30px 50px -16px ${cat.accent}55` : GLASS.shadowHover
                    e.currentTarget.style.transform = 'translateY(-5px)'
                    e.currentTarget.style.borderColor = built ? cat.accent + '80' : 'rgba(26,26,24,0.14)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = GLASS.shadow
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = built ? cat.accent + '40' : GLASS.cardBorderSoon
                  }}>

                  {/* Glass header */}
                  <div className="h-32 flex items-center justify-center relative overflow-hidden"
                    style={{ background: built ? cat.gradient : 'transparent' }}>

                    {built ? (
                      <>
                        <div className="pointer-events-none absolute -inset-x-4 -top-10 h-24 rotate-[-8deg]"
                          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0))' }} />
                        <div className="pointer-events-none absolute inset-0 opacity-[0.5]"
                          style={{ backgroundImage: `radial-gradient(#FFFFFF20 1px, transparent 1px)`, backgroundSize: '18px 18px' }} />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
                          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.35))' }} />
                      </>
                    ) : (
                      <>
                        <div className="pointer-events-none absolute inset-0 opacity-40"
                          style={{ backgroundImage: `radial-gradient(${INK}12 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-px"
                          style={{ background: `linear-gradient(90deg, transparent, ${INK}14, transparent)` }} />
                      </>
                    )}

                    <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                      style={
                        built
                          ? { background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 8px 20px -8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)' }
                          : { background: cat.accent + '14', border: `1px dashed ${cat.accent}50`, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }
                      }>
                      <i className={`ti ${cat.icon} text-[26px]`} style={{ color: built ? '#fff' : cat.accent + 'B0' }} aria-hidden="true"></i>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1 relative"
                    style={{
                      background: built ? 'rgba(255,255,255,0.35)' : 'transparent',
                      borderTop: `1px solid ${built ? 'rgba(255,255,255,0.6)' : GLASS.cardBorderSoon}`,
                    }}>
                    <div className="flex items-start justify-between gap-2 mb-3.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {built && <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: cat.accent }} />}
                        <div className="text-[14.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{cat.title}</div>
                      </div>
                      {!built && (
                        <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                          style={{ color: C.textMuted, background: 'rgba(255,255,255,0.6)', border: `1px solid ${C.border}`, backdropFilter: 'blur(6px)' }}>
                          Soon
                        </span>
                      )}
                      {built && (
                        <span className="shrink-0 text-[9.5px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: cat.accent, background: cat.accent + '14', border: `1px solid ${cat.accent}30` }}>
                          {cat.features.length}
                        </span>
                      )}
                    </div>

                    {built ? (
                      <ul className="flex flex-col gap-1 mb-4 flex-1">
                        {cat.features.map((f) => (
                          <li key={f} className="flex items-center gap-1.5 text-[11.5px] font-medium px-2 py-[5px] rounded-lg transition-colors duration-200"
                            style={{ color: C.textPrimary, background: cat.accent + '0D' }}>
                            <i className="ti ti-check text-[11px] shrink-0" style={{ color: cat.accent }} aria-hidden="true"></i>
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[12px] mb-4 flex-1" style={{ color: C.textMuted }}>Not built yet.</p>
                    )}

                    <button
                      onClick={() => built && navigate(cat.path)}
                      disabled={!built}
                      className="w-full py-2.5 rounded-xl text-[12.5px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200"
                      style={
                        built
                          ? { background: cat.gradient, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 10px 20px -10px ${cat.accent}88` }
                          : { background: 'rgba(255,255,255,0.5)', color: cat.accent, border: `1px solid ${cat.accent}40`, cursor: 'not-allowed', backdropFilter: 'blur(6px)' }
                      }
                      onMouseEnter={e => { if (built) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                      onMouseLeave={e => { if (built) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' } }}>
                      {built ? 'View' : <><i className="ti ti-clock text-[12px]" aria-hidden="true"></i> Coming soon</>}
                      {built && <i className="ti ti-arrow-right text-[13px]" aria-hidden="true"></i>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}