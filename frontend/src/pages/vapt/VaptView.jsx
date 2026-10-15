import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MdmPage, C, Card, CardHeader, Btn, Loader, Empty, Modal, Field, Input, Select, Toggle, Chips,
  Segmented, Kpi, Pill, useToasts, usePoll, timeAgo, downloadBlob,
} from '../../components/mdm/MdmKit'
import {
  SEVERITY, SCAN_TYPES, OWASP,
  getVaptSummary, getScans, startScan, getFindings, setFindingStatus, exportFindings,
  getCompliance, getSchedule, saveSchedule, generateReport, getAudit,
} from '../../api/vapt'

const ACCENT = '#0891B2'
const THEME = {
  accent: ACCENT, accentDeep: '#0E7490', accentBg: '#ECFEFF', accentBorder: '#A5F3FC',
  gradient: 'linear-gradient(135deg, #06B6D4, #0E7490)',
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { key: 'scans', label: 'Scans', icon: 'ti-radar' },
  { key: 'vulns', label: 'Vulnerabilities', icon: 'ti-bug' },
  { key: 'compliance', label: 'Compliance', icon: 'ti-checkup-list' },
  { key: 'reports', label: 'Reports', icon: 'ti-file-description' },
]

const sevMeta = (k) => ({ color: SEVERITY[k].color, bg: SEVERITY[k].bg, border: SEVERITY[k].border })
const STATUS_META = {
  open: { color: '#B5322A', bg: '#FDEEEC', border: '#F6C3BE', icon: 'ti-alert-circle', label: 'Open' },
  fixed: { color: C.success, bg: C.successBg, border: C.successBorder, icon: 'ti-circle-check', label: 'Fixed' },
  accepted: { color: '#5C5C57', bg: '#F2F2EE', border: '#D5D5CE', icon: 'ti-shield-half', label: 'Accepted' },
}

export default function VaptView() {
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const { toasts, toast } = useToasts()
  const refresh = useCallback(() => getVaptSummary().then(setSummary).catch(() => {}), [])
  useEffect(() => { refresh() }, [refresh])

  return (
    <MdmPage {...THEME} icon="ti-shield-bolt" title="VAPT"
      subtitle="Vulnerability assessment & penetration-testing console for your web, API and cloud assets"
      tabs={TABS} tab={tab} onTab={setTab} toasts={toasts}
      activeKey="vapt" backPath="/home" backLabel="Home"
      badges={{ vulns: summary?.critical || 0, scans: summary?.running ? 'live' : null }}
      status={summary ? `Risk ${summary.riskLabel} · ${summary.openVulns} open` : 'connecting…'}
      right={<span className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full" style={{ color: THEME.accentDeep, background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
        <i className="ti ti-lock-check text-[12px] mr-1" aria-hidden="true"></i>Authorised targets only</span>}>
      {tab === 'overview' && <OverviewTab summary={summary} goTo={setTab} />}
      {tab === 'scans' && <ScansTab toast={toast} onChange={refresh} />}
      {tab === 'vulns' && <VulnsTab toast={toast} onChange={refresh} />}
      {tab === 'compliance' && <ComplianceTab />}
      {tab === 'reports' && <ReportsTab toast={toast} />}
    </MdmPage>
  )
}

/* ───────── Overview ───────── */

function OverviewTab({ summary, goTo }) {
  const [findings, setFindings] = useState(null)
  useEffect(() => { getFindings().then(setFindings) }, [])
  if (!summary) return <Loader label="Loading security posture…" />

  const sevOrder = ['critical', 'high', 'medium', 'low', 'info']
  const maxSev = Math.max(1, ...sevOrder.map(k => summary.bySeverity[k]))
  const maxAsset = Math.max(1, ...summary.topAssets.map(a => a[1]))
  const ring = summary.riskScore >= 70 ? C.red : summary.riskScore >= 40 ? '#C2410C' : summary.riskScore >= 15 ? '#8A6816' : C.success
  const topOpen = (findings || []).filter(f => f.status === 'open').sort((a, b) => b.cvss - a.cvss).slice(0, 6)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Open vulnerabilities" value={summary.openVulns} sub={`${summary.critical} critical · ${summary.high} high`} icon="ti-bug" color={ACCENT} />
        <Kpi label="Critical" value={summary.critical} sub="Fix immediately" icon="ti-alert-octagon" color={C.red} />
        <Kpi label="Assets scanned" value={summary.assets} sub={`${summary.scans} scans run`} icon="ti-server-2" color="#2563EB" />
        <Kpi label="Fixed" value={summary.fixed} sub={summary.lastScan ? `last scan ${timeAgo(summary.lastScan)}` : ' '} icon="ti-circle-check" color={C.success} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="p-5 flex flex-col items-center justify-center">
          <div className="text-[11px] font-semibold uppercase tracking-wider self-start mb-2" style={{ color: C.textMuted }}>Overall risk score</div>
          <div className="relative w-36 h-36 my-2">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke={C.surfaceAlt} strokeWidth="12" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={ring} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${(summary.riskScore / 100) * 327} 327`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[34px] font-extrabold leading-none" style={{ color: C.textPrimary }}>{summary.riskScore}</span>
              <span className="text-[11px]" style={{ color: C.textMuted }}>/ 100</span>
            </div>
          </div>
          <span className="text-[12.5px] font-bold px-3 py-1 rounded-full" style={{ color: ring, background: ring + '18' }}>{summary.riskLabel} risk</span>
        </Card>

        <Card className="xl:col-span-2 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: C.textMuted }}>Open findings by severity</div>
          <div className="flex flex-col gap-3">
            {sevOrder.map(k => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-16 text-[12px] font-semibold shrink-0" style={{ color: SEVERITY[k].color }}>{SEVERITY[k].label}</span>
                <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: C.surfaceAlt }}>
                  <div className="h-5 rounded-lg flex items-center justify-end pr-2" style={{ width: `${Math.max(summary.bySeverity[k] ? 8 : 0, (summary.bySeverity[k] / maxSev) * 100)}%`, background: SEVERITY[k].color, minWidth: summary.bySeverity[k] ? 28 : 0, transition: 'width 500ms ease' }}>
                    {summary.bySeverity[k] > 0 && <span className="text-[11px] font-bold text-white">{summary.bySeverity[k]}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Top open findings" sub="Highest CVSS first" right={<Btn icon="ti-arrow-right" onClick={() => goTo('vulns')}>All vulnerabilities</Btn>} />
          {!findings ? <Loader /> : topOpen.length === 0 ? <Empty icon="ti-shield-check">No open findings.</Empty> : topOpen.map(f => (
            <div key={f.id} className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span className="w-12 text-center text-[13px] font-extrabold shrink-0 py-1 rounded-lg" style={{ color: SEVERITY[f.severity].color, background: SEVERITY[f.severity].bg }}>{f.cvss.toFixed(1)}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{f.title}</div>
                <div className="text-[11px] mt-0.5 truncate" style={{ color: C.textMuted }}>{f.asset} · {f.owasp}</div>
              </div>
              <Pill small meta={{ ...sevMeta(f.severity) }}>{SEVERITY[f.severity].label}</Pill>
            </div>
          ))}
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Most affected assets" />
          <div className="p-5 flex flex-col gap-3">
            {summary.topAssets.length === 0 ? <Empty>No findings.</Empty> : summary.topAssets.map(([asset, n]) => (
              <div key={asset}>
                <div className="flex justify-between gap-3 text-[12px] mb-1.5"><span className="font-semibold truncate" style={{ color: C.textPrimary }}>{asset}</span><span className="shrink-0" style={{ color: C.textSecondary }}>{n}</span></div>
                <div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${(n / maxAsset) * 100}%`, background: ACCENT }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ───────── Scans ───────── */

function ScansTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [newScan, setNewScan] = useState(false)
  const [sched, setSched] = useState(null)
  const [schedOpen, setSchedOpen] = useState(false)

  const load = useCallback(async () => { setList(await getScans()) }, [])
  useEffect(() => { load(); getSchedule().then(setSched) }, [load])
  usePoll(load, list?.some(s => s.status === 'running'), 1500)

  // notify on completion
  const prev = useRef(null)
  useEffect(() => {
    if (prev.current && list) list.forEach(s => {
      const p = prev.current.find(x => x.id === s.id)
      if (p && p.status === 'running' && s.status === 'completed') { toast(`Scan complete — ${s.target}`); onChange() }
    })
    prev.current = list
  }, [list, toast, onChange])

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fff' }}>
            <i className="ti ti-calendar-time text-[18px]" style={{ color: ACCENT }} aria-hidden="true"></i>
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-bold" style={{ color: C.textPrimary }}>Scheduled scans {sched?.enabled ? 'on' : 'off'}</div>
            <div className="text-[11.5px]" style={{ color: C.textSecondary }}>{sched ? `${sched.frequency} · ${sched.day} ${sched.time} · ${sched.scope}` : '…'}</div>
          </div>
        </div>
        <Btn icon="ti-settings" onClick={() => setSchedOpen(true)}>Edit schedule</Btn>
      </div>

      <Card>
        <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>Scan history</span>
          <Btn variant="accent" icon="ti-radar-2" onClick={() => setNewScan(true)}>New scan</Btn>
        </div>
        {!list ? <Loader label="Loading scans…" /> : list.length === 0 ? <Empty icon="ti-radar">No scans yet.</Empty> : list.map(s => {
          const t = SCAN_TYPES[s.type]
          const total = Object.values(s.found).reduce((a, b) => a + b, 0)
          return (
            <div key={s.id} className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: THEME.accentBg }}>
                  <i className={`ti ${t.icon} text-[18px]`} style={{ color: ACCENT }} aria-hidden="true"></i>
                </span>
                <div className="min-w-0 flex-1" style={{ minWidth: 220 }}>
                  <div className="text-[13.5px] font-semibold flex items-center gap-2 flex-wrap" style={{ color: C.textPrimary }}>
                    <span className="mono truncate">{s.target}</span>
                    {s.status === 'running'
                      ? <Pill small meta={{ color: THEME.accentDeep, bg: THEME.accentBg, border: THEME.accentBorder, icon: 'ti-loader-2 animate-spin' }}>Scanning</Pill>
                      : <Pill small meta={{ color: C.success, bg: C.successBg, border: C.successBorder, icon: 'ti-circle-check' }}>Completed</Pill>}
                  </div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{t.label} · {s.project} · by {s.by}, {timeAgo(s.startedAt)}</div>
                </div>
                {s.status === 'completed' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {['critical', 'high', 'medium', 'low'].map(k => s.found[k] > 0 && (
                      <span key={k} className="text-[11px] font-bold px-2 py-1 rounded-lg" style={{ color: SEVERITY[k].color, background: SEVERITY[k].bg }}>{s.found[k]} {SEVERITY[k].label[0]}</span>
                    ))}
                    {total === 0 && <span className="text-[11.5px]" style={{ color: C.success }}>No issues</span>}
                  </div>
                )}
              </div>
              {s.status === 'running' && (
                <div className="mt-3">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: C.surfaceAlt }}>
                    <div className="mk-stripe h-2 rounded-full" style={{ width: `${s.progress}%`, background: ACCENT, transition: 'width 400ms ease' }} />
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>{s.progress}% · probing {s.target}…</div>
                </div>
              )}
            </div>
          )
        })}
      </Card>

      {newScan && <NewScanModal onClose={() => setNewScan(false)} onStarted={async (s) => { setNewScan(false); await load(); toast(`Scan started — ${s.target}`); }} />}
      {schedOpen && sched && <ScheduleModal sched={sched} onClose={() => setSchedOpen(false)} onSaved={(s) => { setSched(s); setSchedOpen(false); toast('Schedule saved'); }} />}
    </div>
  )
}

const DEFAULT_TARGETS = [
  'easylearn.org.in', 'api.easylearn.org.in', 'infrapoint.co.in',
  'dolphin-app-33jp4.ondigitalocean.app', '103.21.58.0/24 (DO droplet)', 'AWS S3 — easylearn-media',
]

function NewScanModal({ onClose, onStarted }) {
  const [type, setType] = useState('web')
  const [target, setTarget] = useState(DEFAULT_TARGETS[0])
  const [custom, setCustom] = useState('')
  const [project, setProject] = useState('ISF Internal')
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  const finalTarget = custom.trim() || target

  const submit = async () => { setBusy(true); onStarted(await startScan({ target: finalTarget, type, project })) }

  return (
    <Modal title="New scan" onClose={onClose} width={580}>
      <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.textPrimary }}>Scan type</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {Object.entries(SCAN_TYPES).map(([k, m]) => (
          <button key={k} type="button" onClick={() => setType(k)} className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-left cursor-pointer"
            style={{ border: `1.5px solid ${type === k ? ACCENT : C.border}`, background: type === k ? THEME.accentBg : C.surface }}>
            <i className={`ti ${m.icon} text-[18px] mt-0.5`} style={{ color: ACCENT }} aria-hidden="true"></i>
            <div><div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{m.label}</div><div className="text-[11px]" style={{ color: C.textMuted }}>{m.desc}</div></div>
          </button>
        ))}
      </div>
      <Field label="Target">
        <Select value={target} onChange={e => setTarget(e.target.value)} className="w-full">{DEFAULT_TARGETS.map(t => <option key={t}>{t}</option>)}</Select>
      </Field>
      <Field label="Or enter a custom target" hint="Only scan systems you own or are explicitly authorised to test">
        <Input value={custom} onChange={e => setCustom(e.target.value)} placeholder="example.com / 10.0.0.0/24" className="mono" />
      </Field>
      <Field label="Project / client"><Select value={project} onChange={e => setProject(e.target.value)} className="w-full">{['ISF Internal', 'MBSE', 'PCU', 'MET Nashik'].map(p => <option key={p}>{p}</option>)}</Select></Field>
      <label className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl cursor-pointer mb-1" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
        <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="mt-0.5" style={{ accentColor: ACCENT }} />
        <span className="text-[11.5px]" style={{ color: C.textSecondary }}>I confirm I am authorised to test <b style={{ color: C.textPrimary }}>{finalTarget}</b>.</span>
      </label>
      <div className="flex justify-end gap-2 pt-4">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-radar-2" loading={busy} disabled={!ack || !finalTarget} onClick={submit}>Start scan</Btn>
      </div>
    </Modal>
  )
}

function ScheduleModal({ sched, onClose, onSaved }) {
  const [s, setS] = useState(sched)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setS(x => ({ ...x, [k]: v }))
  return (
    <Modal title="Scheduled scans" onClose={onClose} width={520}>
      <div className="rounded-xl px-4 py-1 mb-4" style={{ border: `1px solid ${C.border}` }}>
        <Toggle icon="ti-calendar-time" label="Run scans automatically" on={s.enabled} onChange={v => set('enabled', v)} />
      </div>
      {s.enabled && (
        <>
          <Field label="Frequency"><Segmented options={[['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']]} value={s.frequency} onChange={v => set('frequency', v)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            {s.frequency === 'weekly' && <Field label="Day"><Select value={s.day} onChange={e => set('day', e.target.value)} className="w-full">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <option key={d}>{d}</option>)}</Select></Field>}
            <Field label="Time"><Input type="time" value={s.time} onChange={e => set('time', e.target.value)} /></Field>
          </div>
          <Field label="Scope"><Select value={s.scope} onChange={e => set('scope', e.target.value)} className="w-full">{['All production targets', 'Web assets only', 'APIs only', 'Cloud only'].map(x => <option key={x}>{x}</option>)}</Select></Field>
        </>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-device-floppy" loading={busy} onClick={async () => { setBusy(true); onSaved(await saveSchedule(s)) }}>Save</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Vulnerabilities ───────── */

function VulnsTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [sev, setSev] = useState('all')
  const [status, setStatus] = useState('open')
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(() => getFindings().then(setList), [])
  useEffect(() => { load() }, [load])

  const sevCounts = useMemo(() => {
    const c = { all: list?.length || 0 }
    Object.keys(SEVERITY).forEach(k => { c[k] = list?.filter(f => f.severity === k).length || 0 })
    return c
  }, [list])
  const statusCounts = useMemo(() => ({ all: list?.length || 0, open: list?.filter(f => f.status === 'open').length || 0, fixed: list?.filter(f => f.status === 'fixed').length || 0, accepted: list?.filter(f => f.status === 'accepted').length || 0 }), [list])

  const shown = (list || []).filter(f => (sev === 'all' || f.severity === sev) && (status === 'all' || f.status === status) && (!q.trim() || `${f.title} ${f.asset} ${f.owasp}`.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => b.cvss - a.cvss)

  const act = async (f, st) => {
    setBusy(f.id)
    const updated = await setFindingStatus(f.id, st)
    setList(l => l.map(x => x.id === f.id ? updated : x))
    if (detail?.id === f.id) setDetail(updated)
    onChange(); setBusy(null)
    toast(st === 'fixed' ? `Marked as fixed — ${f.title}` : st === 'accepted' ? `Risk accepted — ${f.title}` : `Reopened — ${f.title}`)
  }
  const doExport = async () => { setExporting(true); downloadBlob(await exportFindings(shown), `vapt-findings-${new Date().toISOString().slice(0, 10)}.csv`); setExporting(false); toast('Findings exported') }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search findings"
              className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-52" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
          </div>
          <Select value={sev} onChange={e => setSev(e.target.value)}>
            <option value="all">All severities</option>
            {Object.entries(SEVERITY).map(([k, m]) => <option key={k} value={k}>{m.label} ({sevCounts[k]})</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Chips options={[['open', 'Open'], ['fixed', 'Fixed'], ['accepted', 'Accepted'], ['all', 'All']]} value={status} onChange={setStatus} counts={statusCounts} />
          <Btn variant="primary" icon="ti-file-spreadsheet" loading={exporting} onClick={doExport}>Export</Btn>
        </div>
      </div>
      {!list ? <Loader label="Loading findings…" /> : shown.length === 0 ? <Empty icon="ti-shield-check">No findings match.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 920 }}>
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                <th className="px-5 py-2.5">CVSS</th><th className="px-3 py-2.5">Finding</th><th className="px-3 py-2.5">OWASP</th>
                <th className="px-3 py-2.5">Asset</th><th className="px-3 py-2.5">Status</th><th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(f => (
                <tr key={f.id} className="mk-row cursor-pointer" style={{ borderTop: `1px solid ${C.border}` }} onClick={() => setDetail(f)}>
                  <td className="px-5 py-3"><span className="inline-flex items-center justify-center w-11 text-[13px] font-extrabold py-1 rounded-lg" style={{ color: SEVERITY[f.severity].color, background: SEVERITY[f.severity].bg }}>{f.cvss.toFixed(1)}</span></td>
                  <td className="px-3 py-3"><div className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>{f.title}</div><div className="text-[11px]" style={{ color: C.textMuted }}>{SCAN_TYPES[f.type].label}</div></td>
                  <td className="px-3 py-3"><span className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: THEME.accentBg, color: THEME.accentDeep }}>{f.owasp}</span></td>
                  <td className="px-3 py-3 text-[12px] mono" style={{ color: C.textSecondary }}>{f.asset}</td>
                  <td className="px-3 py-3"><Pill small meta={STATUS_META[f.status]} /></td>
                  <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                    {f.status !== 'fixed' ? <Btn variant="success" icon="ti-check" loading={busy === f.id} onClick={() => act(f, 'fixed')} className="!px-2.5 !py-1.5 !text-[11.5px]">Mark fixed</Btn>
                      : <Btn icon="ti-rotate" loading={busy === f.id} onClick={() => act(f, 'open')} className="!px-2.5 !py-1.5 !text-[11.5px]">Reopen</Btn>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <Modal title={detail.title} onClose={() => setDetail(null)} width={620}>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[13px] font-extrabold px-3 py-1 rounded-lg" style={{ color: SEVERITY[detail.severity].color, background: SEVERITY[detail.severity].bg }}>CVSS {detail.cvss.toFixed(1)}</span>
            <Pill meta={sevMeta(detail.severity)}>{SEVERITY[detail.severity].label}</Pill>
            <Pill meta={{ color: THEME.accentDeep, bg: THEME.accentBg, border: THEME.accentBorder, icon: 'ti-list-check' }}>{detail.owasp} · {OWASP.find(o => o[0] === detail.owasp)?.[1]}</Pill>
            <Pill meta={STATUS_META[detail.status]} />
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-[12.5px] mb-4">
            <div><div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: C.textMuted }}>Affected asset</div><div className="mono" style={{ color: C.textPrimary }}>{detail.asset}</div></div>
            <div><div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: C.textMuted }}>Scan type</div><div style={{ color: C.textPrimary }}>{SCAN_TYPES[detail.type].label}</div></div>
            <div><div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: C.textMuted }}>First seen</div><div style={{ color: C.textPrimary }}>{new Date(detail.firstSeen).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div></div>
            <div><div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: C.textMuted }}>Compliance impact</div><div style={{ color: C.textPrimary }}>{detail.frameworks.length ? detail.frameworks.join(', ') : '—'}</div></div>
          </div>
          <div className="rounded-xl p-4 mb-3" style={{ background: C.surfaceAlt }}>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: C.textMuted }}>Description</div>
            <div className="text-[12.5px]" style={{ color: C.textPrimary }}>{detail.summary}</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: C.successBg, border: `1px solid ${C.successBorder}` }}>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5" style={{ color: C.success }}><i className="ti ti-tool" aria-hidden="true"></i>Recommended remediation</div>
            <div className="text-[12.5px]" style={{ color: C.textPrimary }}>{detail.fix}</div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            {detail.status === 'open' && <Btn icon="ti-shield-half" loading={busy === detail.id} onClick={() => act(detail, 'accepted')}>Accept risk</Btn>}
            {detail.status !== 'fixed' ? <Btn variant="success" icon="ti-check" loading={busy === detail.id} onClick={() => act(detail, 'fixed')}>Mark as fixed</Btn>
              : <Btn icon="ti-rotate" loading={busy === detail.id} onClick={() => act(detail, 'open')}>Reopen</Btn>}
          </div>
        </Modal>
      )}
    </Card>
  )
}

/* ───────── Compliance ───────── */

function ComplianceTab() {
  const [data, setData] = useState(null)
  useEffect(() => { getCompliance().then(setData) }, [])
  if (!data) return <Loader label="Mapping findings to frameworks…" />

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader title="OWASP Top 10 (2021)" sub="Open findings mapped to web risk categories" />
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.owasp.map(o => {
            const sevKey = o.worst >= 0 ? Object.keys(SEVERITY).find(k => SEVERITY[k].rank === o.worst) : null
            const clean = o.count === 0
            return (
              <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl" style={{ background: clean ? C.successBg : SEVERITY[sevKey].bg, border: `1px solid ${clean ? C.successBorder : SEVERITY[sevKey].border}` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] font-extrabold px-2 py-1 rounded shrink-0" style={{ background: '#fff', color: clean ? C.success : SEVERITY[sevKey].color }}>{o.id}</span>
                  <span className="text-[12.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{o.name}</span>
                </div>
                {clean ? <span className="text-[11.5px] font-semibold flex items-center gap-1 shrink-0" style={{ color: C.success }}><i className="ti ti-circle-check" aria-hidden="true"></i>Clear</span>
                  : <span className="text-[11.5px] font-bold shrink-0" style={{ color: SEVERITY[sevKey].color }}>{o.count} open</span>}
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Compliance frameworks" sub="Controls covered by scanned findings" />
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.frameworks.map(f => {
            const na = f.pct === null
            const ok = !na && f.open === 0
            const col = na ? C.textMuted : ok ? C.success : f.pct >= 60 ? '#8A6816' : C.red
            return (
              <div key={f.name} className="rounded-2xl p-5" style={{ border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-bold" style={{ color: C.textPrimary }}>{f.name}</span>
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ color: col, background: col + '18' }}>{na ? 'Not assessed' : ok ? 'Compliant' : `${f.open} gap${f.open > 1 ? 's' : ''}`}</span>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-[26px] font-extrabold leading-none" style={{ color: na ? C.textMuted : C.textPrimary }}>{na ? '—' : `${f.pct}%`}</span>
                  <span className="text-[11.5px] mb-0.5" style={{ color: C.textMuted }}>{na ? 'no findings mapped' : `${f.passed}/${f.total} controls`}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${na ? 0 : f.pct}%`, background: col }} /></div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

/* ───────── Reports ───────── */

function ReportsTab({ toast }) {
  const [gen, setGen] = useState(null) // { kind, step, steps }
  const [last, setLast] = useState(null)
  const [audit, setAudit] = useState(null)
  useEffect(() => { getAudit().then(setAudit) }, [])

  const run = async (kind) => {
    setGen({ kind, step: 0, steps: [] })
    const r = await generateReport(kind, (step, steps) => setGen({ kind, step, steps }))
    setGen(null); setLast(r)
    getAudit().then(setAudit)
    toast(`${kind === 'executive' ? 'Executive' : 'Technical'} report ready`)
  }

  const cards = [
    { kind: 'executive', icon: 'ti-presentation', title: 'Executive summary', desc: 'Risk heatmap, overall posture and key risks — for management.', bullets: ['Executive summary', 'Risk heatmap', 'Compliance posture'] },
    { kind: 'technical', icon: 'ti-file-code', title: 'Technical report', desc: 'Full CVSS table, remediation plan and SLA timeline — for engineers.', bullets: ['CVSS score table', 'Remediation plan & SLA', 'Compliance mapping'] },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(c => (
          <Card key={c.kind} className="p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: THEME.accentBg }}><i className={`ti ${c.icon} text-[20px]`} style={{ color: ACCENT }} aria-hidden="true"></i></span>
              <div className="text-[14px] font-bold" style={{ color: C.textPrimary }}>{c.title}</div>
            </div>
            <p className="text-[12.5px] mb-3 flex-1" style={{ color: C.textSecondary }}>{c.desc}</p>
            <ul className="flex flex-col gap-1 mb-4">
              {c.bullets.map(b => <li key={b} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: C.textSecondary }}><i className="ti ti-check text-[12px]" style={{ color: ACCENT }} aria-hidden="true"></i>{b}</li>)}
            </ul>
            {gen?.kind === c.kind ? (
              <div className="rounded-xl p-3" style={{ background: C.surfaceAlt }}>
                {gen.steps.map((st, i) => (
                  <div key={st} className="flex items-center gap-2 text-[12px] py-0.5" style={{ color: i <= gen.step ? C.textPrimary : C.textMuted }}>
                    <i className={`ti ${i < gen.step ? 'ti-circle-check' : i === gen.step ? 'ti-loader-2 animate-spin' : 'ti-point'} text-[13px]`} style={{ color: i < gen.step ? C.success : i === gen.step ? ACCENT : C.textMuted }} aria-hidden="true"></i>{st}
                  </div>
                ))}
              </div>
            ) : (
              <Btn variant="accent" icon="ti-file-download" onClick={() => run(c.kind)}>Generate report</Btn>
            )}
          </Card>
        ))}
      </div>

      {last && (
        <Card className="p-5" style={{ borderColor: THEME.accentBorder }}>
          <div className="flex items-center gap-2 text-[13px] font-bold mb-3" style={{ color: C.textPrimary }}><i className="ti ti-file-check text-[17px]" style={{ color: C.success }} aria-hidden="true"></i>{last.kind === 'executive' ? 'Executive summary' : 'Technical report'} generated</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[['Open findings', last.openFindings], ['Critical', last.critical], ['High', last.high], ['Risk score', `${last.riskScore}/100`]].map(([k, v]) => (
              <div key={k}><div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.textMuted }}>{k}</div><div className="text-[20px] font-extrabold" style={{ color: C.textPrimary }}>{v}</div></div>
            ))}
          </div>
          <div className="text-[11.5px] mt-3" style={{ color: C.textMuted }}>Generated by {last.by} · {timeAgo(last.generatedAt)}. In the live build this downloads as a formatted PDF.</div>
        </Card>
      )}

      <Card>
        <CardHeader title="Activity log" sub="Scans, status changes and reports" />
        {!audit ? <Loader /> : audit.map(a => (
          <div key={a.id} className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: C.surfaceAlt, color: C.textPrimary }}>{a.by[0]}</span>
            <div className="min-w-0 flex-1"><div className="text-[12.5px]" style={{ color: C.textPrimary }}><b>{a.by}</b> · {a.action}</div><div className="text-[11.5px] truncate" style={{ color: C.textMuted }}>{a.target}</div></div>
            <span className="text-[11px] shrink-0" style={{ color: C.textMuted }}>{timeAgo(a.at)}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
