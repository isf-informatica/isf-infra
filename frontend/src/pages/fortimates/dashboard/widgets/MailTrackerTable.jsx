import { useEffect, useState } from 'react'
import { apiGet } from '../../lib/api.js'

// Latest 5 mails of one tab — GET /fortimates/mails?direction=inbound|outbound
export const statusStyles = {
  Delivered: { background: 'rgba(43,196,217,0.12)', color: '#4FD6E8' },
  Failed: { background: 'rgba(239,71,111,0.12)', color: '#EF476F' }
}

export const riskStyles = {
  Low: { background: 'rgba(43,196,217,0.12)', color: '#4FD6E8' },
  Medium: { background: 'rgba(245,174,14,0.12)', color: '#F5AE0E' },
  High: { background: 'rgba(239,71,111,0.14)', color: '#EF476F' }
}

export default function MailTrackerTable({ direction = 'outbound', refreshKey = 0 }) {
  const inbound = direction === 'inbound'
  const [mailTracker, setMailTracker] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    apiGet(`/mails?limit=5&direction=${direction}`)
      .then(setMailTracker)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [direction, refreshKey])

  return (
    <div className="bg-facet-card border border-white/5 clip-facet overflow-hidden">
      <div className="p-6">
        <h3 className="text-sm font-semibold text-mist-100">Recent mail activity</h3>
        <p className="text-xs text-mist-400 mt-1">
          {inbound ? 'Latest mails received in the mailbox, with a phishing risk check.' : 'Latest mails sent by FortiMates.'}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-mist-400 border-t border-white/5">
              <th className="px-6 py-3 font-normal">Subject</th>
              <th className="px-6 py-3 font-normal">{inbound ? 'From' : 'To'}</th>
              <th className="px-6 py-3 font-normal">{inbound ? 'Category' : 'Type'}</th>
              <th className="px-6 py-3 font-normal">{inbound ? 'Risk' : 'Status'}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-mist-400 text-sm">Loading…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-red-400 text-sm">{error}</td></tr>
            )}
            {!loading && !error && mailTracker.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-mist-400 text-sm">
                  {inbound ? 'No inbox mails yet — click "Sync now".' : 'No mails sent yet.'}
                </td>
              </tr>
            )}
            {!loading &&
              mailTracker.map((m) => (
                <tr key={m.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3.5 text-mist-100">{m.subject}</td>
                  <td className="px-6 py-3.5 text-mist-300" title={inbound ? m.email : ''}>
                    {inbound ? m.from || m.email : m.to || '—'}
                  </td>
                  <td className="px-6 py-3.5 text-mist-400">{m.category || '—'}</td>
                  <td className="px-6 py-3.5">
                    {inbound ? (
                      <span
                        className="px-2.5 py-1 text-xs clip-facet-r"
                        style={riskStyles[m.risk] ?? { color: '#AAB8D6' }}
                        title={(m.risk_reasons ?? []).join('\n')}
                      >
                        {m.risk || '—'}
                      </span>
                    ) : (
                      <span
                        className="px-2.5 py-1 text-xs clip-facet-r"
                        style={statusStyles[m.status] ?? { color: '#AAB8D6' }}
                        title={m.error || ''}
                      >
                        {m.status}
                      </span>
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