import { useEffect, useRef, useState } from 'react'
import useAuthStore from '../../store/authStore'
import { getDepartments, getMyTickets, raiseTicket } from '../../api/serviceDesk'
import {
  INK, SUB, LINE, BG, BORDER_INPUT, inputCls, inputStyle, focusOn, focusOff, fmtDate,
  PageTitle, Tabs, PriorityBadge, StatusBadge, GhostBtn, PrimaryBtn, AttachmentsModal, useNotify,
} from './supportShared'

const BANNERS = ['#1A1A18', '#2F2F2C', '#454541', '#5C5C57', '#3A3A37']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const MAX_FILES = 5
const MAX_MB = 10

export default function RequesterView() {
  const { token } = useAuthStore()
  const notify = useNotify()
  const [tab, setTab] = useState('raise')
  const [departments, setDepartments] = useState([])
  const [deptLoading, setDeptLoading] = useState(true)
  const [deptError, setDeptError] = useState('')
  const [deptId, setDeptId] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const fileRef = useRef(null)

  const loadTickets = () => {
    setTicketsLoading(true)
    getMyTickets(token).then(setTickets).catch((e) => notify(e.message, 'error')).finally(() => setTicketsLoading(false))
  }
  const loadDepartments = () => {
    setDeptLoading(true)
    setDeptError('')
    getDepartments(token).then(setDepartments).catch((e) => setDeptError(e.message)).finally(() => setDeptLoading(false))
  }

  useEffect(() => {
    loadDepartments()
    loadTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    const merged = [...files, ...picked]
    if (merged.length > MAX_FILES) return notify(`You can attach up to ${MAX_FILES} files.`, 'error')
    const big = merged.find((f) => f.size > MAX_MB * 1024 * 1024)
    if (big) return notify(`${big.name} is larger than ${MAX_MB} MB.`, 'error')
    setFiles(merged)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!deptId) return notify('Please select a department first.', 'error')
    setSubmitting(true)
    try {
      const res = await raiseTicket(token, { departmentId: deptId, subject: subject.trim(), description, priority, files })
      notify(`Token raised: ${res.token_no}`)
      setDeptId(''); setSubject(''); setDescription(''); setPriority('Medium'); setFiles([])
      loadTickets()
      setTab('mine')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <PageTitle title="Service Desk" subtitle="Raise a request to any department and track its progress." />
      <Tabs tabs={[['raise', 'Raise New Request'], ['mine', 'My Raised Requests']]} value={tab} onChange={setTab} />

      {tab === 'raise' && (
        <form onSubmit={submit} className="bg-white border p-6 mt-5" style={{ borderColor: LINE }}>
          <h2 className="text-[13px] font-bold mb-3" style={{ color: INK }}>1. Select department</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-7">
            {departments.map((d, i) => {
              const sel = String(deptId) === String(d.id)
              return (
                <button key={d.id} type="button" onClick={() => setDeptId(d.id)} aria-pressed={sel}
                  className="relative text-left bg-white border-2 cursor-pointer p-0 transition-colors"
                  style={{ borderColor: sel ? INK : LINE }}>
                  {sel && (
                    <span className="absolute top-1.5 right-1.5 flex" style={{ color: '#fff' }}>
                      <i className="ti ti-circle-check-filled text-[18px]" aria-hidden="true"></i>
                    </span>
                  )}
                  <div className="h-14 flex items-center justify-center" style={{ background: BANNERS[i % BANNERS.length] }}>
                    <i className="ti ti-bell-ringing text-white text-xl" aria-hidden="true"></i>
                  </div>
                  <div className="text-[12px] font-bold text-center px-2 py-2.5" style={{ color: INK }}>{d.name}</div>
                </button>
              )
            })}
            {deptLoading && <p className="text-[13px] col-span-full" style={{ color: SUB }}>Loading departments…</p>}
            {!deptLoading && deptError && (
              <div className="col-span-full flex flex-wrap items-center gap-3 px-3 py-2.5 text-[13px] border"
                style={{ background: '#FDECEC', borderColor: '#E8A5A5', color: '#8A2A2A' }}>
                <i className="ti ti-alert-circle text-sm shrink-0" aria-hidden="true"></i>
                <span>Could not load departments: {deptError}</span>
                <button type="button" onClick={loadDepartments}
                  className="ml-auto font-semibold underline bg-transparent border-none cursor-pointer" style={{ color: '#8A2A2A' }}>Retry</button>
              </div>
            )}
            {!deptLoading && !deptError && departments.length === 0 && (
              <p className="text-[13px] col-span-full" style={{ color: SUB }}>No departments available yet.</p>
            )}
          </div>

          <h2 className="text-[13px] font-bold mb-3" style={{ color: INK }}>2. Request details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="sd-subject" className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Subject</label>
              <input id="sd-subject" className={inputCls} style={inputStyle} value={subject} maxLength={200} required
                onChange={(e) => setSubject(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
            </div>
            <div>
              <label htmlFor="sd-desc" className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Description</label>
              <textarea id="sd-desc" rows={4} className={inputCls} style={inputStyle} value={description}
                onChange={(e) => setDescription(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
            </div>
            <div>
              <label htmlFor="sd-priority" className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Priority</label>
              <select id="sd-priority" className={inputCls} style={inputStyle} value={priority}
                onChange={(e) => setPriority(e.target.value)} onFocus={focusOn} onBlur={focusOff}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <span className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Attachments (optional)</span>
              <input ref={fileRef} type="file" multiple onChange={onPickFiles} className="hidden" aria-label="Choose files"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx,.csv,.zip" />
              <GhostBtn type="button" onClick={() => fileRef.current?.click()}>
                <i className="ti ti-paperclip text-base" aria-hidden="true"></i> Choose files
              </GhostBtn>
              <span className="text-[12px] ml-3" style={{ color: SUB }}>Up to {MAX_FILES} files, {MAX_MB} MB each</span>
              {files.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-[12.5px] border"
                      style={{ borderColor: LINE, color: INK, background: BG + '66' }}>
                      <span className="truncate">{f.name}</span>
                      <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                        aria-label={`Remove ${f.name}`} className="bg-transparent border-none cursor-pointer shrink-0" style={{ color: SUB }}>
                        <i className="ti ti-x text-sm" aria-hidden="true"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <PrimaryBtn type="submit" disabled={submitting} className="mt-6 !px-6">
            {submitting
              ? <><i className="ti ti-loader-2 animate-spin text-base" aria-hidden="true"></i> Raising</>
              : <><i className="ti ti-send text-base" aria-hidden="true"></i> Raise Token</>}
          </PrimaryBtn>
        </form>
      )}

      {tab === 'mine' && (
        <div className="mt-5 space-y-2.5">
          {ticketsLoading && <p className="text-[13px] py-8 text-center" style={{ color: SUB }}>Loading…</p>}
          {!ticketsLoading && tickets.length === 0 && (
            <div className="bg-white border py-12 text-center text-[13px]" style={{ borderColor: LINE, color: SUB }}>
              You haven&apos;t raised any request yet.
            </div>
          )}
          {tickets.map((t) => (
            <div key={t.id} className="bg-white border px-4 py-3.5 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: LINE }}>
              <div className="min-w-0">
                <div className="text-[12px] font-bold" style={{ color: INK }}>{t.token_no}</div>
                <div className="text-[14px] font-semibold mt-0.5" style={{ color: INK }}>{t.subject}</div>
                <div className="text-[12px] mt-0.5" style={{ color: SUB }}>{t.department_name} · {fmtDate(t.created_at)}</div>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge value={t.priority} />
                <StatusBadge value={t.status} />
                <GhostBtn type="button" onClick={() => setViewing(t)}>
                  <i className="ti ti-paperclip text-sm" aria-hidden="true"></i> Files
                </GhostBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && <AttachmentsModal token={token} ticket={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}