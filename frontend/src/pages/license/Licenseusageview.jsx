import { useEffect, useState } from 'react'
import { getUsageLogs } from '../../api/license'

const INK = '#1A1A18'
const SUB = '#5C5C57'
const BG = '#E8E8E3'

const ACTION_LABEL = {
  activation: 'Activation',
  login: 'Login',
  logout: 'Logout',
  device_change: 'Device / Assignment Change',
  violation: 'Violation',
  renewal: 'Renewal',
  suspension: 'Suspension',
}

export default function LicenseUsageView() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getUsageLogs()
      .then(setLogs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8" style={{ background: BG, minHeight: '100%' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight" style={{ color: INK }}>
          <i className="ti ti-history mr-2" aria-hidden="true"></i>Usage &amp; Activity
        </h2>
        <p className="text-sm mt-1.5" style={{ color: SUB }}>Track license usage and history across every organization</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 text-[13px] border" style={{ background: '#FDECEC', borderColor: '#E8A5A5', color: '#8A2A2A' }}>
          {error}
        </div>
      )}

      <div className="bg-white border overflow-x-auto" style={{ borderColor: INK + '1A' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: INK + '1A' }}>
              {['When', 'License Key', 'Organization', 'Action', 'Description', 'By'].map(h => (
                <th key={h} className="px-4 py-3 font-semibold uppercase tracking-wide text-[11px]" style={{ color: SUB }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="6" className="text-center py-8" style={{ color: SUB }}>Loading activity…</td></tr>
            )}
            {!loading && logs.length === 0 && (
              <tr><td colSpan="6" className="text-center py-8" style={{ color: SUB }}>No activity recorded yet</td></tr>
            )}
            {!loading && logs.map(log => (
              <tr key={log.id} className="border-b" style={{ borderColor: INK + '0D' }}>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: SUB }}>{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 font-mono" style={{ color: INK }}>{log.license_key || '—'}</td>
                <td className="px-4 py-3" style={{ color: INK }}>{log.organization_name || <em style={{ color: SUB }}>Unassigned</em>}</td>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-bold uppercase px-2 py-1" style={{ color: '#fff', background: INK }}>
                    {ACTION_LABEL[log.action_type] || log.action_type}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: SUB }}>{log.description || '—'}</td>
                <td className="px-4 py-3" style={{ color: SUB }}>{log.created_by || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}