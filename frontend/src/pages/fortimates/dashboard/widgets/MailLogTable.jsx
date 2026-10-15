import { Fragment, useEffect, useState } from 'react'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { apiGet } from '../../lib/api.js'
import { mailLog as mockMailLog } from '../../data/mockData.js'
import { riskStyles } from './MailTrackerTable.jsx'

// Live data from the EasyReach backend (easyreach main.py — FortiMates section).
// Set to false to go back to the mock rows in mockData.js.
const USE_LIVE_DATA = true

export default function MailLogTable({ direction = 'outbound', refreshKey = 0 }) {
  const inbound = direction === 'inbound'
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState(USE_LIVE_DATA ? [] : mockMailLog)
  const [loading, setLoading] = useState(USE_LIVE_DATA)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    if (!USE_LIVE_DATA) return

    async function load() {
      setLoading(true)
      setError('')
      try {
        // GET /fortimates/mails?direction=… — full mail log of this tab
        const result = await apiGet(`/mails?limit=300&direction=${direction}`)
        setRows(
          result.map((m) => ({
            key: m.id,
            id: m.message_id || m.id,
            from: m.from,
            email: m.email,
            to: m.to || '—',
            subject: m.subject,
            message: m.message,
            type: m.category || '—',
            status: m.status,
            error: m.error,
            risk: m.risk,
            reasons: m.risk_reasons ?? [],
            location: m.location || 'Unknown',
            date: m.date || '—',
            time: m.time || '—'
          }))
        )
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [direction, refreshKey])

  const q = query.toLowerCase()
  const visibleRows = rows.filter((r) =>
    [r.to, r.subject, r.type, r.status, r.from, r.email, r.location, r.risk].some((v) => v?.toLowerCase().includes(q))
  )
  const cols = 8

  return (
    <div className="bg-facet-card border border-white/5 clip-facet overflow-hidden">
      <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-mist-100">Mail log</h3>
          {inbound && <p className="text-xs text-mist-400 mt-1">Click a mail to see the message preview and why it got its risk level.</p>}
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 bg-abyss-950 border border-white/10 clip-facet-r">
          <Search size={14} className="text-mist-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={inbound ? 'Search sender, subject, location or risk...' : 'Search recipient, subject or status...'}
            className="bg-transparent outline-none text-sm text-mist-200 placeholder:text-mist-400 w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-mist-400 border-t border-white/5">
              <th className="px-6 py-3 font-normal">Sr. No.</th>
              {inbound ? (
                <>
                  <th className="px-6 py-3 font-normal">From</th>
                  <th className="px-6 py-3 font-normal">Subject</th>
                  <th className="px-6 py-3 font-normal">Category</th>
                  <th className="px-6 py-3 font-normal">Location</th>
                  <th className="px-6 py-3 font-normal">Risk</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-3 font-normal">Id</th>
                  <th className="px-6 py-3 font-normal">To</th>
                  <th className="px-6 py-3 font-normal">Subject</th>
                  <th className="px-6 py-3 font-normal">Status</th>
                </>
              )}
              <th className="px-6 py-3 font-normal">Date</th>
              <th className="px-6 py-3 font-normal">Time (GMT)</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={cols} className="px-6 py-8 text-center text-mist-400 text-sm">Loading mail log…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={cols} className="px-6 py-8 text-center text-red-400 text-sm">{error}</td></tr>
            )}
            {!loading && !error && visibleRows.length === 0 && (
              <tr>
                <td colSpan={cols} className="px-6 py-8 text-center text-mist-400 text-sm">
                  {rows.length === 0 ? (inbound ? 'No inbox mails yet — click "Sync now".' : 'No mails sent yet.') : 'No matching mail.'}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              visibleRows.map((r, i) => (
                <Fragment key={r.key ?? r.id}>
                  <tr
                    onClick={() => inbound && setOpenId(openId === r.key ? null : r.key)}
                    className={`border-t border-white/5 hover:bg-white/[0.02] transition-colors ${inbound ? 'cursor-pointer' : ''}`}
                  >
                    <td className="px-6 py-3.5 text-mist-400">
                      <span className="inline-flex items-center gap-1">
                        {inbound && (openId === r.key ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </td>
                    {inbound ? (
                      <>
                        <td className="px-6 py-3.5">
                          <p className="text-mist-100">{r.from}</p>
                          <p className="text-xs text-mist-400">{r.email}</p>
                        </td>
                        <td className="px-6 py-3.5 text-mist-300">{r.subject}</td>
                        <td className="px-6 py-3.5 text-mist-400">{r.type}</td>
                        <td className="px-6 py-3.5 text-mist-400">{r.location}</td>
                        <td className="px-6 py-3.5">
                          <span className="px-2.5 py-1 text-xs clip-facet-r" style={riskStyles[r.risk] ?? { color: '#AAB8D6' }}>
                            {r.risk || '—'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-3.5 text-mist-400">{r.id}</td>
                        <td className="px-6 py-3.5 text-mist-100">{r.to}</td>
                        <td className="px-6 py-3.5 text-mist-300">{r.subject}</td>
                        <td className="px-6 py-3.5" title={r.error || ''}>
                          <span style={{ color: r.status === 'Failed' ? '#EF476F' : '#4FD6E8' }}>{r.status}</span>
                          {r.status === 'Failed' && r.error && (
                            <p className="text-[11px] mt-0.5 max-w-[220px] truncate" style={{ color: '#7C8CAF' }}>{r.error}</p>
                          )}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-3.5 text-mist-400">{r.date}</td>
                    <td className="px-6 py-3.5 text-mist-400">{r.time}</td>
                  </tr>
                  {inbound && openId === r.key && (
                    <tr className="border-t border-white/5" style={{ background: 'rgba(5,11,24,0.6)' }}>
                      <td colSpan={cols} className="px-6 py-4">
                        <div className="grid md:grid-cols-2 gap-5 text-xs">
                          <div>
                            <p className="font-semibold mb-1.5" style={{ color: '#DCE4F2' }}>Message preview</p>
                            <p className="leading-relaxed" style={{ color: '#AAB8D6' }}>{r.message || '—'}</p>
                          </div>
                          <div>
                            <p className="font-semibold mb-1.5" style={{ color: '#DCE4F2' }}>Risk check — {r.risk}</p>
                            {r.reasons.length === 0 ? (
                              <p style={{ color: '#4FD6E8' }}>No warning signs found.</p>
                            ) : (
                              <ul className="space-y-1">
                                {r.reasons.map((reason) => (
                                  <li key={reason} className="flex gap-2" style={{ color: '#F4F7FC' }}>
                                    <span style={{ color: r.risk === 'High' ? '#EF476F' : '#F5AE0E' }}>•</span>
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}