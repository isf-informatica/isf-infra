import { useNavigate } from 'react-router-dom'
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
  warning: '#F79420',
  warningBg: '#FFF7EB',
  warningBorder: '#FDDDA8',
}

// `features` lists ONLY the sub-capabilities that actually exist today —
// nothing planned or missing is mentioned inside the card. A category with
// an empty features list is fully "planned" (nothing built yet).
const CATEGORIES = [
  {
    key: 'enrollment',
    title: 'Device Enrollment & Provisioning',
    icon: 'ti-plug-connected',
    gradient: 'linear-gradient(135deg, #3B6FE0, #16B8A6)',
    // Dedicated minimal page — only add/list/delete device + agent ZIP.
    path: '/mdm/enrollment',
    features: ['Add device', 'List devices', 'Delete device', 'Agent installer ZIP generator'],
  },
  {
    key: 'remote-management',
    title: 'Remote Device Management',
    icon: 'ti-device-desktop-analytics',
    gradient: 'linear-gradient(135deg, #7C5CFC, #A78BFA)',
    // Dedicated minimal page — only the command console.
    path: '/mdm/remote-management',
    features: ['Network info', 'Disk info', 'Process list', 'Restart / Shutdown', 'Lock device', 'Run script'],
  },
  {
    key: 'app-management',
    title: 'App Management',
    icon: 'ti-apps',
    gradient: 'linear-gradient(135deg, #F79420, #F7B733)',
    path: null,
    features: [],
  },
  {
    key: 'policy-management',
    title: 'Policy Management',
    icon: 'ti-shield-check',
    gradient: 'linear-gradient(135deg, #17B26A, #6EE7B7)',
    path: null,
    features: [],
  },
  {
    key: 'groups-roles',
    title: 'Group & Role-Based Management',
    icon: 'ti-users-group',
    gradient: 'linear-gradient(135deg, #E4483C, #F5766D)',
    path: '/mdm/groups-roles',
    features: ['Role assignment (UI preview)', 'Device grouping (UI preview)'],
  },
  {
    key: 'hardware-security',
    title: 'Data Security & Hardware Restriction',
    icon: 'ti-lock',
    gradient: 'linear-gradient(135deg, #101828, #475467)',
    // Kill Switch itself lives on KillSwitch.jsx (Dashboard only has a button
    // that opens it) — same hardcoded-school caveat as above.
    path: '/schools/1/kill',
    features: ['Kill Switch — Level 1 / 2 / 3', 'Restore from Kill Switch'],
  },
  {
    key: 'geofencing',
    title: 'Geofencing & Location Tracking',
    icon: 'ti-map-pin',
    gradient: 'linear-gradient(135deg, #16B8A6, #3B6FE0)',
    path: '/mdm/geofencing',
    features: ['IP-based location (approximate)', 'Manual location correction'],
  },
  {
    key: 'content-publishing',
    title: 'Content Publishing',
    icon: 'ti-upload',
    gradient: 'linear-gradient(135deg, #A78BFA, #7C5CFC)',
    path: null,
    features: [],
  },
  {
    key: 'secure-browser',
    title: 'Secure Browser',
    icon: 'ti-world',
    gradient: 'linear-gradient(135deg, #F5766D, #E4483C)',
    path: null,
    features: [],
  },
  {
    key: 'reports',
    title: 'Real-Time Reports & Identity',
    icon: 'ti-chart-bar',
    gradient: 'linear-gradient(135deg, #6EE7B7, #17B26A)',
    path: '/mdm/reports',
    features: ['Total institutions count', 'Active / Pending / Killed counts'],
  },
]

export default function MdmHub() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      <Topbar C={C} />

      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 px-7 py-7">
          <div className="mb-6">
            <h1 className="text-[20px] font-semibold" style={{ color: C.textPrimary }}>MDM Software</h1>
            <p className="text-[13px] mt-1" style={{ color: C.textSecondary }}>Choose a category to manage</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {CATEGORIES.map((cat) => {
              const built = cat.features.length > 0

              return (
                <div key={cat.key}
                  className="rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: C.surface, border: `1px solid ${C.border}` }}>

                  <div className="h-32 flex items-center justify-center" style={{ background: cat.gradient }}>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.22)' }}>
                      <i className={`ti ${cat.icon} text-[26px] text-white`} aria-hidden="true"></i>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="text-[15px] font-semibold" style={{ color: C.textPrimary }}>{cat.title}</div>
                      {!built && (
                        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                          Coming soon
                        </span>
                      )}
                    </div>

                    {built ? (
                      <ul className="flex flex-col gap-1.5 mb-4 flex-1">
                        {cat.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-[12px]" style={{ color: C.textSecondary }}>
                            <i className="ti ti-check text-[12px]" style={{ color: C.brandTo }} aria-hidden="true"></i>
                            {f}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[12px] mb-4 flex-1" style={{ color: C.textMuted }}>Not built yet.</p>
                    )}

                    <button
                      onClick={() => built && navigate(cat.path)}
                      disabled={!built}
                      className="w-full py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5"
                      style={
                        built
                          ? { background: C.textPrimary, color: '#fff', border: 'none', cursor: 'pointer' }
                          : { background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}`, cursor: 'not-allowed' }
                      }>
                      {built ? 'View' : 'Coming soon'}
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