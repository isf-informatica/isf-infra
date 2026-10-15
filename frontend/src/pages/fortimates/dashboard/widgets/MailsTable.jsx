import useOverview from '../../lib/useOverview.js'

export default function MailsTable() {
  // Latest mails from GET /fortimates/overview
  const { data, error, loading } = useOverview()
  const mailsList = data?.recent_mails ?? []
  return (
    <div className="bg-facet-card border border-white/5 clip-facet-r overflow-hidden h-full flex flex-col">
      <div className="p-6 pb-0">
        <h3 className="text-sm font-semibold text-mist-100">Mails</h3>
      </div>
      <div className="overflow-auto mt-4 flex-1 max-h-72">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-mist-400 border-t border-white/5 sticky top-0 bg-abyss-900">
              <th className="px-6 py-3 font-normal">Id</th>
              <th className="px-6 py-3 font-normal">To / From</th>
              <th className="px-6 py-3 font-normal">Subject</th>
              <th className="px-6 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-mist-400 text-sm">Loading mails…</td></tr>
            )}
            {error && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-red-400 text-sm">{error}</td></tr>
            )}
            {!loading && !error && mailsList.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-mist-400 text-sm">No mails yet.</td></tr>
            )}
            {mailsList.map((m) => (
              <tr key={m.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-3 text-mist-400">{m.message_id}</td>
                <td className="px-6 py-3 text-mist-300">
                  {m.direction === 'inbound' ? `From: ${m.email || m.from}` : m.to || '—'}
                </td>
                <td className="px-6 py-3 text-mist-100">{m.subject}</td>
                <td className="px-6 py-3" title={m.error || ''}>
                  {m.direction === 'inbound' ? (
                    <span style={{ color: m.risk === 'High' ? '#EF476F' : m.risk === 'Medium' ? '#F5AE0E' : '#4FD6E8' }}>
                      {m.risk} risk
                    </span>
                  ) : (
                    <span style={{ color: m.status === 'Failed' ? '#EF476F' : '#4FD6E8' }}>{m.status}</span>
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