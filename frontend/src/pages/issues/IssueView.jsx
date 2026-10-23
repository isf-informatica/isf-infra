import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MdmPage, C, Card, CardHeader, Btn, IconBtn, Loader, Empty, Modal, Field, Input, Select, Chips,
  Kpi, Pill, useToasts, timeAgo, downloadBlob,
} from '../../components/mdm/MdmKit'
import {
  CATEGORIES, LEVELS, PRIORITY, STATUS, OPEN_STATUSES, NEXT, PRODUCTS, TEAM, memberName,
  getIssueSummary, getIssues, reportIssue, updateIssue, setIssueStatus, deleteIssue, exportIssues,
  readScreenshot, getIssueAudit,
} from '../../api/issues'
import { currentUser } from '../../api/mdmDemoStore'

/* Issue Manager — the mbse "Software Issues" module (buglist.php + bugreport.php)
   rebuilt in the isf-infra MdmKit style (same shell as VAPT / DRM / Signage). */

const ACCENT = '#DC2626'
const THEME = {
  accent: ACCENT, accentDeep: '#B91C1C', accentBg: '#FEF2F2', accentBorder: '#FECACA',
  gradient: 'linear-gradient(135deg, #EF4444, #B91C1C)',
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { key: 'issues', label: 'Issues', icon: 'ti-list-details' },
  { key: 'board', label: 'Board', icon: 'ti-layout-kanban' },
  { key: 'activity', label: 'Activity', icon: 'ti-history' },
]

const textareaStyle = { border: `1px solid ${C.systemBorder}`, background: C.surface, color: C.textPrimary }
const catMeta = (k) => ({ color: CATEGORIES[k].color, bg: CATEGORIES[k].color + '12', border: CATEGORIES[k].color + '33', icon: CATEGORIES[k].icon })

export default function IssueView() {
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [reporting, setReporting] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [rev, setRev] = useState(0) // bump to reload lists after a change
  const { toasts, toast } = useToasts()

  const refresh = useCallback(() => getIssueSummary().then(setSummary).catch(() => {}), [])
  useEffect(() => { refresh() }, [refresh])
  const changed = useCallback(() => { refresh(); setRev(r => r + 1) }, [refresh])

  return (
    <MdmPage {...THEME} icon="ti-bug" title="Issue Manager"
      subtitle="Report, triage and track software issues across every ISF product — from new to closed"
      tabs={TABS} tab={tab} onTab={setTab} toasts={toasts}
      activeKey="issues" backPath="/home" backLabel="Home"
      badges={{ issues: summary?.unassigned || 0 }}
      status={summary ? `${summary.open} open · ${summary.highOpen} high priority` : 'connecting…'}
      right={<Btn variant="accent" icon="ti-plus" onClick={() => setReporting(true)}>Report issue</Btn>}>
      {tab === 'overview' && <OverviewTab summary={summary} goTo={setTab} />}
      {tab === 'issues' && <IssuesTab rev={rev} toast={toast} onOpen={setOpenId} onChange={changed} />}
      {tab === 'board' && <BoardTab rev={rev} onOpen={setOpenId} />}
      {tab === 'activity' && <ActivityTab rev={rev} />}

      {reporting && <ReportModal onClose={() => setReporting(false)} toast={toast}
        onSaved={(i) => { setReporting(false); changed(); toast(`Issue reported — ${i.id}`) }} />}
      {openId && <IssueDetail id={openId} onClose={() => setOpenId(null)} toast={toast} onChange={changed} />}
    </MdmPage>
  )
}

/* ───────── Overview ───────── */

function OverviewTab({ summary, goTo }) {
  if (!summary) return <Loader label="Loading issues…" />
  const pipeline = ['new', 'in_review', 'updated', 'reopened', 'resolved', 'closed']
  const maxStatus = Math.max(1, ...pipeline.map(k => summary.byStatus[k]))
  const maxProd = Math.max(1, ...summary.byProduct.map(p => p[1]))
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Open issues" value={summary.open} sub={`${summary.total} reported in total`} icon="ti-bug" color={ACCENT} />
        <Kpi label="High priority" value={summary.highOpen} sub="Open & high" icon="ti-chevrons-up" color={PRIORITY.high.color} />
        <Kpi label="Unassigned" value={summary.unassigned} sub="Waiting for allocation" icon="ti-user-question" color={C.warning} />
        <Kpi label="Resolved / closed" value={summary.resolved} sub=" " icon="ti-circle-check" color={C.success} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: C.textMuted }}>Workflow</div>
          <div className="flex flex-col gap-3">
            {pipeline.map(k => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-24 text-[12px] font-semibold shrink-0" style={{ color: STATUS[k].color }}>{STATUS[k].label}</span>
                <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: C.surfaceAlt }}>
                  <div className="h-5 rounded-lg flex items-center justify-end pr-2" style={{ width: `${(summary.byStatus[k] / maxStatus) * 100}%`, minWidth: summary.byStatus[k] ? 28 : 0, background: STATUS[k].color, transition: 'width 500ms ease' }}>
                    {summary.byStatus[k] > 0 && <span className="text-[11px] font-bold text-white">{summary.byStatus[k]}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: C.textMuted }}>Open by category</div>
          <div className="flex flex-col gap-2.5">
            {Object.entries(CATEGORIES).map(([k, m]) => (
              <div key={k} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl" style={{ background: m.color + '0D', border: `1px solid ${m.color}26` }}>
                <span className="flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: C.textPrimary }}><i className={`ti ${m.icon} text-[16px]`} style={{ color: m.color }} aria-hidden="true"></i>{m.label}</span>
                <span className="text-[16px] font-extrabold" style={{ color: m.color }}>{summary.byCategory[k]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Open by product" right={<Btn icon="ti-arrow-right" onClick={() => goTo('issues')}>All issues</Btn>} />
          <div className="p-5 flex flex-col gap-3">
            {summary.byProduct.length === 0 ? <Empty icon="ti-mood-happy">No open issues.</Empty> : summary.byProduct.map(([p, n]) => (
              <div key={p}>
                <div className="flex justify-between gap-3 text-[12px] mb-1.5"><span className="font-semibold truncate" style={{ color: C.textPrimary }}>{p}</span><span className="shrink-0" style={{ color: C.textSecondary }}>{n}</span></div>
                <div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${(n / maxProd) * 100}%`, background: ACCENT }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Team workload" sub="Open issues allocated per member" />
          {summary.workload.length === 0 ? <Empty>No allocated issues.</Empty> : summary.workload.map(t => (
            <div key={t.id} className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: THEME.accentBg, color: THEME.accentDeep }}>{t.name[0]}</span>
              <div className="min-w-0 flex-1"><div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{t.name}</div><div className="text-[11px]" style={{ color: C.textMuted }}>{t.role}</div></div>
              <span className="text-[13px] font-bold" style={{ color: C.textPrimary }}>{t.open}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

/* ───────── Issues list ───────── */

function IssuesTab({ rev, toast, onOpen, onChange }) {
  const [list, setList] = useState(null)
  const [q, setQ] = useState('')
  const [scope, setScope] = useState('open')
  const [cat, setCat] = useState('all')
  const [product, setProduct] = useState('all')
  const [prio, setPrio] = useState('all')
  const [busy, setBusy] = useState(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(() => getIssues().then(setList), [])
  useEffect(() => { load() }, [load, rev])

  const me = currentUser()
  const counts = useMemo(() => ({
    open: list?.filter(i => OPEN_STATUSES.includes(i.status)).length || 0,
    done: list?.filter(i => !OPEN_STATUSES.includes(i.status)).length || 0,
    mine: list?.filter(i => memberName(i.allocated_to) === me).length || 0,
    all: list?.length || 0,
  }), [list, me])

  const shown = (list || []).filter(i =>
    (scope === 'all' || (scope === 'open' && OPEN_STATUSES.includes(i.status)) || (scope === 'done' && !OPEN_STATUSES.includes(i.status)) || (scope === 'mine' && memberName(i.allocated_to) === me))
    && (cat === 'all' || i.category === cat) && (product === 'all' || i.product === product) && (prio === 'all' || i.priority === prio)
    && (!q.trim() || `${i.id} ${i.title} ${i.description}`.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => PRIORITY[b.priority].rank - PRIORITY[a.priority].rank || new Date(b.added_on) - new Date(a.added_on))

  const remove = async (i) => {
    if (!window.confirm(`Delete ${i.id}?`)) return
    setBusy(i.id); await deleteIssue(i.id); setBusy(null); onChange(); toast(`Deleted — ${i.id}`)
  }
  const doExport = async () => { setExporting(true); downloadBlob(await exportIssues(shown), `issues-${new Date().toISOString().slice(0, 10)}.csv`); setExporting(false); toast('Issues exported') }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search ID or title"
              className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-48" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
          </div>
          <Select value={product} onChange={e => setProduct(e.target.value)}><option value="all">All products</option>{PRODUCTS.map(p => <option key={p}>{p}</option>)}</Select>
          <Select value={cat} onChange={e => setCat(e.target.value)}><option value="all">All categories</option>{Object.entries(CATEGORIES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</Select>
          <Select value={prio} onChange={e => setPrio(e.target.value)}><option value="all">Any priority</option>{Object.entries(PRIORITY).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</Select>
        </div>
        <div className="flex items-center gap-2">
          <Chips options={[['open', 'Open'], ['mine', 'Mine'], ['done', 'Done'], ['all', 'All']]} value={scope} onChange={setScope} counts={counts} />
          <Btn icon="ti-file-spreadsheet" loading={exporting} onClick={doExport}>Export</Btn>
        </div>
      </div>
      {!list ? <Loader label="Loading issues…" /> : shown.length === 0 ? <Empty icon="ti-mood-happy">No issues match.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 980 }}>
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                <th className="px-5 py-2.5">Issue</th><th className="px-3 py-2.5">Category</th><th className="px-3 py-2.5">Priority</th>
                <th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Allocated to</th><th className="px-3 py-2.5">Reported</th><th className="px-5 py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {shown.map(i => (
                <tr key={i.id} className="mk-row cursor-pointer" style={{ borderTop: `1px solid ${C.border}` }} onClick={() => onOpen(i.id)}>
                  <td className="px-5 py-3">
                    <div className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>{i.title}</div>
                    <div className="text-[11px]" style={{ color: C.textMuted }}><span className="mono">{i.id}</span> · {i.product} · {i.level}</div>
                  </td>
                  <td className="px-3 py-3"><Pill small meta={catMeta(i.category)}>{CATEGORIES[i.category].label}</Pill></td>
                  <td className="px-3 py-3"><Pill small meta={PRIORITY[i.priority]} /></td>
                  <td className="px-3 py-3"><Pill small meta={STATUS[i.status]} /></td>
                  <td className="px-3 py-3 text-[12px]" style={{ color: i.allocated_to ? C.textPrimary : C.warning }}>{memberName(i.allocated_to) || 'Unassigned'}</td>
                  <td className="px-3 py-3 text-[11.5px]" style={{ color: C.textMuted }}>{i.added_by}<br />{timeAgo(i.added_on)}</td>
                  <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}><IconBtn icon="ti-trash" danger title="Delete" loading={busy === i.id} onClick={() => remove(i)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

/* ───────── Board ───────── */

function BoardTab({ rev, onOpen }) {
  const [list, setList] = useState(null)
  useEffect(() => { getIssues().then(setList) }, [rev])
  if (!list) return <Loader label="Loading board…" />
  const cols = ['new', 'in_review', 'updated', 'reopened', 'resolved', 'closed']
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(230px, 1fr))`, minWidth: cols.length * 240 }}>
        {cols.map(k => {
          const items = list.filter(i => i.status === k).sort((a, b) => PRIORITY[b.priority].rank - PRIORITY[a.priority].rank)
          return (
            <div key={k} className="rounded-2xl p-3 flex flex-col gap-2.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between px-1 py-1">
                <span className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color: STATUS[k].color }}><i className={`ti ${STATUS[k].icon}`} aria-hidden="true"></i>{STATUS[k].label}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: STATUS[k].bg, color: STATUS[k].color }}>{items.length}</span>
              </div>
              {items.length === 0 ? <div className="text-[11.5px] text-center py-6" style={{ color: C.textMuted }}>Empty</div> : items.map(i => (
                <button key={i.id} onClick={() => onOpen(i.id)} className="mk-row text-left rounded-xl p-3 cursor-pointer" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10.5px] mono" style={{ color: C.textMuted }}>{i.id}</span>
                    <Pill small meta={PRIORITY[i.priority]} />
                  </div>
                  <div className="text-[12.5px] font-semibold leading-snug mb-2" style={{ color: C.textPrimary }}>{i.title}</div>
                  <div className="flex items-center justify-between gap-2 text-[11px]" style={{ color: C.textMuted }}>
                    <span className="flex items-center gap-1"><i className={`ti ${CATEGORIES[i.category].icon}`} style={{ color: CATEGORIES[i.category].color }} aria-hidden="true"></i>{i.product}</span>
                    <span style={{ color: i.allocated_to ? C.textSecondary : C.warning }}>{memberName(i.allocated_to) || 'Unassigned'}</span>
                  </div>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ───────── Report issue (buglist.php) ───────── */

function ReportModal({ onClose, onSaved, toast }) {
  const [f, setF] = useState({ title: '', description: '', category: 'bug', level: 'L1', priority: 'medium', product: PRODUCTS[0], screenshots: [] })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const addFiles = async (files) => {
    for (const file of Array.from(files)) {
      try { const shot = await readScreenshot(file); setF(x => ({ ...x, screenshots: [...x.screenshots, shot] })) }
      catch (e) { toast(e.message, 'error') }
    }
  }

  return (
    <Modal title="Report an issue" onClose={onClose} width={620}>
      <Field label="Work / title"><Input value={f.title} onChange={e => set('title', e.target.value)} placeholder="Short summary of the problem" /></Field>
      <Field label="Description">
        <textarea value={f.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Steps to reproduce, what you expected, what happened"
          className="mk-input w-full text-[13px] px-3 py-2 rounded-xl" style={textareaStyle} />
      </Field>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3">
        <Field label="Product"><Select value={f.product} onChange={e => set('product', e.target.value)} className="w-full">{PRODUCTS.map(p => <option key={p}>{p}</option>)}</Select></Field>
        <Field label="Category"><Select value={f.category} onChange={e => set('category', e.target.value)} className="w-full">{Object.entries(CATEGORIES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</Select></Field>
        <Field label="Level"><Select value={f.level} onChange={e => set('level', e.target.value)} className="w-full">{LEVELS.map(l => <option key={l}>{l}</option>)}</Select></Field>
        <Field label="Priority"><Select value={f.priority} onChange={e => set('priority', e.target.value)} className="w-full">{Object.entries(PRIORITY).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</Select></Field>
      </div>
      <Field label="Screenshots" hint="Images only, up to 400 KB each">
        <label className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl cursor-pointer text-[12.5px] font-semibold" style={{ border: `1.5px dashed ${C.borderStrong}`, color: C.textSecondary, background: C.surfaceAlt }}>
          <i className="ti ti-photo-plus text-[16px]" aria-hidden="true"></i> Choose images
          <input type="file" accept="image/*" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
        </label>
      </Field>
      {f.screenshots.length > 0 && (
        <div className="flex gap-2 flex-wrap -mt-2 mb-4">
          {f.screenshots.map((s, idx) => (
            <div key={idx} className="relative w-20 h-14 rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
              <button type="button" onClick={() => set('screenshots', f.screenshots.filter((_, j) => j !== idx))} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer" style={{ background: '#000a', color: '#fff', border: 'none' }}>
                <i className="ti ti-x text-[11px]" aria-hidden="true"></i>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-send" loading={busy} disabled={!f.title.trim() || !f.description.trim()}
          onClick={async () => {
            setBusy(true)
            try { onSaved(await reportIssue(f)) } catch { setBusy(false); toast('Could not save — screenshots may be too large for demo storage', 'error') }
          }}>Submit issue</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Issue detail / triage (bugreport.php) ───────── */

function Meta({ k, v }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: C.textMuted }}>{k}</div>
      <div className="text-[12.5px]" style={{ color: C.textPrimary }}>{v}</div>
    </div>
  )
}

function IssueDetail({ id, onClose, toast, onChange }) {
  const [issue, setIssue] = useState(null)
  const [tri, setTri] = useState(null)
  const [remark, setRemark] = useState('')
  const [busy, setBusy] = useState(null)
  const [zoom, setZoom] = useState(null)

  useEffect(() => {
    getIssues().then(l => {
      const i = l.find(x => x.id === id)
      setIssue(i)
      if (i) setTri({ allocated_to: i.allocated_to || '', reviewed_by: i.reviewed_by || '', estimated_start_date: i.estimated_start_date || '', estimated_end_date: i.estimated_end_date || '' })
    })
  }, [id])

  if (!issue || !tri) return <Modal title={id} onClose={onClose} width={720}><Loader /></Modal>

  const saveTriage = async () => {
    setBusy('triage')
    const note = tri.allocated_to !== (issue.allocated_to || '') ? `Allocated to ${memberName(tri.allocated_to) || 'nobody'}` : 'Updated triage details'
    const updated = await updateIssue(issue.id, { ...tri, allocated_to: tri.allocated_to || null, reviewed_by: tri.reviewed_by || null }, note)
    setIssue(updated); setBusy(null); onChange(); toast(`Saved — ${issue.id}`)
  }
  const move = async (st) => {
    setBusy(st)
    const updated = await setIssueStatus(issue.id, st, remark.trim())
    setIssue(updated); setRemark(''); setBusy(null); onChange(); toast(`${issue.id} → ${STATUS[st].label}`)
  }
  const dt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'

  return (
    <Modal title={`${issue.id} · ${issue.title}`} onClose={onClose} width={760}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Pill meta={STATUS[issue.status]} />
        <Pill meta={PRIORITY[issue.priority]}>{PRIORITY[issue.priority].label} priority</Pill>
        <Pill meta={catMeta(issue.category)}>{CATEGORIES[issue.category].label}</Pill>
        <Pill meta={{ color: C.textSecondary, bg: C.surfaceAlt, border: C.border, icon: 'ti-stairs' }}>{issue.level}</Pill>
        <Pill meta={{ color: C.textSecondary, bg: C.surfaceAlt, border: C.border, icon: 'ti-apps' }}>{issue.product}</Pill>
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ background: C.surfaceAlt }}>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: C.textMuted }}>Description</div>
        <div className="text-[12.5px] whitespace-pre-wrap" style={{ color: C.textPrimary }}>{issue.description}</div>
      </div>

      {issue.screenshots?.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: C.textMuted }}>Images / screenshots</div>
          <div className="flex gap-2 flex-wrap">
            {issue.screenshots.map((s, idx) => (
              <button key={idx} onClick={() => setZoom(s)} className="w-24 h-16 rounded-lg overflow-hidden cursor-pointer p-0" style={{ border: `1px solid ${C.border}` }}>
                <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-3 mb-5">
        <Meta k="Added by" v={`${issue.added_by} · ${timeAgo(issue.added_on)}`} />
        <Meta k="Updated by" v={`${issue.updated_by} · ${timeAgo(issue.updated_on)}`} />
        <Meta k="Actual start" v={dt(issue.actual_start_date)} />
        <Meta k="Actual end" v={dt(issue.actual_end_date)} />
        {issue.resolved_by && <Meta k="Resolved by" v={issue.resolved_by} />}
      </div>

      <Card className="p-4 mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>Triage</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Allocated to">
            <Select value={tri.allocated_to} onChange={e => setTri(t => ({ ...t, allocated_to: e.target.value }))} className="w-full">
              <option value="">— Select team member —</option>
              {TEAM.map(t => <option key={t.id} value={t.id}>{t.name} · {t.role}</option>)}
            </Select>
          </Field>
          <Field label="Reviewed by">
            <Select value={tri.reviewed_by} onChange={e => setTri(t => ({ ...t, reviewed_by: e.target.value }))} className="w-full">
              <option value="">— Not reviewed —</option>
              {TEAM.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </Select>
          </Field>
          <Field label="Estimated start date"><Input type="date" value={tri.estimated_start_date} onChange={e => setTri(t => ({ ...t, estimated_start_date: e.target.value }))} /></Field>
          <Field label="Estimated end date"><Input type="date" value={tri.estimated_end_date} onChange={e => setTri(t => ({ ...t, estimated_end_date: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end"><Btn variant="primary" icon="ti-device-floppy" loading={busy === 'triage'} onClick={saveTriage}>Save triage</Btn></div>
      </Card>

      <Card className="p-4 mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>Update status to</div>
        <Input value={remark} onChange={e => setRemark(e.target.value)} placeholder="Remark (optional) — what changed?" className="mb-3" />
        <div className="flex gap-2 flex-wrap">
          {NEXT[issue.status].map(st => (
            <Btn key={st} variant={st === 'resolved' || st === 'closed' ? 'success' : st === 'reopened' ? 'danger' : 'ghost'} icon={STATUS[st].icon} loading={busy === st} onClick={() => move(st)}>{STATUS[st].label}</Btn>
          ))}
        </div>
      </Card>

      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.textMuted }}>History</div>
      <div className="flex flex-col">
        {[...issue.history].reverse().map((h, idx) => (
          <div key={idx} className="flex items-start gap-3 py-2" style={{ borderTop: idx ? `1px solid ${C.border}` : 'none' }}>
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: C.surfaceAlt, color: C.textPrimary }}>{h.by[0]}</span>
            <div className="min-w-0 flex-1 text-[12px]" style={{ color: C.textPrimary }}><b>{h.by}</b> · {h.text}</div>
            <span className="text-[11px] shrink-0" style={{ color: C.textMuted }}>{timeAgo(h.at)}</span>
          </div>
        ))}
      </div>

      {zoom && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 cursor-zoom-out" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setZoom(null)}>
          <img src={zoom.url} alt={zoom.name} className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </Modal>
  )
}

/* ───────── Activity ───────── */

function ActivityTab({ rev }) {
  const [audit, setAudit] = useState(null)
  useEffect(() => { getIssueAudit().then(setAudit) }, [rev])
  return (
    <Card>
      <CardHeader title="Activity log" sub="Reports, allocations and status changes" />
      {!audit ? <Loader /> : audit.length === 0 ? <Empty>No activity yet.</Empty> : audit.map(a => (
        <div key={a.id} className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: C.surfaceAlt, color: C.textPrimary }}>{a.by[0]}</span>
          <div className="min-w-0 flex-1"><div className="text-[12.5px]" style={{ color: C.textPrimary }}><b>{a.by}</b> · {a.action}</div><div className="text-[11.5px] mono truncate" style={{ color: C.textMuted }}>{a.target}</div></div>
          <span className="text-[11px] shrink-0" style={{ color: C.textMuted }}>{timeAgo(a.at)}</span>
        </div>
      ))}
    </Card>
  )
}
