import { useEffect, useState } from 'react'
import useAuthStore from '../../store/authStore'
import { getMyTasks, getMyDepartment, completeTicket } from '../../api/serviceDesk'
import {
  INK, SUB, LINE, BG, fmtDate,
  PageTitle, PriorityBadge, StatusBadge, GhostBtn, PrimaryBtn,
  AttachmentsModal, PromptDialog, useNotify,
} from './supportShared'

export default function StaffView() {
  const { token } = useAuthStore()
  const notify = useNotify()
  const [tasks, setTasks] = useState([])
  const [dept, setDept] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [completing, setCompleting] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([getMyTasks(token), getMyDepartment(token)])
      .then(([t, d]) => { setTasks(t); setDept(d) })
      .catch((e) => notify(e.message, 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token])

  const doComplete = async (remarks) => {
    const t = completing
    setCompleting(null)
    setBusy(t.id)
    try {
      await completeTicket(token, t.id, remarks)
      notify(`${t.token_no} marked complete`)
      load()
    } catch (e) { notify(e.message, 'error') } finally { setBusy(null) }
  }

  return (
    <div className="max-w-5xl">
      <PageTitle
        title={`My Assigned Tasks${dept?.department_name ? ` — ${dept.department_name}` : ''}`}
        subtitle="Service Desk tickets assigned to you for action" />

      <div className="mt-5 space-y-2.5">
        {loading && <p className="text-[13px] py-8 text-center" style={{ color: SUB }}>Loading…</p>}

        {!loading && tasks.length === 0 && (
          <div className="bg-white border py-12 text-center text-[13px]" style={{ borderColor: LINE, color: SUB }}>
            Abhi tak koi task assign nahi hua hai.
          </div>
        )}

        {!loading && tasks.map((t) => {
          const canComplete = t.status === 'assigned' || t.status === 'reopened'
          return (
            <div key={t.id} className="bg-white border px-4 py-3.5 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: LINE }}>
              <div className="min-w-0 flex-1 basis-[320px]">
                <span className="inline-block text-[10.5px] font-bold px-2 py-0.5 mb-1" style={{ background: BG, color: INK }}>{t.department_name || '—'}</span>
                <div className="text-[12px] font-bold" style={{ color: INK }}>{t.token_no}</div>
                <div className="text-[14px] font-semibold mt-0.5" style={{ color: INK }}>{t.subject}</div>
                <p className="text-[12.5px] mt-1 max-w-2xl" style={{ color: INK }}>{t.description || 'Koi description nahi di gayi.'}</p>
                <div className="text-[12px] mt-1" style={{ color: SUB }}>
                  Raised by {t.raised_by_name || `User #${t.raised_by}`} · {fmtDate(t.created_at)}
                </div>
                {t.status === 'reopened' && t.verification_remarks && (
                  <div className="text-[12px] mt-1" style={{ color: '#8A2A2A' }}><b>Reopened:</b> {t.verification_remarks}</div>
                )}
                <div className="mt-1.5"><PriorityBadge value={t.priority} /></div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={t.status} />
                <GhostBtn type="button" onClick={() => setViewing(t)}>
                  <i className="ti ti-paperclip text-sm" aria-hidden="true"></i> Files
                </GhostBtn>
                {canComplete && (
                  <PrimaryBtn type="button" disabled={busy === t.id} onClick={() => setCompleting(t)} className="!px-4 !py-2 !text-[12.5px]">
                    <i className="ti ti-check text-sm" aria-hidden="true"></i> Mark Complete
                  </PrimaryBtn>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {viewing && <AttachmentsModal token={token} ticket={viewing} onClose={() => setViewing(null)} />}
      {completing && (
        <PromptDialog title="Completion Remarks" placeholder="Kaam kya kiya, likh do..." submitLabel="Mark Complete"
          onSubmit={doComplete} onCancel={() => setCompleting(null)} />
      )}
    </div>
  )
}