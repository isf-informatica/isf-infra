import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLicenseStats } from '../../api/license'

const INK = '#1A1A18'
const SUB = '#5C5C57'
const BG = '#E8E8E3'

const STAT_CARDS = [
  { key: 'total_licenses', label: 'Total Licenses', icon: 'ti-key' },
  { key: 'active_licenses', label: 'Active Licenses', icon: 'ti-circle-check' },
  { key: 'expired_licenses', label: 'Expired Licenses', icon: 'ti-circle-x' },
  { key: 'schools_ratio', label: 'Licensed Schools', icon: 'ti-building-community' },
]

const QUICK_ACTIONS = [
  { label: 'Generate New License', icon: 'ti-plus', path: '/license/generate' },
  { label: 'View All Licenses', icon: 'ti-list-details', path: '/license/manage' },
  { label: 'Assign to Schools', icon: 'ti-building-community', path: '/license/assign' },
  { label: 'View Violations', icon: 'ti-alert-triangle', path: '/license/violations' },
]

export default function LicenseDashboardView() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLicenseStats()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const valueFor = (key) => {
    if (!stats) return '—'
    if (key === 'schools_ratio') return `${stats.licensed_schools} / ${stats.total_schools}`
    return stats[key]
  }

  return (
    <div className="p-8" style={{ background: BG, minHeight: '100%' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight" style={{ color: INK }}>
          <i className="ti ti-key mr-2" aria-hidden="true"></i>License Dashboard
        </h2>
        <p className="text-sm mt-1.5" style={{ color: SUB }}>Overview of all license statistics and activity</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 text-[13px] border" style={{ background: '#FDECEC', borderColor: '#E8A5A5', color: '#8A2A2A' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {STAT_CARDS.map((c) => (
          <div key={c.key} className="bg-white border p-5" style={{ borderColor: INK + '1A' }}>
            <div className="flex items-center justify-between mb-3">
              <i className={`ti ${c.icon} text-[22px]`} style={{ color: SUB }} aria-hidden="true"></i>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: INK }}>{loading ? '…' : valueFor(c.key)}</p>
            <p className="text-[12.5px] mt-1" style={{ color: SUB }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border p-5" style={{ borderColor: INK + '1A' }}>
        <h3 className="text-[13px] font-bold uppercase tracking-wider mb-4" style={{ color: INK }}>Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white"
              style={{ background: INK }}
            >
              <i className={`ti ${a.icon} text-[15px]`} aria-hidden="true"></i>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}