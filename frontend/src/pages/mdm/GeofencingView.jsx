import { useEffect, useState } from 'react'
import { getAllSchools } from '../../api/schools'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'

/* Same tokens as Dashboard.jsx — kept identical so every page in the app matches. */
const C = {
  bgApp: '#F6F8FB',
  surface: '#FFFFFF',
  border: '#E4E9F2',
  textPrimary: '#101828',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  brandFrom: '#3B6FE0',
  systemBg: '#EDF3FF',
  systemBorder: '#D8E6FF',
  surfaceAlt: '#F8FAFC',
  success: '#17B26A',
}

// Same IP-geolocation + manual-override logic as Dashboard.jsx, kept identical
// so location edits stay consistent between the two pages.
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

const OVERRIDE_KEY = 'easyreach_location_overrides'
const getLocationOverrides = () => {
  try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) || {} } catch { return {} }
}
const saveLocationOverride = (schoolId, loc) => {
  const all = getLocationOverrides()
  all[schoolId] = loc
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(all))
}

export default function GeofencingView() {
  const [schools, setSchools] = useState([])
  const [locations, setLocations] = useState({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ city: '', region: '' })

  useEffect(() => {
    getAllSchools()
      .then(data => {
        setSchools(data)
        const overrides = getLocationOverrides()
        data.forEach(async (school) => {
          if (overrides[school.id]) {
            setLocations(prev => ({ ...prev, [school.id]: overrides[school.id] }))
            return
          }
          if (school.public_ip) {
            const loc = await fetchIpLocation(school.public_ip)
            if (loc) setLocations(prev => ({ ...prev, [school.id]: loc }))
          }
        })
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const startEdit = (school) => {
    const current = locations[school.id]
    setForm({ city: current?.city || '', region: current?.region || '' })
    setEditingId(school.id)
  }

  const saveEdit = (schoolId) => {
    if (!form.city.trim()) return
    const loc = { city: form.city.trim(), region: form.region.trim(), source: 'manual' }
    saveLocationOverride(schoolId, loc)
    setLocations(prev => ({ ...prev, [schoolId]: loc }))
    setEditingId(null)
  }

  return (
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      <Topbar C={C} />
      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 px-7 py-7 max-w-2xl">
          <h1 className="text-[20px] font-semibold mb-1" style={{ color: C.textPrimary }}>Geofencing & Location Tracking</h1>
          <p className="text-[13px] mb-6" style={{ color: C.textSecondary }}>Approximate location per institution, correctable manually</p>

          {loading ? (
            <div className="flex items-center gap-2 py-10" style={{ color: C.textSecondary }}>
              <i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Loading…
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {schools.map((school) => {
                const loc = locations[school.id]
                return (
                  <div key={school.id} className="flex items-center justify-between rounded-2xl px-5 py-4"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>{school.name}</div>

                    {editingId === school.id ? (
                      <div className="flex items-center gap-1.5">
                        <input autoFocus value={form.city}
                          onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="City"
                          className="text-[12px] px-2.5 py-1.5 rounded-lg outline-none w-28"
                          style={{ border: `1px solid ${C.systemBorder}` }} />
                        <input value={form.region}
                          onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                          placeholder="State"
                          className="text-[12px] px-2.5 py-1.5 rounded-lg outline-none w-24"
                          style={{ border: `1px solid ${C.systemBorder}` }} />
                        <button onClick={() => saveEdit(school.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: C.success, color: '#fff' }}>
                          <i className="ti ti-check text-[13px]" aria-hidden="true"></i>
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: C.surfaceAlt, color: C.textMuted }}>
                          <i className="ti ti-x text-[13px]" aria-hidden="true"></i>
                        </button>
                      </div>
                    ) : loc ? (
                      <button onClick={() => startEdit(school)}
                        className="flex items-center gap-1.5 text-[12.5px] px-3 py-1.5 rounded-full"
                        style={{ color: C.textSecondary, background: C.surfaceAlt }}>
                        <i className="ti ti-map-pin text-[12px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
                        {loc.city}{loc.region ? `, ${loc.region}` : ''}
                        {loc.source === 'ip' && <span className="text-[10px]" style={{ color: C.textMuted }}>(auto)</span>}
                        <i className="ti ti-pencil text-[11px]" style={{ color: C.brandFrom }} aria-hidden="true"></i>
                      </button>
                    ) : (
                      <button onClick={() => startEdit(school)}
                        className="flex items-center gap-1.5 text-[12.5px] px-3 py-1.5 rounded-full"
                        style={{ color: C.textMuted }}>
                        <i className="ti ti-map-pin-plus text-[12px]" aria-hidden="true"></i> Set location
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}