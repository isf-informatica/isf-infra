import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { apiGet } from '../../lib/api.js'

export default function KycList() {
  const [query, setQuery] = useState('')
  // Verified KYC records — GET /fortimates/kyc (approved Requests land here)
  const [kycList, setKycList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet('/kyc')
      .then(setKycList)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const rows = kycList.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="bg-facet-card border border-white/5 clip-facet overflow-hidden">
      <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-sm font-semibold text-mist-100">User KYC list</h3>
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
              <th className="px-6 py-3 font-normal">Bank Name</th>
              <th className="px-6 py-3 font-normal">Bank Category</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-3.5 text-mist-400">{String(i + 1).padStart(2, '0')}</td>
                <td className="px-6 py-3.5 text-mist-100">{r.name}</td>
                <td className="px-6 py-3.5 text-mist-400">{r.bankName}</td>
                <td className="px-6 py-3.5 text-mist-400">{r.bankCategory}</td>
              </tr>
            ))}
            {loading && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-mist-400 text-sm">Loading KYC list…</td></tr>
            )}
            {error && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-red-400 text-sm">{error}</td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-mist-400 text-sm">
                  No matching records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
