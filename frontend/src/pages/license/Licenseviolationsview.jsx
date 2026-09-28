import { useEffect, useState } from 'react'
import { getViolations, resolveViolation } from '../../api/license'

const INK = '#1A1A18'
const SUB = '#5C5C57'
const BG = '#E8E8E3'

const SEVERITY_COLOR = {
  low: '#5C5C57',
  medium: '#8A6D1A',
  high: '#B5541A',
  critical: '#8A2A2A',
}

export default function LicenseViolationsView() {
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    getViolations()
      .then(setViolations)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleResolve = async (id) => {
    const remarks = window.prompt('Resolution remarks (optional):') || ''
    setBusyId(id)
    try {
      await resolveViolation(id, remarks)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-8" style={{ background: BG, minHeight: '100%' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight" style={{ color: INK }}>
          <i className="ti ti-alert-triangle mr-2" aria-hidden="true"></i>Violations
        </h2>
        <p className="text-sm mt-1.5" style={{ color: SUB }}>Monitor and resolve license violations</p>
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
              {['When', 'License Key', 'Organization', 'Type', 'Severity', 'Status', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 font-semibold uppercase tracking-wide text-[11px]" style={{ color: SUB }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="7" className="text-center py-8" style={{ color: SUB }}>Loading violations…</td></tr>
            )}
            {!loading && violations.length === 0 && (
              <tr><td colSpan="7" className="text-center py-8" style={{ color: SUB }}>No violations recorded — all clean</td></tr>
            )}
            {!loading && violations.map(v => (
              <tr key={v.id} className="border-b" style={{ borderColor: INK + '0D' }}>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: SUB }}>{v.created_at ? new Date(v.created_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 font-mono" style={{ color: INK }}>{v.license_key || '—'}</td>
                <td className="px-4 py-3" style={{ color: INK }}>{v.organization_name || <em style={{ color: SUB }}>Unassigned</em>}</td>
                <td className="px-4 py-3" style={{ color: SUB }}>{v.violation_type}</td>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-bold uppercase px-2 py-1" style={{ color: '#fff', background: SEVERITY_COLOR[v.severity] || SUB }}>
                    {v.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {v.is_resolved ? (
                    <span className="text-[12px] font-semibold" style={{ color: '#1F7A3D' }}>Resolved</span>
                  ) : (
                    <span className="text-[12px] font-semibold" style={{ color: '#8A2A2A' }}>Open</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!v.is_resolved && (
                    <button disabled={busyId === v.id} onClick={() => handleResolve(v.id)}
                      className="px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-60" style={{ background: INK }}>
                      Mark Resolved
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}