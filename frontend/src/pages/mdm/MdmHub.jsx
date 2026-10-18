import { useNavigate } from 'react-router-dom'
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

// `features` lists ONLY the sub-capabilities that actually exist today —
// nothing planned or missing is mentioned inside the card. A category with
// an empty features list is fully "planned" (nothing built yet).
const CATEGORIES = [
  {
    key: 'enrollment',
    title: 'Device Enrollment & Provisioning',
    icon: 'ti-plug-connected',
    accent: '#2563EB',
    gradient: 'linear-gradient(135deg, #2563EB, #60A5FA)',
    path: '/mdm/enrollment',
    features: ['Add device', 'List devices', 'Delete device', 'Agent installer ZIP generator'],
  },
  {
    key: 'remote-management',
    title: 'Remote Device Management',
    icon: 'ti-device-desktop-analytics',
    accent: '#0891B2',
    gradient: 'linear-gradient(135deg, #0891B2, #22D3EE)',
    path: '/mdm/remote-management',
    features: ['Network info', 'Disk info', 'Process list', 'Restart / Shutdown', 'Lock device', 'Run script'],
  },
  {
    key: 'app-management',
    title: 'App Management',
    icon: 'ti-apps',
    accent: '#F79420',
    gradient: 'linear-gradient(135deg, #F79420, #F7B733)',
    path: '/mdm/app-management',
    features: ['App inventory', 'Blacklist / Whitelist apps', 'Push custom apps (APK / EXE)', 'App pre-configuration', 'Usage reports & export'],
  },
  {
    key: 'policy-management',
    title: 'Policy Management',
    icon: 'ti-shield-check',
    accent: '#17B26A',
    gradient: 'linear-gradient(135deg, #17B26A, #6EE7B7)',
    path: '/mdm/policy-management',
    features: ['Security policy profiles', 'Hardware restrictions', 'Wi-Fi & time fencing', 'Push & compliance tracking', 'Audit log'],
  },
  {
    key: 'groups-roles',
    title: 'Group & Role-Based Management',
    icon: 'ti-users-group',
    accent: '#DB2777',
    gradient: 'linear-gradient(135deg, #DB2777, #F472B6)',
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
    accent: '#65A30D',
    gradient: 'linear-gradient(135deg, #4D7C0F, #84CC16)',
    path: '/mdm/geofencing',
    features: ['IP-based location (approximate)', 'Manual location correction'],
  },
  {
    key: 'content-publishing',
    title: 'Content Publishing',
    icon: 'ti-upload',
    accent: '#7C5CFC',
    gradient: 'linear-gradient(135deg, #7C5CFC, #A78BFA)',
    path: '/mdm/content-publishing',
    features: ['PDF / video / document library', 'Publish to institutions', 'Offline delivery & open tracking', 'Boot logo & wallpaper'],
  },
  {
    key: 'secure-browser',
    title: 'Secure Browser',
    icon: 'ti-world',
    accent: '#DC2626',
    gradient: 'linear-gradient(135deg, #DC2626, #F87171)',
    path: '/mdm/secure-browser',
    features: ['Category web filter', 'Allow / block lists & keywords', 'SafeSearch & kiosk mode', 'Live block activity log'],
  },
  {
    key: 'reports',
    title: 'Real-Time Reports & Identity',
    icon: 'ti-chart-bar',
    accent: '#CA8A04',
    gradient: 'linear-gradient(135deg, #B7791F, #EAB308)',
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
            {CATEGORIES.map((cat) => {
              const built = cat.features.length > 0

              return (
                <div key={cat.key}
                  className="group rounded-2xl flex flex-col p-5 transition-all duration-300 ease-out"
                  style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 1px 1px rgba(26,26,24,0.03)' }}
                  onMouseEnter={e => {
                    if (!built) return
                    e.currentTarget.style.boxShadow = '0 1px 1px rgba(26,26,24,0.04), 0 18px 34px -24px rgba(26,26,24,0.4)'
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.borderColor = C.borderStrong
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 1px 1px rgba(26,26,24,0.03)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = C.border
                  }}>

                  {/* Icon + badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: cat.accent + '14', border: `1px solid ${cat.accent}29` }}>
                      <i className={`ti ${cat.icon} text-[22px]`} style={{ color: cat.accent }} aria-hidden="true"></i>
                    </div>
                    {built ? (
                      <span className="shrink-0 text-[9.5px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: C.textSecondary, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                        {cat.features.length}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{ color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>Soon</span>
                    )}
                  </div>

                  <div className="text-[14.5px] font-semibold leading-snug mb-3.5" style={{ color: C.textPrimary }}>{cat.title}</div>

                  {built ? (
                    <ul className="flex flex-col gap-1 mb-5 flex-1">
                      {cat.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-[11.5px] font-medium"
                          style={{ color: C.textSecondary }}>
                          <i className="ti ti-check text-[11px] shrink-0" style={{ color: cat.accent }} aria-hidden="true"></i>
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[12px] mb-5 flex-1" style={{ color: C.textMuted }}>Not built yet.</p>
                  )}

                  {built ? (
                    <button onClick={() => navigate(cat.path)}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold cursor-pointer bg-transparent border-none p-0"
                      style={{ color: C.textPrimary }}>
                      View
                      <i className="ti ti-arrow-right text-[13px] transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: cat.accent }} aria-hidden="true"></i>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: C.textMuted }}>
                      <i className="ti ti-clock text-[12px]" aria-hidden="true"></i> Coming soon
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}