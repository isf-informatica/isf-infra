import { useEffect, useMemo, useState } from 'react'
import useAuthStore from '../../store/authStore'
import { getStats, getAllTickets, getDepartments } from '../../api/serviceDesk'
import {
  INK, SUB, LINE, inputCls, inputStyle, focusOn, focusOff, fmtDate,
  PageTitle, SearchBar, PriorityBadge, StatusBadge, GhostBtn, TicketDetailModal, useNotify,
} from './supportShared'

const STAT_CARDS = [
  ['total', 'Total Tokens'],
  ['open', 'Open'],
  ['assigned', 'Assigned'],
  ['completed', 'Completed'],
  ['verified', 'Verified / Closed'],
]
const STATUSES = ['open', 'assigned', 'completed', 'verified', 'reopened']
const Th = ({ children }) => (
  <th className="text-left text-[11px] font-bold uppercase tracking-wider px-3 py-3 whitespace-nowrap" style={{ color: SUB }}>{children}</th>
)
const EMPTY = { q: '', department_id: '', status: '', from_date: '', to_date: '' }

export default function MasterView() {
  const { token } = useAuthStore()
  const notify = useNotify()
  const [stats, setStats] = useState(null)
  const [departments, setDepartments] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    getStats(token).then(setStats).catch((e) => notify(e.message, 'error'))
    getDepartments(token).then(setDepartments).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    setLoading(true)
    getAllTickets(token, filters)
      .then((r) => { setRows(r); setPage(1) })
      .catch((e) => notify(e.message, 'error'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filters])

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))
  const runSearch = () => setFilters((f) => ({ ...f, q: search.trim() }))

  const total = rows.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const view = useMemo(() => rows.slice(start, start + pageSize), [rows, start, pageSize])
  const pageNumbers = useMemo(() => {
    const from = Math.max(1, Math.min(page - 2, pages - 4))
    const to = Math.min(pages, from + 4)
    return Array.from({ length: to - from + 1 }, (_, i) => from + i)
  }, [page, pages])

  return (
    <div className="max-w-6xl">
      <PageTitle title="Service Desk — Master Overview"
        subtitle="Full visibility across every department, token, and its complete timeline." />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
        {STAT_CARDS.map(([k, label]) => (
          <div key={k} className="bg-white border px-4 py-4" style={{ borderColor: LINE }}>
            <div className="text-2xl font-extrabold" style={{ color: INK }}>{stats ? stats[k] : '—'}</div>
            <div className="text-[12px] mt-1" style={{ color: SUB }}>{label}</div>
          </div>
        ))}
      </div>

      <SearchBar value={search} onChange={(v) => { setSearch(v); if (!v.trim() && filters.q) setFilters((f) => ({ ...f, q: '' })) }}
        onSubmit={runSearch} placeholder="Search anything — token, subject, department, priority, status…" />

      <div className="bg-white border p-5 mt-4" style={{ borderColor: LINE }}>
        <h2 className="text-[13px] font-bold mb-3" style={{ color: INK }}>Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="f-dept" className="block text-[12px] font-semibold mb-1.5" style={{ color: INK }}>Department</label>
            <select id="f-dept" className={inputCls} style={inputStyle} value={filters.department_id} onChange={setFilter('department_id')} onFocus={focusOn} onBlur={focusOff}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-status" className="block text-[12px] font-semibold mb-1.5" style={{ color: INK }}>Status</label>
            <select id="f-status" className={inputCls} style={inputStyle} value={filters.status} onChange={setFilter('status')} onFocus={focusOn} onBlur={focusOff}>
              <option value="">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="f-from" className="block text-[12px] font-semibold mb-1.5" style={{ color: INK }}>From Date</label>
            <input id="f-from" type="date" className={inputCls} style={inputStyle} value={filters.from_date} max={filters.to_date || undefined}
              onChange={setFilter('from_date')} onFocus={focusOn} onBlur={focusOff} />
          </div>
          <div>
            <label htmlFor="f-to" className="block text-[12px] font-semibold mb-1.5" style={{ color: INK }}>To Date</label>
            <input id="f-to" type="date" className={inputCls} style={inputStyle} value={filters.to_date} min={filters.from_date || undefined}
              onChange={setFilter('to_date')} onFocus={focusOn} onBlur={focusOff} />
          </div>
        </div>
      </div>

      <div className="bg-white border p-5 mt-4" style={{ borderColor: LINE }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-[13px] font-bold" style={{ color: INK }}>All Service Desk Tokens</h2>
          <label className="flex items-center gap-2 text-[13px]" style={{ color: SUB }}>
            Show
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="px-2 py-1.5 text-[13px] border bg-white" style={inputStyle} aria-label="Entries per page">
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            entries
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-t" style={{ borderColor: LINE }}>
            <thead>
              <tr className="border-b" style={{ borderColor: LINE }}>
                <Th>Token</Th><Th>Department</Th><Th>Subject</Th><Th>Raised by</Th><Th>Priority</Th><Th>Status</Th><Th>Raised on</Th><Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-10" style={{ color: SUB }}>Loading…</td></tr>}
              {!loading && view.length === 0 && <tr><td colSpan={8} className="text-center py-10" style={{ color: SUB }}>No tokens found.</td></tr>}
              {!loading && view.map((t) => (
                <tr key={t.id} className="border-b" style={{ borderColor: LINE, color: INK }}>
                  <td className="px-3 py-3 font-semibold whitespace-nowrap">{t.token_no}</td>
                  <td className="px-3 py-3">{t.department_name}</td>
                  <td className="px-3 py-3 max-w-[220px] truncate" title={t.subject}>{t.subject}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{t.raised_by_name}</td>
                  <td className="px-3 py-3"><PriorityBadge value={t.priority} /></td>
                  <td className="px-3 py-3"><StatusBadge value={t.status} /></td>
                  <td className="px-3 py-3 whitespace-nowrap">{fmtDate(t.created_at)}</td>
                  <td className="px-3 py-3">
                    <GhostBtn type="button" onClick={() => setViewing(t)}><i className="ti ti-eye text-sm" aria-hidden="true"></i> View</GhostBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-[13px]" style={{ color: SUB }}>
          <span>{total === 0 ? 'Showing 0 entries' : `Showing ${start + 1} to ${Math.min(start + pageSize, total)} of ${total} entries`}</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 bg-transparent border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" style={{ color: INK }}>Previous</button>
            {pageNumbers.map((n) => (
              <button key={n} type="button" onClick={() => setPage(n)} aria-current={n === page ? 'page' : undefined}
                className="w-8 h-8 border cursor-pointer text-[13px]"
                style={{ background: n === page ? INK : '#fff', color: n === page ? '#fff' : INK, borderColor: n === page ? INK : LINE }}>{n}</button>
            ))}
            <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 bg-transparent border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" style={{ color: INK }}>Next</button>
          </div>
        </div>
      </div>

      {viewing && <TicketDetailModal token={token} ticket={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}