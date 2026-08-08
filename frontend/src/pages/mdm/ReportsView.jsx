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
  brandFrom: '#3B6FE0',
  systemBg: '#EDF3FF',
  success: '#17B26A',
  successBg: '#ECFDF5',
  danger: '#E4483C',
  dangerBg: '#FEF1F0',
  warning: '#F79420',
  warningBg: '#FFF7EB',
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

  const stats = [
    { label: 'Total institutions', icon: 'ti-building-community', value: schools.length, color: C.brandFrom, bg: C.systemBg },
    { label: 'Active', icon: 'ti-circle-check', value: schools.filter(s => getStatus(s) === 'active').length, color: C.success, bg: C.successBg },
    { label: 'Pending', icon: 'ti-clock', value: schools.filter(s => getStatus(s) === 'pending').length, color: C.warning, bg: C.warningBg },
    { label: 'Killed', icon: 'ti-bolt-off', value: schools.filter(s => getStatus(s) === 'killed').length, color: C.danger, bg: C.dangerBg },
  ]

  return (
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      <Topbar C={C} />
      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 px-7 py-7 max-w-5xl">
          <h1 className="text-[20px] font-semibold mb-1" style={{ color: C.textPrimary }}>Real-Time Reports</h1>
          <p className="text-[13px] mb-6" style={{ color: C.textSecondary }}>Institution status counts</p>

          {loading ? (
            <div className="flex items-center gap-2 py-10" style={{ color: C.textSecondary }}>
              <i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Loading…
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
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
          )}
        </div>
      </div>
    </div>
  )
}