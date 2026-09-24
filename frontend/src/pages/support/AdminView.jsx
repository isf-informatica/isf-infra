import { useEffect, useMemo, useState } from 'react'
import useAuthStore from '../../store/authStore'
import {
  getAllTickets, getStaff, getDepartments, assignTicket, verifyTicket, addStaff, removeStaff,
} from '../../api/serviceDesk'
import {
  INK, SUB, LINE, BG, inputCls, inputStyle, focusOn, focusOff, fmtDate,
  PageTitle, Tabs, SearchBar, PriorityBadge, StatusBadge, GhostBtn, PrimaryBtn,
  TicketDetailModal, PromptDialog, ConfirmDialog, useNotify,
} from './supportShared'

const matches = (t, q) => {
  if (!q) return true
  const k = q.toLowerCase()
  return [t.token_no, t.subject, t.description, t.department_name, t.priority, t.status]
    .some((v) => (v || '').toLowerCase().includes(k))
}

function DeptTag({ children }) {
  return <span className="inline-block text-[10.5px] font-bold px-2 py-0.5 mb-1" style={{ background: BG, color: INK }}>{children || '—'}</span>
}

function TicketRow({ t, meta, actions }) {
  return (
    <div className="bg-white border px-4 py-3.5 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: LINE }}>
      <div className="min-w-0 flex-1 basis-[320px]">
        <DeptTag>{t.department_name}</DeptTag>
        <div className="text-[12px] font-bold" style={{ color: INK }}>{t.token_no}</div>
        <div className="text-[14px] font-semibold mt-0.5" style={{ color: INK }}>{t.subject}</div>
        <p className="text-[12.5px] mt-1 max-w-2xl" style={{ color: INK }}>{t.description || 'Koi description nahi di gayi.'}</p>
        <div className="text-[12px] mt-1" style={{ color: SUB }}>{meta}</div>
        <div className="mt-1.5"><PriorityBadge value={t.priority} /></div>
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  )
}

const Empty = ({ children }) => (
  <div className="bg-white border py-12 text-center text-[13px]" style={{ borderColor: LINE, color: SUB }}>{children}</div>
)

export default function AdminView() {
  const { token } = useAuthStore()
  const notify = useNotify()
  const [tickets, setTickets] = useState([])
  const [staff, setStaff] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('open')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [pick, setPick] = useState({})          // ticketId -> staff user_id
  const [busy, setBusy] = useState(null)        // ticket id being acted on
  const [viewing, setViewing] = useState(null)
  const [verifying, setVerifying] = useState(null)   // { ticket, approve }
  const [removing, setRemoving] = useState(null)     // staff row
  const [form, setForm] = useState({ departmentId: '', name: '', email: '', password: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getAllTickets(token, {}), getStaff(token)])
      .then(([t, s]) => { setTickets(t); setStaff(s) })
      .catch((e) => notify(e.message, 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getDepartments(token).then(setDepartments).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const visible = useMemo(() => tickets.filter((t) => matches(t, query)), [tickets, query])
  const openList = visible.filter((t) => t.status === 'open')
  const doneList = visible.filter((t) => t.status === 'completed')

  const doAssign = async (t) => {
    const staffId = pick[t.id]
    if (!staffId) return notify('Please select a staff member first.', 'error')
    setBusy(t.id)
    try {
      await assignTicket(token, t.id, staffId)
      notify(`${t.token_no} assigned`)
      load()
    } catch (e) { notify(e.message, 'error') } finally { setBusy(null) }
  }

  const doVerify = async (remarks) => {
    const { ticket, approve } = verifying
    setVerifying(null)
    setBusy(ticket.id)
    try {
      await verifyTicket(token, ticket.id, approve, remarks)
      notify(approve ? `${ticket.token_no} verified and closed` : `${ticket.token_no} reopened`)
      load()
    } catch (e) { notify(e.message, 'error') } finally { setBusy(null) }
  }

  const submitStaff = async (e) => {
    e.preventDefault()
    if (!form.departmentId) return notify('Department select karo.', 'error')
    setSaving(true)
    try {
      await addStaff(token, { ...form, name: form.name.trim(), email: form.email.trim() })
      notify('Staff add ho gaya.')
      setForm({ departmentId: '', name: '', email: '', password: '' })
      load()
    } catch (err) { notify(err.message, 'error') } finally { setSaving(false) }
  }

  const doRemove = async () => {
    const s = removing
    setRemoving(null)
    try {
      await removeStaff(token, s.member_id)
      notify('Staff removed')
      load()
    } catch (e) { notify(e.message, 'error') }
  }

  const filesBtn = (t) => (
    <GhostBtn type="button" onClick={() => setViewing(t)}><i className="ti ti-paperclip text-sm" aria-hidden="true"></i> Files</GhostBtn>
  )

  return (
    <div className="max-w-5xl">
      <PageTitle title="Service Desk — All Departments" subtitle="Department Head — assign new tokens and verify completed work" />

      <SearchBar value={search} onChange={(v) => { setSearch(v); if (!v.trim()) setQuery('') }}
        onSubmit={() => setQuery(search.trim())} placeholder="Search anything — token, subject, department, priority, status…" />

      <Tabs value={tab} onChange={setTab} tabs={[
        ['open', 'New / Open Tokens'], ['completed', 'Pending Verification'], ['all', 'All Tokens'], ['staff', 'Manage Staff'],
      ]} />

      <div className="mt-5 space-y-2.5">
        {loading && tab !== 'staff' && <p className="text-[13px] py-8 text-center" style={{ color: SUB }}>Loading…</p>}

        {/* OPEN */}
        {!loading && tab === 'open' && (openList.length === 0
          ? <Empty>Koi open token nahi hai.</Empty>
          : openList.map((t) => {
            const options = staff.filter((s) => s.department_id === t.target_department_id)
            return (
              <TicketRow key={t.id} t={t}
                meta={`Raised by ${t.raised_by_name || `User #${t.raised_by}`} · ${fmtDate(t.created_at)}`}
                actions={<>
                  {filesBtn(t)}
                  <select aria-label={`Assign ${t.token_no} to`} value={pick[t.id] || ''} disabled={options.length === 0}
                    onChange={(e) => setPick({ ...pick, [t.id]: e.target.value })}
                    className="px-2.5 py-2 text-[12.5px] border bg-white min-w-[150px]" style={inputStyle}>
                    <option value="">{options.length ? 'Select Staff' : 'No staff in dept'}</option>
                    {options.map((s) => <option key={s.user_id} value={s.user_id}>{s.name}</option>)}
                  </select>
                  <PrimaryBtn type="button" disabled={busy === t.id} onClick={() => doAssign(t)} className="!px-4 !py-2 !text-[12.5px]">
                    <i className="ti ti-check text-sm" aria-hidden="true"></i> Assign
                  </PrimaryBtn>
                </>} />
            )
          }))}

        {/* PENDING VERIFICATION */}
        {!loading && tab === 'completed' && (doneList.length === 0
          ? <Empty>Verification ke liye kuch pending nahi hai.</Empty>
          : doneList.map((t) => (
            <TicketRow key={t.id} t={t}
              meta={<><b>Completion remarks:</b> {t.completion_remarks || 'No remarks'} · {fmtDate(t.completed_at)}</>}
              actions={<>
                {filesBtn(t)}
                <PrimaryBtn type="button" disabled={busy === t.id} onClick={() => setVerifying({ ticket: t, approve: true })} className="!px-4 !py-2 !text-[12.5px]">
                  <i className="ti ti-check text-sm" aria-hidden="true"></i> Verify &amp; Close
                </PrimaryBtn>
                <GhostBtn type="button" danger disabled={busy === t.id} onClick={() => setVerifying({ ticket: t, approve: false })}>
                  <i className="ti ti-arrow-back-up text-sm" aria-hidden="true"></i> Reopen
                </GhostBtn>
              </>} />
          )))}

        {/* ALL */}
        {!loading && tab === 'all' && (visible.length === 0
          ? <Empty>Koi token nahi hai.</Empty>
          : visible.map((t) => (
            <TicketRow key={t.id} t={t}
              meta={`${fmtDate(t.created_at)}${t.assigned_to ? ` · Assigned to ${t.assigned_to_name || `User #${t.assigned_to}`}` : ''}`}
              actions={<>{filesBtn(t)}<StatusBadge value={t.status} /></>} />
          )))}

        {/* MANAGE STAFF */}
        {tab === 'staff' && (
          <>
            <form onSubmit={submitStaff} className="bg-white border p-6" style={{ borderColor: LINE }}>
              <h2 className="text-[13px] font-bold mb-4" style={{ color: INK }}>Add New Staff</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="st-dept" className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Department</label>
                  <select id="st-dept" required className={inputCls} style={inputStyle} value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })} onFocus={focusOn} onBlur={focusOff}>
                    <option value="">Select Department</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="st-name" className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Name</label>
                  <input id="st-name" required maxLength={100} className={inputCls} style={inputStyle} value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <div>
                  <label htmlFor="st-email" className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Email</label>
                  <input id="st-email" type="email" required className={inputCls} style={inputStyle} value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} onFocus={focusOn} onBlur={focusOff} />
                </div>
                <div>
                  <label htmlFor="st-pass" className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Password</label>
                  <input id="st-pass" type="password" required minLength={6} autoComplete="new-password" className={inputCls} style={inputStyle} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} onFocus={focusOn} onBlur={focusOff} />
                </div>
              </div>
              <PrimaryBtn type="submit" disabled={saving} className="mt-5 !px-6">
                {saving
                  ? <><i className="ti ti-loader-2 animate-spin text-base" aria-hidden="true"></i> Adding</>
                  : <><i className="ti ti-user-plus text-base" aria-hidden="true"></i> Add Staff</>}
              </PrimaryBtn>
            </form>

            <div className="bg-white border p-6" style={{ borderColor: LINE }}>
              <h2 className="text-[13px] font-bold mb-3" style={{ color: INK }}>Current Staff</h2>
              {loading && <p className="text-[13px]" style={{ color: SUB }}>Loading…</p>}
              {!loading && staff.length === 0 && <p className="text-[13px] py-4 text-center" style={{ color: SUB }}>Abhi koi staff add nahi hua hai.</p>}
              {staff.map((s) => (
                <div key={s.member_id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-t" style={{ borderColor: LINE }}>
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: INK }}>{s.name}</div>
                    <div className="text-[12px]" style={{ color: SUB }}>{s.email} · {s.department_name}</div>
                  </div>
                  <GhostBtn type="button" danger onClick={() => setRemoving(s)}>
                    <i className="ti ti-user-minus text-sm" aria-hidden="true"></i> Remove
                  </GhostBtn>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {viewing && <TicketDetailModal token={token} ticket={viewing} onClose={() => setViewing(null)} />}
      {verifying && (
        <PromptDialog title={verifying.approve ? 'Verify & Close — Remarks' : 'Reopen — Remarks'} placeholder="Remarks (optional)"
          submitLabel={verifying.approve ? 'Verify & Close' : 'Reopen'} onSubmit={doVerify} onCancel={() => setVerifying(null)} />
      )}
      {removing && (
        <ConfirmDialog message={`Remove ${removing.name} from ${removing.department_name}?`} confirmLabel="Remove"
          onConfirm={doRemove} onCancel={() => setRemoving(null)} />
      )}
    </div>
  )
}