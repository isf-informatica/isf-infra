import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { apiGet, apiPost } from '../../lib/api.js'
import { useNavigate } from 'react-router-dom'
import { Plus, FileSearch } from 'lucide-react'
import NewApplicationForm from './NewApplicationForm.jsx'
import { FM_DASH } from '../../config.js'
import { requestsQueue } from '../../data/mockData.js'

// Live data from the EasyReach backend (easyreach main.py — FortiMates section).
// Set to false to go back to the mock rows in mockData.js.
const USE_LIVE_DATA = true

const tabs = ['All', 'With Passport', 'Without Passport', 'Corporate']

const seedRows = requestsQueue.map((r) => ({ ...r, decision: 'pending' }))

export default function RequestsTable() {
  const [tab, setTab] = useState('All')
  const [rows, setRows] = useState(USE_LIVE_DATA ? [] : seedRows)
  const [loading, setLoading] = useState(USE_LIVE_DATA)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!USE_LIVE_DATA) return

    async function load() {
      setLoading(true)
      setError('')
      try {
        // GET /fortimates/requests — every registration with its status
        const data = await apiGet('/requests')
        setRows(data.map((u) => ({ ...u, decision: u.status })))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const [actionError, setActionError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()
  const [busyKey, setBusyKey] = useState(null)

  async function decide(key, decision) {
    const row = rows.find((r) => `${r.type}-${r.id ?? r.email}` === key)
    if (!row) return
    if (!USE_LIVE_DATA) {
      setRows((prev) => prev.map((r) => (`${r.type}-${r.id ?? r.email}` === key ? { ...r, decision } : r)))
      return
    }
    setActionError('')
    setBusyKey(key)
    try {
      // POST /fortimates/requests/{id}/decision — approved users are added to the KYC List
      const updated = await apiPost(`/requests/${row.id}/decision`, { decision })
      setRows((prev) =>
        prev.map((r) => (`${r.type}-${r.id ?? r.email}` === key ? { ...r, ...updated, decision: updated.status } : r))
      )
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyKey(null)
    }
  }

  const visibleRows = tab === 'All' ? rows : rows.filter((r) => r.type === tab)

  return (
    <div className="bg-facet-card border border-white/5 clip-facet overflow-hidden">
      <div className="p-6 pb-0">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 text-xs clip-facet-r transition-colors ${
                tab === t
                  ? 'bg-signal-500/15 text-signal-400 border border-signal-500/40'
                  : 'text-mist-400 border border-white/5 hover:text-mist-200'
              }`}
            >
              {t}
            </button>
          ))}
          {USE_LIVE_DATA && (
            <button
              onClick={() => setShowForm(true)}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-gold-signal text-abyss-950 clip-facet-r"
            >
              <Plus size={14} />
              New Application
            </button>
          )}
        </div>
        {actionError && <p className="mt-3 text-xs text-red-400">{actionError}</p>}
      </div>

      {showForm && (
        <NewApplicationForm
          onClose={() => setShowForm(false)}
          onCreated={(created) => {
            setRows((prev) => [{ ...created, decision: created.status }, ...prev])
            setShowForm(false)
            setTab('All')
          }}
        />
      )}

      <div className="overflow-x-auto mt-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-mist-400 border-t border-white/5">
              <th className="px-6 py-3 font-normal">Name</th>
              <th className="px-6 py-3 font-normal">Email</th>
              <th className="px-6 py-3 font-normal">Country</th>
              <th className="px-6 py-3 font-normal">Type</th>
              <th className="px-6 py-3 font-normal">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-mist-400 text-sm">
                  Loading requests…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-red-400 text-sm">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && visibleRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-mist-400 text-sm">
                  No pending requests.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              visibleRows.map((r) => {
                const key = `${r.type}-${r.id ?? r.email}`
                return (
                  <tr key={key} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3.5 text-mist-100">{r.name}</td>
                    <td className="px-6 py-3.5 text-mist-400">{r.email}</td>
                    <td className="px-6 py-3.5 text-mist-400">{r.country}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-1 text-xs bg-signal-500/10 text-signal-400 clip-facet-r">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {r.decision === 'pending' && (
                        <div className="flex items-center gap-2">
                          {USE_LIVE_DATA && (
                            <button
                              onClick={() => navigate(`${FM_DASH}/kyc-module?id=${r.id}`)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white/5 text-mist-200 hover:bg-white/10 clip-facet-r transition-colors"
                            >
                              <FileSearch size={13} />
                              Review
                            </button>
                          )}
                          <button
                            disabled={busyKey === key}
                            onClick={() => decide(key, 'approved')}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-signal-500/10 text-signal-400 hover:bg-signal-500/20 clip-facet-r transition-colors"
                          >
                            <Check size={13} />
                            Approve
                          </button>
                          <button
                            disabled={busyKey === key}
                            onClick={() => decide(key, 'rejected')}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 clip-facet-r transition-colors"
                          >
                            <X size={13} />
                            Reject
                          </button>
                        </div>
                      )}
                      {r.decision === 'approved' && (
                        <span className="text-xs font-medium text-signal-400">Approved</span>
                      )}
                      {r.decision === 'rejected' && (
                        <span className="text-xs font-medium text-red-400">Rejected</span>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
