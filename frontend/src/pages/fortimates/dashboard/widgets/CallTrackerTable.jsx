import { useEffect, useState } from 'react'
import { Search, PlayCircle, MinusCircle } from 'lucide-react'
import { apiGet } from '../../lib/api.js'
import RecordingModal from './RecordingModal.jsx'

const outcomeColors = {
  Verified: 'bg-signal-500/10 text-signal-400',
  'Follow-up needed': 'bg-amber-500/10 text-amber-400',
  'No answer': 'bg-mist-400/10 text-mist-400',
  Declined: 'bg-red-500/10 text-red-400'
}

export default function CallTrackerTable() {
  const [query, setQuery] = useState('')
  const [activeCall, setActiveCall] = useState(null)
  // Verification calls — GET /fortimates/calls
  const [callTracker, setCallTracker] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet('/calls')
      .then(setCallTracker)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const rows = callTracker.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="bg-facet-card border border-white/5 clip-facet overflow-hidden">
      <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-sm font-semibold text-mist-100">Call log</h3>
        <div className="flex items-center gap-2 px-3.5 py-2 bg-abyss-950 border border-white/10 clip-facet-r">
          <Search size={14} className="text-mist-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name..."
            className="bg-transparent outline-none text-sm text-mist-200 placeholder:text-mist-400 w-40"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-mist-400 border-t border-white/5">
              <th className="px-6 py-3 font-normal">Sr. No.</th>
              <th className="px-6 py-3 font-normal">Name</th>
              <th className="px-6 py-3 font-normal">Start Time</th>
              <th className="px-6 py-3 font-normal">End Time</th>
              <th className="px-6 py-3 font-normal">Outcome</th>
              <th className="px-6 py-3 font-normal">Recording</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-3.5 text-mist-400">{String(i + 1).padStart(2, '0')}</td>
                <td className="px-6 py-3.5 text-mist-100">{r.name}</td>
                <td className="px-6 py-3.5 text-mist-400">{r.start}</td>
                <td className="px-6 py-3.5 text-mist-400">{r.end}</td>
                <td className="px-6 py-3.5">
                  <span className={`px-2.5 py-1 text-xs clip-facet-r ${outcomeColors[r.outcome]}`}>
                    {r.outcome}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  {r.recording ? (
                    <button
                      onClick={() => setActiveCall(r.name)}
                      className="flex items-center gap-1.5 text-signal-400 hover:text-signal-300 text-xs"
                    >
                      <PlayCircle size={15} />
                      Play
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-mist-400 text-xs">
                      <MinusCircle size={15} />
                      None
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {loading && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-mist-400 text-sm">Loading calls…</td></tr>
            )}
            {error && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-red-400 text-sm">{error}</td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-mist-400 text-sm">
                  No matching calls.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <RecordingModal
        open={activeCall !== null}
        onClose={() => setActiveCall(null)}
        callerName={activeCall}
      />
    </div>
  )
}
