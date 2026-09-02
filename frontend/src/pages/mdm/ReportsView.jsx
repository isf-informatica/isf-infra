import { useEffect, useState } from 'react'
import { getAllSchools } from '../../api/schools'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'

/* Same tokens as Login.jsx / MdmHub.jsx — kept identical so every page in the app matches. */
const INK = '#1A1A18'
const SUB = '#5C5C57'

const C = {
  bgApp: '#E8E8E3',
  surface: '#FFFFFF',
  border: INK + '1F',
  textPrimary: INK,
  textSecondary: SUB,
  brandFrom: INK,
  brandTo: '#3A3A36',
  systemBg: '#F2F2EE',
  success: '#17B26A',
  successBg: '#ECFDF5',
  danger: '#8A2A2A',
  dangerBg: '#FBEAE9',
  warning: '#8A6816',
  warningBg: '#FBF3E0',
}

const getStatus = (school) => typeof school.status === 'string' ? school.status : 'pending'

export default function ReportsView() {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllSchools()
      .then(setSchools)
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const total = schools.length
  const pct = (n) => total ? Math.round((n / total) * 100) : 0

  const active = schools.filter(s => getStatus(s) === 'active').length
  const pending = schools.filter(s => getStatus(s) === 'pending').length
  const killed = schools.filter(s => getStatus(s) === 'killed').length

  const stats = [
    { label: 'Total institutions', icon: 'ti-building-community', value: total, color: C.brandFrom, bg: C.systemBg, note: 'across every account' },
    { label: 'Active', icon: 'ti-circle-check', value: active, color: C.success, bg: C.successBg, note: `${pct(active)}% of total` },
    { label: 'Pending', icon: 'ti-clock', value: pending, color: C.warning, bg: C.warningBg, note: `${pct(pending)}% of total` },
    { label: 'Killed', icon: 'ti-bolt-off', value: killed, color: C.danger, bg: C.dangerBg, note: `${pct(killed)}% of total` },
  ]

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <style>{`
        .rv-card { transition: box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease; }
        .rv-card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px -12px rgba(16,24,40,0.16); }
      `}</style>
      <Topbar C={C} />
      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 px-7 py-7 max-w-5xl">
          <h1 className="text-[20px] font-extrabold tracking-tight mb-1" style={{ color: C.textPrimary }}>Real-time reports</h1>
          <p className="text-[13px] mb-6" style={{ color: C.textSecondary }}>Institution status counts, updated live</p>

          {loading ? (
            <div className="flex items-center gap-2 py-10" style={{ color: C.textSecondary }}>
              <i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Loading…
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(({ label, icon, value, color, bg, note }) => (
                <div key={label} className="rv-card rounded-2xl p-5"
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[12px] font-medium" style={{ color: C.textSecondary }}>{label}</span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg, border: `1px solid ${color}33` }}>
                      <i className={`ti ${icon} text-[15px]`} style={{ color }} aria-hidden="true"></i>
                    </div>
                  </div>
                  <div className="text-[32px] font-semibold leading-none tabular-nums" style={{ color: C.textPrimary }}>{value}</div>
                  <div className="text-[11.5px] mt-2.5" style={{ color }}>{note}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}