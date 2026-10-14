import { useEffect, useState } from 'react'
import { getAttachments, getAttachmentBlobUrl, getTicketDetail } from '../../api/serviceDesk'

/* ───────────── tokens (same gray / white palette as Login) ───────────── */
export const BG = '#E8E8E3'
export const INK = '#1A1A18'
export const SUB = '#5C5C57'
export const LINE = INK + '1F'
export const BORDER_INPUT = INK + '33'

export const inputCls = 'w-full px-3.5 py-2.5 text-sm border outline-none transition-colors bg-white'
export const inputStyle = { borderColor: BORDER_INPUT, color: INK }
export const focusOn = (e) => { e.target.style.borderColor = INK }
export const focusOff = (e) => { e.target.style.borderColor = BORDER_INPUT }

export const fmtDate = (iso) => (iso ? new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString() : '')
const isImage = (name) => /\.(jpe?g|png|gif|webp|bmp)$/i.test(name)

/* ───────────── notifications (toast) ─────────────
   useNotify() gives a stable notify(message, type). <NotifyHost /> must be
   rendered once (SupportDesk.jsx does it) to actually show the toast. */
let notifyListener = null
const notify = (message, type = 'success') => { if (notifyListener) notifyListener({ message, type }) }
export const useNotify = () => notify

export function NotifyHost() {
  const [toast, setToast] = useState(null)
  useEffect(() => {
    let timer
    notifyListener = (t) => { setToast(t); clearTimeout(timer); timer = setTimeout(() => setToast(null), 3500) }
    return () => { notifyListener = null; clearTimeout(timer) }
  }, [])
  if (!toast) return null
  return (
    <div className="fixed top-5 right-5 z-[60] flex items-center gap-2.5 px-4 py-3 text-[13px] text-white shadow-lg max-w-sm"
      style={{ background: toast.type === 'error' ? '#8A2A2A' : INK }} role="status">
      <i className={`ti ${toast.type === 'error' ? 'ti-alert-circle' : 'ti-circle-check'} text-base shrink-0`} aria-hidden="true"></i>
      {toast.message}
    </div>
  )
}

/* ───────────── badges ───────────── */
const PRIORITY_STYLE = {
  low:    { bg: '#EFEFEA', fg: '#5C5C57' },
  medium: { bg: '#E1E4EA', fg: '#2F3B52' },
  high:   { bg: '#F3E3CF', fg: '#7A4A12' },
  urgent: { bg: '#F6D9D9', fg: '#8A2A2A' },
}
const STATUS_STYLE = {
  open:      { bg: '#F3EBC8', fg: '#6B5A10' },
  assigned:  { bg: '#E1E4EA', fg: '#2F3B52' },
  completed: { bg: '#E6E0EE', fg: '#4A3A66' },
  verified:  { bg: '#DDEBDD', fg: '#2D5A2D' },
  reopened:  { bg: '#F6D9D9', fg: '#8A2A2A' },
}

function Badge({ style, children }) {
  return (
    <span className="inline-block text-[10.5px] font-bold uppercase tracking-wide px-2.5 py-1"
      style={{ background: style.bg, color: style.fg }}>{children}</span>
  )
}
export const PriorityBadge = ({ value }) => <Badge style={PRIORITY_STYLE[(value || '').toLowerCase()] || PRIORITY_STYLE.low}>{value}</Badge>
export const StatusBadge = ({ value }) => <Badge style={STATUS_STYLE[value] || STATUS_STYLE.open}>{value}</Badge>

/* ───────────── buttons ───────────── */
export function PrimaryBtn({ className = '', children, ...rest }) {
  return (
    <button {...rest} style={{ background: INK, ...(rest.style || {}) }}
      className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  )
}

export function GhostBtn({ danger, className = '', children, ...rest }) {
  return (
    <button {...rest}
      style={{ borderColor: danger ? '#E8A5A5' : BORDER_INPUT, color: danger ? '#8A2A2A' : INK, ...(rest.style || {}) }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  )
}

/* ───────────── layout bits ───────────── */
export function PageTitle({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold uppercase tracking-tight" style={{ color: INK }}>{title}</h1>
      {subtitle && <p className="text-sm mt-1" style={{ color: SUB }}>{subtitle}</p>}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 mt-6 border-b" style={{ borderColor: LINE }} role="tablist">
      {tabs.map(([k, label]) => (
        <button key={k} type="button" role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className="px-4 py-2.5 text-[13px] font-semibold bg-transparent border-none cursor-pointer -mb-px"
          style={{ color: value === k ? INK : SUB, borderBottom: `2px solid ${value === k ? INK : 'transparent'}` }}>
          {label}
        </button>
      ))}
    </div>
  )
}

export function SearchBar({ value, onChange, onSubmit, placeholder }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="flex items-stretch gap-3 mt-4">
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        aria-label="Search tokens" className={`${inputCls} flex-1`} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
      <PrimaryBtn type="submit" className="!px-6 flex-col !gap-0.5 !text-[12px]">
        <i className="ti ti-search text-base" aria-hidden="true"></i> Search
      </PrimaryBtn>
    </form>
  )
}

/* ───────────── modals ───────────── */
function Modal({ title, subtitle, onClose, wide, children }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: '#1A1A1899' }}
      onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`bg-white w-full border max-h-[90vh] overflow-y-auto ${wide ? 'max-w-2xl' : 'max-w-lg'}`} style={{ borderColor: LINE }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: LINE }}>
          <div>
            <div className="text-sm font-extrabold uppercase tracking-tight" style={{ color: INK }}>{title}</div>
            {subtitle && <div className="text-[12px]" style={{ color: SUB }}>{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="bg-transparent border-none cursor-pointer" style={{ color: SUB }}>
            <i className="ti ti-x text-lg" aria-hidden="true"></i>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function AttachmentItem({ token, att }) {
  const [thumb, setThumb] = useState('')
  useEffect(() => {
    let url = ''
    let alive = true
    if (isImage(att.file_name)) {
      getAttachmentBlobUrl(token, att.id).then((u) => { url = u; if (alive) setThumb(u) }).catch(() => {})
    }
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [token, att.id, att.file_name])

  const open = async () => {
    try { window.open(await getAttachmentBlobUrl(token, att.id), '_blank', 'noopener') } catch { /* ignore */ }
  }

  return (
    <button type="button" onClick={open} className="w-[130px] text-center bg-transparent border-none cursor-pointer p-0">
      <div className="w-[130px] h-[110px] flex items-center justify-center border overflow-hidden" style={{ borderColor: LINE, background: BG + '80' }}>
        {thumb
          ? <img src={thumb} alt={att.file_name} className="w-full h-full object-cover" />
          : <i className="ti ti-file text-[32px]" style={{ color: SUB }} aria-hidden="true"></i>}
      </div>
      <div className="text-[11.5px] mt-1.5 break-words" style={{ color: INK }}>{att.file_name}</div>
      {att.uploaded_stage && att.uploaded_stage !== 'raised' && (
        <div className="text-[10.5px] uppercase font-bold" style={{ color: SUB }}>{att.uploaded_stage}</div>
      )}
    </button>
  )
}

function AttachmentGrid({ token, items }) {
  return (
    <div className="flex flex-wrap gap-4">
      {items.map((a) => <AttachmentItem key={a.id} token={token} att={a} />)}
    </div>
  )
}

export function AttachmentsModal({ token, ticket, onClose }) {
  const [items, setItems] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    getAttachments(token, ticket.id).then(setItems).catch((e) => setErr(e.message))
  }, [token, ticket.id])

  return (
    <Modal title="Attachments" subtitle={ticket.token_no} onClose={onClose}>
      <div className="p-5 min-h-[120px]">
        {err && <p className="text-[13px]" style={{ color: '#8A2A2A' }}>{err}</p>}
        {!err && items === null && <p className="text-[13px]" style={{ color: SUB }}>Loading…</p>}
        {items && items.length === 0 && <p className="text-[13px]" style={{ color: SUB }}>No attachments uploaded for this token.</p>}
        {items && items.length > 0 && <AttachmentGrid token={token} items={items} />}
      </div>
    </Modal>
  )
}

const Field = ({ label, children }) => (
  <div>
    <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: SUB }}>{label}</div>
    <div className="text-[13px] mt-0.5" style={{ color: INK }}>{children || '—'}</div>
  </div>
)

export function TicketDetailModal({ token, ticket, onClose }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    getTicketDetail(token, ticket.id).then(setData).catch((e) => setErr(e.message))
  }, [token, ticket.id])

  const t = data?.ticket || ticket
  return (
    <Modal title={t.token_no} subtitle={t.subject} onClose={onClose} wide>
      <div className="p-5 space-y-5">
        {err && <p className="text-[13px]" style={{ color: '#8A2A2A' }}>{err}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Department">{t.department_name}</Field>
          <Field label="Raised by">{t.raised_by_name}</Field>
          <Field label="Raised on">{fmtDate(t.created_at)}</Field>
          <Field label="Priority"><PriorityBadge value={t.priority} /></Field>
          <Field label="Status"><StatusBadge value={t.status} /></Field>
          <Field label="Assigned to">{t.assigned_to_name}</Field>
        </div>

        <Field label="Description"><span className="whitespace-pre-wrap">{t.description}</span></Field>
        {t.completion_remarks && <Field label="Completion remarks">{t.completion_remarks}</Field>}
        {t.verification_remarks && <Field label="Verification remarks">{t.verification_remarks}</Field>}

        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: SUB }}>Timeline</div>
          {!data && !err && <p className="text-[13px]" style={{ color: SUB }}>Loading…</p>}
          {data && data.logs.length === 0 && <p className="text-[13px]" style={{ color: SUB }}>No activity yet.</p>}
          {data && data.logs.map((l) => (
            <div key={l.id} className="flex gap-3 py-2 border-t" style={{ borderColor: LINE }}>
              <div className="w-[92px] shrink-0"><StatusBadge value={l.action} /></div>
              <div className="min-w-0">
                <div className="text-[12.5px]" style={{ color: INK }}>
                  <b>{l.action_by_name || 'System'}</b> · <span style={{ color: SUB }}>{fmtDate(l.created_at)}</span>
                </div>
                {l.remarks && <div className="text-[12.5px] mt-0.5" style={{ color: INK }}>{l.remarks}</div>}
              </div>
            </div>
          ))}
        </div>

        {data && data.attachments.length > 0 && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: SUB }}>Attachments</div>
            <AttachmentGrid token={token} items={data.attachments} />
          </div>
        )}
      </div>
    </Modal>
  )
}

export function PromptDialog({ title, placeholder, submitLabel = 'Submit', onSubmit, onCancel }) {
  const [text, setText] = useState('')
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="p-5">
        <textarea rows={3} autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder}
          aria-label={title} className={inputCls} style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
        <div className="flex justify-end gap-2.5 mt-4">
          <GhostBtn type="button" onClick={onCancel} className="!px-4 !py-2 !text-[13px]">Cancel</GhostBtn>
          <PrimaryBtn type="button" onClick={() => onSubmit(text.trim())} className="!px-5 !py-2 !text-[13px]">{submitLabel}</PrimaryBtn>
        </div>
      </div>
    </Modal>
  )
}

export function ConfirmDialog({ message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  return (
    <Modal title="Please confirm" onClose={onCancel}>
      <div className="p-5">
        <p className="text-[13.5px] text-center" style={{ color: INK }}>{message}</p>
        <div className="flex justify-center gap-2.5 mt-5">
          <GhostBtn type="button" onClick={onCancel} className="!px-4 !py-2 !text-[13px]">Cancel</GhostBtn>
          <PrimaryBtn type="button" onClick={onConfirm} className="!px-5 !py-2 !text-[13px]">{confirmLabel}</PrimaryBtn>
        </div>
      </div>
    </Modal>
  )
}