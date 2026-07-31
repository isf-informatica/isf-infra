import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSchools } from '../../api/schools'
import useAuthStore from '../../store/authStore'

/* Shared design tokens — kept consistent across the whole app */
const C = {
  bgApp: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E4E9F2',
  borderStrong: '#D8E0EC',
  textPrimary: '#101828',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  brandFrom: '#3B6FE0',
  brandTo: '#16B8A6',
  server: '#7C5CFC',
  serverBg: '#F5F2FF',
  serverBorder: '#E4DCFF',
  system: '#3B6FE0',
  systemBg: '#EDF3FF',
  systemBorder: '#D8E6FF',
  success: '#17B26A',
  successBg: '#ECFDF5',
  successBorder: '#A7E9C8',
  danger: '#E4483C',
  dangerBg: '#FEF1F0',
  dangerBorder: '#FBD5D2',
  warning: '#F79420',
  warningBg: '#FFF7EB',
  warningBorder: '#FDDDA8',
}

const getStatus = (school) => typeof school.status === 'string' ? school.status : 'pending'

const typeMeta = (type) => {
  if (type === 'college') return { icon: 'ti-certificate', label: 'College' }
  if (type === 'institute') return { icon: 'ti-building-bank', label: 'Institute' }
  return { icon: 'ti-school', label: 'School' }
}

// IP-based location fetch — used only as a rough starting guess.
// IP geolocation resolves to the ISP's registered city (often a regional
// NOC/hub), not the institution's real address, so it can be wrong
// (e.g. shows Mumbai for a Nashik connection). We treat it as a fallback
// only, and let the correct location be set once and remembered.
const locationCache = {}
const fetchIpLocation = async (ip) => {
  if (!ip || ip === 'not set') return null
  if (locationCache[ip]) return locationCache[ip]
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`)
    const data = await res.json()
    if (data.city) {
      const loc = { city: data.city, region: data.region, country: data.country_name, source: 'ip' }
      locationCache[ip] = loc
      return loc
    }
  } catch {}
  return null
}

// Manually-confirmed locations are stored locally per school so that once
// corrected, the right city always shows — no repeated wrong IP guesses.
const OVERRIDE_KEY = 'easyreach_location_overrides'
const getLocationOverrides = () => {
  try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) || {} } catch { return {} }
}
const saveLocationOverride = (schoolId, loc) => {
  const all = getLocationOverrides()
  all[schoolId] = loc
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(all))
}

export default function Dashboard() {
  const [schools, setSchools] = useState([])
  const [locations, setLocations] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingLocationId, setEditingLocationId] = useState(null)
  const [locationForm, setLocationForm] = useState({ city: '', region: '' })
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchSchools()
    const interval = setInterval(fetchSchools, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSchools = async () => {
    try {
      const data = await getAllSchools()
      setSchools(data)
      const overrides = getLocationOverrides()
      data.forEach(async (school) => {
        if (overrides[school.id]) {
          setLocations(prev => ({ ...prev, [school.id]: overrides[school.id] }))
          return
        }
        if (school.public_ip && !locations[school.id]) {
          const loc = await fetchIpLocation(school.public_ip)
          if (loc) setLocations(prev => ({ ...prev, [school.id]: loc }))
        }
      })
    }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const startEditLocation = (school, e) => {
    e.stopPropagation()
    const current = locations[school.id]
    setLocationForm({ city: current?.city || '', region: current?.region || '' })
    setEditingLocationId(school.id)
  }

  const saveEditLocation = (schoolId, e) => {
    e.stopPropagation()
    if (!locationForm.city.trim()) return
    const loc = { city: locationForm.city.trim(), region: locationForm.region.trim(), source: 'manual' }
    saveLocationOverride(schoolId, loc)
    setLocations(prev => ({ ...prev, [schoolId]: loc }))
    setEditingLocationId(null)
  }

  const stats = [
    { label: 'Total institutions', icon: 'ti-building-community', value: schools.length, color: C.brandFrom, bg: C.systemBg },
    { label: 'Active', icon: 'ti-circle-check', value: schools.filter(s => getStatus(s) === 'active').length, color: C.success, bg: C.successBg },
    { label: 'Pending', icon: 'ti-clock', value: schools.filter(s => getStatus(s) === 'pending').length, color: C.warning, bg: C.warningBg },
    { label: 'Killed', icon: 'ti-bolt-off', value: schools.filter(s => getStatus(s) === 'killed').length, color: C.danger, bg: C.dangerBg },
  ]

  const statusMeta = {
    active: { color: C.success, bg: C.successBg, border: C.successBorder },
    killed: { color: C.danger, bg: C.dangerBg, border: C.dangerBorder },
    pending: { color: C.warning, bg: C.warningBg, border: C.warningBorder },
  }

  return (
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      {/* Topbar */}
      <div className="flex items-center justify-between px-7 py-4" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
            <i className="ti ti-server-2 text-white text-lg" aria-hidden="true"></i>
          </div>
          <div>
            <div className="text-[14.5px] font-semibold" style={{ color: C.textPrimary }}>EasyReach</div>
            <div className="text-[12px]" style={{ color: C.textSecondary }}>ISF Media Server Control</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${C.server}, #A78BFA)` }}>
            {user?.name?.[0]}
          </div>
          <span className="text-[13.5px] font-medium" style={{ color: C.textPrimary }}>{user?.name}</span>
          <button onClick={() => { logout(); navigate('/login') }}
            className="text-[12.5px] font-medium px-3.5 py-1.5 rounded-full cursor-pointer border"
            style={{ color: C.danger, background: C.dangerBg, borderColor: C.dangerBorder }}>
            Sign out
          </button>
        </div>
      </div>

      <div className="px-7 py-7 max-w-7xl mx-auto">
        {/* Hero banner */}
        <div className="flex items-center justify-between px-6 py-5 rounded-2xl mb-7"
          style={{ background: `linear-gradient(120deg, ${C.systemBg}, ${C.successBg})`, border: `1px solid ${C.systemBorder}` }}>
          <div className="flex items-center gap-3.5">
            <span className="relative flex w-3 h-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: C.success }}></span>
              <span className="relative inline-flex rounded-full w-3 h-3" style={{ background: C.success }}></span>
            </span>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: C.textPrimary }}>All systems running</div>
              <div className="text-[12px] mt-0.5" style={{ color: C.textSecondary }}>Auto-refreshes every 30 seconds</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium px-3.5 py-1.5 rounded-full flex items-center gap-1.5"
              style={{ color: C.brandFrom, background: C.surface, border: `1px solid ${C.systemBorder}` }}>
              <i className="ti ti-refresh text-xs" aria-hidden="true"></i>Auto sync on
            </span>
            <button onClick={fetchSchools}
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full cursor-pointer flex items-center gap-1.5"
              style={{ color: C.textSecondary, background: C.surface, border: `1px solid ${C.border}` }}>
              <i className="ti ti-refresh text-xs" aria-hidden="true"></i>Refresh
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-semibold" style={{ color: C.textPrimary }}>Deployments</h1>
            <p className="text-[13px] mt-1" style={{ color: C.textSecondary }}>Manage all institution on-premise media servers</p>
          </div>
          <button onClick={() => navigate('/schools/setup')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white border-none cursor-pointer shadow-sm transition-transform hover:scale-[1.02]"
            style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
            <i className="ti ti-rocket text-sm" aria-hidden="true"></i> One-click setup
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          {stats.map(({ label, icon, value, color, bg }) => (
            <div key={label} className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-medium" style={{ color: C.textSecondary }}>{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                  <i className={`ti ${icon} text-[14px]`} style={{ color }} aria-hidden="true"></i>
                </div>
              </div>
              <div className="text-[30px] font-semibold leading-none" style={{ color: C.textPrimary }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Section label */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>Institutions</span>
          <div className="flex-1 h-px" style={{ background: C.border }}></div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <i className="ti ti-loader-2 animate-spin text-2xl" style={{ color: C.brandFrom }} aria-hidden="true"></i>
            <span className="text-[13px]" style={{ color: C.textSecondary }}>Loading deployments…</span>
          </div>
        ) : schools.length === 0 ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
              <i className="ti ti-building-community text-[26px]" style={{ color: C.brandFrom }} aria-hidden="true"></i>
            </div>
            <div className="text-[15px] font-semibold mb-1.5" style={{ color: C.textPrimary }}>No deployments yet</div>
            <div className="text-[13px] mb-6" style={{ color: C.textSecondary }}>Set up your first institution's on-premise media server</div>
            <button onClick={() => navigate('/schools/setup')}
              className="px-6 py-2.5 rounded-xl text-[13.5px] font-semibold text-white border-none cursor-pointer shadow-sm"
              style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
              <i className="ti ti-rocket mr-1" aria-hidden="true"></i> One-click setup
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {schools.map(school => {
              const status = getStatus(school)
              const sm = statusMeta[status] || statusMeta.pending
              const loc = locations[school.id]
              const type = typeMeta(school.institution_type)
              return (
                <div key={school.id}
                  className="rounded-2xl p-6 cursor-pointer transition-all"
                  style={{ background: C.surface, border: `1px solid ${status === 'active' ? C.successBorder : C.border}` }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px -8px rgba(16,24,40,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-semibold text-white shrink-0"
                        style={{ background: status === 'active' ? `linear-gradient(135deg, ${C.success}, ${C.brandFrom})` : `linear-gradient(135deg, ${C.brandFrom}, ${C.server})` }}>
                        {school.name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{school.name}</div>
                        <div className="text-[11.5px] font-mono mt-0.5" style={{ color: C.textMuted }}>{school.public_ip || 'not set'}</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                      style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.border}` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sm.color }}></span>{status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1 rounded-full"
                      style={{ color: C.brandFrom, background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
                      <i className={`ti ${type.icon} text-[11px]`} aria-hidden="true"></i> {type.label}
                    </span>

                    {editingLocationId === school.id ? (
                      <div onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5">
                        <input autoFocus value={locationForm.city}
                          onChange={e => setLocationForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="City, e.g. Nashik"
                          className="text-[11.5px] px-2.5 py-1 rounded-full outline-none w-28"
                          style={{ border: `1px solid ${C.systemBorder}`, color: C.textPrimary }} />
                        <input value={locationForm.region}
                          onChange={e => setLocationForm(f => ({ ...f, region: e.target.value }))}
                          placeholder="State"
                          className="text-[11.5px] px-2.5 py-1 rounded-full outline-none w-24"
                          style={{ border: `1px solid ${C.systemBorder}`, color: C.textPrimary }} />
                        <button onClick={e => saveEditLocation(school.id, e)}
                          className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border-none shrink-0"
                          style={{ background: C.success, color: '#fff' }}>
                          <i className="ti ti-check text-[12px]" aria-hidden="true"></i>
                        </button>
                        <button onClick={e => { e.stopPropagation(); setEditingLocationId(null) }}
                          className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border-none shrink-0"
                          style={{ background: C.surfaceAlt, color: C.textMuted }}>
                          <i className="ti ti-x text-[12px]" aria-hidden="true"></i>
                        </button>
                      </div>
                    ) : loc ? (
                      <span onClick={e => startEditLocation(school, e)}
                        title="Click to correct this location"
                        className="group/loc inline-flex items-center gap-1.5 text-[11.5px] cursor-pointer px-1.5 py-0.5 rounded-full transition-colors"
                        style={{ color: C.textSecondary }}
                        onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <i className="ti ti-map-pin text-[11px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
                        {loc.city}{loc.region ? `, ${loc.region}` : ''}
                        {loc.source === 'ip' && (
                          <span className="text-[9.5px]" style={{ color: C.textMuted }}>(auto)</span>
                        )}
                        <i className="ti ti-pencil text-[10px] opacity-0 group-hover/loc:opacity-100 transition-opacity" style={{ color: C.brandFrom }} aria-hidden="true"></i>
                      </span>
                    ) : (
                      <button onClick={e => startEditLocation(school, e)}
                        className="inline-flex items-center gap-1.5 text-[11.5px] px-1.5 py-0.5 rounded-full cursor-pointer border-none bg-transparent"
                        style={{ color: C.textMuted }}>
                        <i className="ti ti-map-pin-plus text-[11px]" aria-hidden="true"></i> Set location
                      </button>
                    )}
                  </div>

                  {school.storage_domain && (
                    <div className="text-[12px] font-mono px-3.5 py-2.5 rounded-xl mb-4"
                      style={{ color: C.brandFrom, background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
                      {school.storage_domain}:{school.https_port}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { label: 'Storage', value: `${school.storage_used_gb || 0} GB`, icon: 'ti-database' },
                      { label: 'Files', value: school.file_count || 0, icon: 'ti-files' },
                      { label: 'Agent', value: school.agent_online ? 'Online' : 'Offline', icon: school.agent_online ? 'ti-wifi' : 'ti-wifi-off', color: school.agent_online ? C.success : C.textMuted },
                    ].map(({ label, value, icon, color }) => (
                      <div key={label} className="rounded-xl py-2.5 text-center" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                        <div className="flex items-center justify-center gap-1 text-[12.5px] font-semibold" style={{ color: color || C.textPrimary }}>
                          <i className={`ti ${icon} text-[11px]`} aria-hidden="true"></i>{value}
                        </div>
                        <div className="text-[10.5px] mt-0.5" style={{ color: C.textMuted }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/schools/${school.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-semibold cursor-pointer transition-colors"
                      style={{ color: C.brandFrom, background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
                      <i className="ti ti-info-circle text-sm" aria-hidden="true"></i> View details
                    </button>
                    <button onClick={() => navigate(`/schools/${school.id}/kill`)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold cursor-pointer transition-colors"
                      style={{ color: C.danger, background: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
                      <i className="ti ti-bolt-off text-sm" aria-hidden="true"></i> Kill
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}