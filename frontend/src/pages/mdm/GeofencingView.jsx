import { useEffect, useState } from 'react'
import { getAllSchools } from '../../api/schools'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'

/* Same tokens as Login.jsx / MdmHub.jsx — kept identical so every page in the app matches. */
const INK = '#1A1A18'
const SUB = '#5C5C57'
const MUTED = '#8A8A85'

const C = {
  bgApp: '#E8E8E3',
  surface: '#FFFFFF',
  border: INK + '1F',
  textPrimary: INK,
  textSecondary: SUB,
  textMuted: MUTED,
  brandFrom: INK,
  brandTo: '#3A3A36',
  systemBg: '#F2F2EE',
  systemBorder: INK + '3D',
  surfaceAlt: '#F2F2EE',
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
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <style>{`
        .gf-row { transition: box-shadow 150ms ease, border-color 150ms ease; }
        .gf-row:hover { box-shadow: 0 6px 18px -10px rgba(16,24,40,0.14); border-color: ${INK}33; }
        .gf-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(26,26,24,0.08); }
      `}</style>
      <Topbar C={C} />
      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 px-7 py-7 max-w-4xl">
          <h1 className="text-[20px] font-extrabold tracking-tight mb-1" style={{ color: C.textPrimary }}>Geofencing & location tracking</h1>
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
                  <div key={school.id} className="gf-row flex items-center justify-between rounded-2xl px-5 py-4"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.systemBg }}>
                        <i className="ti ti-building-community text-[15px]" style={{ color: C.textSecondary }} aria-hidden="true"></i>
                      </div>
                      <div className="text-[13.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{school.name}</div>
                    </div>

                    {editingId === school.id ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input autoFocus value={form.city}
                          onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="City"
                          className="gf-input text-[12px] px-2.5 py-1.5 rounded-lg w-28"
                          style={{ border: `1px solid ${C.systemBorder}` }} />
                        <input value={form.region}
                          onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                          placeholder="State"
                          className="gf-input text-[12px] px-2.5 py-1.5 rounded-lg w-24"
                          style={{ border: `1px solid ${C.systemBorder}` }} />
                        <button onClick={() => saveEdit(school.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border-none"
                          style={{ background: C.success, color: '#fff' }}>
                          <i className="ti ti-check text-[13px]" aria-hidden="true"></i>
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border-none"
                          style={{ background: C.surfaceAlt, color: C.textMuted }}>
                          <i className="ti ti-x text-[13px]" aria-hidden="true"></i>
                        </button>
                      </div>
                    ) : loc ? (
                      <button onClick={() => startEdit(school)}
                        className="flex items-center gap-1.5 text-[12.5px] px-3 py-1.5 rounded-full cursor-pointer border-none shrink-0 transition-colors"
                        style={{ color: C.textSecondary, background: C.surfaceAlt }}>
                        <i className="ti ti-map-pin text-[12px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
                        {loc.city}{loc.region ? `, ${loc.region}` : ''}
                        {loc.source === 'ip' && <span className="text-[10px]" style={{ color: C.textMuted }}>(auto)</span>}
                        <i className="ti ti-pencil text-[11px]" style={{ color: C.brandFrom }} aria-hidden="true"></i>
                      </button>
                    ) : (
                      <button onClick={() => startEdit(school)}
                        className="flex items-center gap-1.5 text-[12.5px] px-3 py-1.5 rounded-full cursor-pointer border-none shrink-0"
                        style={{ color: C.textMuted, background: 'transparent' }}>
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