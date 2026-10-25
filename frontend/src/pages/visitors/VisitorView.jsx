import { useCallback, useEffect, useState } from 'react'
import {
  MdmPage, C, Card, CardHeader, Btn, IconBtn, Loader, Empty, Modal, Field, Input, Select,
  Kpi, Pill, PILL, useToasts, usePoll, timeAgo, downloadBlob,
} from '../../components/mdm/MdmKit'
import {
  PURPOSES, ID_PROOFS, PASS_HOURS, DEPARTMENTS, SITES, VISIT_STATUS, EVENT_TYPES,
  passState, passNo, durationMins,
  getVisitorSummary, registerVisitor, getActiveVisitors, checkoutVisitor, cancelVisitor,
  getVisitHistory, exportVisits, getSecurityLogs, readPhoto,
} from '../../api/visitors'

/* Visitor Management — port of the mbse Visitor module (Visitor_Controller +
   visitor_*.php) rebuilt in the isf-infra MdmKit style (same shell as VAPT / DRM). */

const ACCENT = '#0D9488'
const THEME = {
  accent: ACCENT, accentDeep: '#0F766E', accentBg: '#F0FDFA', accentBorder: '#99F6E4',
  gradient: 'linear-gradient(135deg, #14B8A6, #0F766E)',
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { key: 'register', label: 'Register visitor', icon: 'ti-user-plus' },
  { key: 'active', label: 'On premises', icon: 'ti-door-enter' },
  { key: 'history', label: 'Visit history', icon: 'ti-history' },
  { key: 'logs', label: 'Security logs', icon: 'ti-shield-check' },
]

const PASS_META = {
  valid: PILL.success('ti-ticket'),
  expired: PILL.danger('ti-clock-exclamation'),
  closed: PILL.neutral('ti-ticket-off'),
}
const PASS_LABEL = { valid: 'Pass valid', expired: 'Pass expired', closed: 'Pass closed' }
const textareaStyle = { border: `1px solid ${C.systemBorder}`, background: C.surface, color: C.textPrimary }
const dt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
const tm = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'
const dur = (m) => m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`
const today = () => new Date().toISOString().slice(0, 10)
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

export default function VisitorView() {
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [pass, setPass] = useState(null)
  const { toasts, toast } = useToasts()
  const refresh = useCallback(() => getVisitorSummary().then(setSummary).catch(() => {}), [])
  useEffect(() => { refresh() }, [refresh])

  return (
    <MdmPage {...THEME} icon="ti-id-badge-2" title="Visitor Management"
      subtitle="Register visitors at the gate, issue time-bound gate passes and keep a security log of every entry and exit"
      tabs={TABS} tab={tab} onTab={setTab} toasts={toasts}
      activeKey="visitors" backPath="/home" backLabel="Home"
      badges={{ active: summary?.expired || 0 }}
      status={summary ? `${summary.onPremises} on premises · ${summary.today} today` : 'connecting…'}
      right={tab !== 'register' && <Btn variant="accent" icon="ti-user-plus" onClick={() => setTab('register')}>Register visitor</Btn>}>
      {tab === 'overview' && <OverviewTab summary={summary} goTo={setTab} />}
      {tab === 'register' && <RegisterTab toast={toast} onDone={(v) => { refresh(); setPass(v) }} />}
      {tab === 'active' && <ActiveTab toast={toast} onChange={refresh} onPass={setPass} />}
      {tab === 'history' && <HistoryTab toast={toast} onPass={setPass} />}
      {tab === 'logs' && <LogsTab />}
      {pass && <GatePassModal v={pass} onClose={() => setPass(null)} />}
    </MdmPage>
  )
}

/* ───────── Overview (visitor_management.php + visitor_report.php) ───────── */

function OverviewTab({ summary, goTo }) {
  if (!summary) return <Loader label="Loading visitors…" />
  const maxDay = Math.max(1, ...summary.days.map(d => d.count))
  const maxP = Math.max(1, ...summary.byPurpose.map(p => p[1]))
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Visitors today" value={summary.today} sub={`${summary.checkedOutToday} already left`} icon="ti-users" color={ACCENT} />
        <Kpi label="On premises" value={summary.onPremises} sub="Checked in, not yet out" icon="ti-door-enter" color="#2563EB" />
        <Kpi label="Expired passes" value={summary.expired} sub="Still inside after pass expiry" icon="ti-clock-exclamation" color={C.red} />
        <Kpi label="Average visit" value={summary.avgMins ? dur(summary.avgMins) : '—'} sub={`${summary.total} visits on record`} icon="ti-hourglass" color={C.warning} />
      </div>

      {summary.expired > 0 && (
        <div className="rounded-2xl px-5 py-4 flex items-center justify-between gap-3 flex-wrap" style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
          <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: C.danger }}>
            <i className="ti ti-alert-triangle text-[17px]" aria-hidden="true"></i>
            {summary.expired} visitor{summary.expired > 1 ? 's are' : ' is'} still on premises after the gate pass expired
          </span>
          <Btn variant="danger" icon="ti-arrow-right" onClick={() => goTo('active')}>Review now</Btn>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <Card className="xl:col-span-3 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: C.textMuted }}>Visitors · last 7 days</div>
          <div className="flex items-end gap-3 h-40">
            {summary.days.map(d => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                <span className="text-[11px] font-semibold" style={{ color: C.textSecondary }}>{d.count || ''}</span>
                <div className="flex-1 w-full flex items-end justify-center">
                  <div className="w-2/3 rounded-t-md" style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? 4 : 0, background: d.key === today() ? ACCENT : ACCENT + '66', transition: 'height 500ms ease' }} />
                </div>
                <span className="text-[11px]" style={{ color: d.key === today() ? C.textPrimary : C.textMuted, fontWeight: d.key === today() ? 600 : 400 }}>{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="By purpose of visit" right={<Btn icon="ti-arrow-right" onClick={() => goTo('history')}>History</Btn>} />
          <div className="p-5 flex flex-col gap-3">
            {summary.byPurpose.map(([p, n]) => (
              <div key={p}>
                <div className="flex justify-between gap-3 text-[12px] mb-1.5"><span className="font-semibold" style={{ color: C.textPrimary }}>{p}</span><span style={{ color: C.textSecondary }}>{n}</span></div>
                <div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${(n / maxP) * 100}%`, background: ACCENT }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ───────── Register (visitor_register.php) ───────── */

const EMPTY = {
  visitor_name: '', visitor_phone: '', visitor_email: '', purpose: '', id_proof_type: '', id_proof_no: '',
  host_name: '', host_email: '', host_department: '', site: SITES[0], gate_pass_hours: 4, notify_visitor: false, remarks: '', visitor_photo: null,
}

function RegisterTab({ toast, onDone }) {
  const [f, setF] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  const phoneOk = f.visitor_phone.replace(/\D/g, '').length >= 10
  const valid = f.visitor_name.trim() && phoneOk && f.purpose && f.host_name.trim()

  const pickPhoto = async (file) => {
    if (!file) return
    try { set('visitor_photo', await readPhoto(file)) } catch (e) { toast(e.message, 'error') }
  }
  const submit = async () => {
    setBusy(true)
    try {
      const v = await registerVisitor(f)
      setF(EMPTY); toast(`Checked in — ${v.visitor_name} · ${passNo(v)}`); onDone(v)
    } catch { toast('Could not save — photo may be too large for demo storage', 'error') }
    setBusy(false)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <Card className="xl:col-span-2 p-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: C.textMuted }}>Visitor details</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Visitor name *"><Input value={f.visitor_name} onChange={e => set('visitor_name', e.target.value)} placeholder="Full name" /></Field>
          <Field label="Phone number *" hint={f.visitor_phone && !phoneOk ? 'Enter a 10-digit number' : undefined}><Input value={f.visitor_phone} onChange={e => set('visitor_phone', e.target.value)} placeholder="98XXX XXXXX" inputMode="tel" /></Field>
          <Field label="Email"><Input type="email" value={f.visitor_email} onChange={e => set('visitor_email', e.target.value)} placeholder="Optional" /></Field>
          <Field label="Purpose of visit *"><Select value={f.purpose} onChange={e => set('purpose', e.target.value)} className="w-full"><option value="">— Select purpose —</option>{PURPOSES.map(p => <option key={p}>{p}</option>)}</Select></Field>
          <Field label="ID proof type"><Select value={f.id_proof_type} onChange={e => set('id_proof_type', e.target.value)} className="w-full"><option value="">— Select —</option>{ID_PROOFS.map(p => <option key={p}>{p}</option>)}</Select></Field>
          <Field label="ID proof number" hint="Store only the last 4 digits if policy requires"><Input value={f.id_proof_no} onChange={e => set('id_proof_no', e.target.value)} placeholder="e.g. XXXX-1234" /></Field>
        </div>

        <div className="text-[11px] font-semibold uppercase tracking-wider mt-2 mb-4" style={{ color: C.textMuted }}>Whom to meet</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Host name *"><Input value={f.host_name} onChange={e => set('host_name', e.target.value)} placeholder="Person or desk being visited" /></Field>
          <Field label="Host department"><Select value={f.host_department} onChange={e => set('host_department', e.target.value)} className="w-full"><option value="">— Select —</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</Select></Field>
          <Field label="Host email (for notification)"><Input type="email" value={f.host_email} onChange={e => set('host_email', e.target.value)} placeholder="Optional" /></Field>
          <Field label="Site / campus"><Select value={f.site} onChange={e => set('site', e.target.value)} className="w-full">{SITES.map(s => <option key={s}>{s}</option>)}</Select></Field>
        </div>
        <Field label="Remarks"><textarea value={f.remarks} onChange={e => set('remarks', e.target.value)} rows={2} className="mk-input w-full text-[13px] px-3 py-2 rounded-xl" style={textareaStyle} /></Field>
      </Card>

      <div className="flex flex-col gap-5">
        <Card className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: C.textMuted }}>Photo & gate pass</div>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer mb-4 overflow-hidden" style={{ height: 150, border: `1.5px dashed ${C.borderStrong}`, background: C.surfaceAlt }}>
            {f.visitor_photo
              ? <img src={f.visitor_photo} alt="Visitor" className="w-full h-full object-cover" />
              : <><i className="ti ti-camera text-[24px]" style={{ color: C.textMuted }} aria-hidden="true"></i><span className="text-[12px] font-semibold" style={{ color: C.textSecondary }}>Take or upload photo</span></>}
            <input type="file" accept="image/*" capture="user" className="hidden" onChange={e => { pickPhoto(e.target.files?.[0]); e.target.value = '' }} />
          </label>
          {f.visitor_photo && <div className="-mt-2 mb-4 text-right"><button onClick={() => set('visitor_photo', null)} className="text-[11.5px] font-semibold cursor-pointer" style={{ color: C.danger, background: 'none', border: 'none' }}>Remove photo</button></div>}
          <Field label="Gate pass valid for" hint="Gate pass will auto-expire after the selected duration">
            <Select value={String(f.gate_pass_hours)} onChange={e => set('gate_pass_hours', Number(e.target.value))} className="w-full">{PASS_HOURS.map(([h, l]) => <option key={h} value={h}>{l}</option>)}</Select>
          </Field>
          <Field label="Visitor notification" hint="Visitor gets gate pass details on phone">
            <Select value={f.notify_visitor ? '1' : '0'} onChange={e => set('notify_visitor', e.target.value === '1')} className="w-full"><option value="0">No SMS</option><option value="1">Send SMS to visitor</option></Select>
          </Field>
          <Btn variant="accent" icon="ti-ticket" loading={busy} disabled={!valid} onClick={submit} className="w-full">Check in & issue gate pass</Btn>
          {!valid && <div className="text-[11px] mt-2 text-center" style={{ color: C.textMuted }}>Name, 10-digit phone, purpose and host are required</div>}
        </Card>
      </div>
    </div>
  )
}

/* ───────── On premises (visitor_active.php) ───────── */

function ActiveTab({ toast, onChange, onPass }) {
  const [list, setList] = useState(null)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(null)
  const load = useCallback(() => getActiveVisitors().then(setList), [])
  useEffect(() => { load() }, [load])
  usePoll(load, true, 30000) // keep "x min ago" and pass expiry fresh

  const shown = (list || []).filter(v => !q.trim() || `${v.visitor_name} ${v.visitor_phone} ${v.host_name} ${passNo(v)}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (passState(b) === 'expired') - (passState(a) === 'expired') || b.check_in_time.localeCompare(a.check_in_time))

  const out = async (v) => { setBusy(v.id); await checkoutVisitor(v.id); setBusy(null); load(); onChange(); toast(`Checked out — ${v.visitor_name}`) }
  const cancel = async (v) => {
    if (!window.confirm(`Cancel the visit of ${v.visitor_name}?`)) return
    setBusy(v.id); await cancelVisitor(v.id); setBusy(null); load(); onChange(); toast(`Visit cancelled — ${v.visitor_name}`)
  }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="relative">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, phone, host, pass no."
            className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-64" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
        </div>
        <span className="text-[12px]" style={{ color: C.textSecondary }}>{list ? `${list.length} on premises` : ' '}</span>
      </div>
      {!list ? <Loader label="Loading active visitors…" /> : shown.length === 0 ? <Empty icon="ti-door">Nobody is checked in right now.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 940 }}>
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                <th className="px-5 py-2.5">Visitor</th><th className="px-3 py-2.5">Purpose</th><th className="px-3 py-2.5">Host</th>
                <th className="px-3 py-2.5">Check-in</th><th className="px-3 py-2.5">Gate pass</th><th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(v => {
                const ps = passState(v)
                return (
                  <tr key={v.id} className="mk-row" style={{ borderTop: `1px solid ${C.border}`, background: ps === 'expired' ? C.dangerBg + '80' : undefined }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar v={v} />
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>{v.visitor_name}</div>
                          <div className="text-[11px]" style={{ color: C.textMuted }}>{v.visitor_phone} · {v.site}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[12px]" style={{ color: C.textSecondary }}>{v.purpose}</td>
                    <td className="px-3 py-3"><div className="text-[12.5px]" style={{ color: C.textPrimary }}>{v.host_name}</div><div className="text-[11px]" style={{ color: C.textMuted }}>{v.host_department || '—'}</div></td>
                    <td className="px-3 py-3"><div className="text-[12.5px]" style={{ color: C.textPrimary }}>{tm(v.check_in_time)}</div><div className="text-[11px]" style={{ color: C.textMuted }}>{timeAgo(v.check_in_time)} · {dur(durationMins(v))} inside</div></td>
                    <td className="px-3 py-3">
                      <Pill small meta={PASS_META[ps]}>{PASS_LABEL[ps]}</Pill>
                      <div className="text-[11px] mt-1" style={{ color: ps === 'expired' ? C.danger : C.textMuted }}>{ps === 'expired' ? 'expired' : 'until'} {tm(v.gate_pass_expiry)}</div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <IconBtn icon="ti-ticket" title="View gate pass" onClick={() => onPass(v)} />
                        <Btn variant="success" icon="ti-logout" loading={busy === v.id} onClick={() => out(v)} className="!px-2.5 !py-1.5 !text-[11.5px]">Check out</Btn>
                        <IconBtn icon="ti-ban" danger title="Cancel visit" onClick={() => cancel(v)} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function Avatar({ v, size = 36 }) {
  return v.visitor_photo
    ? <img src={v.visitor_photo} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
    : <span className="rounded-full flex items-center justify-center text-[13px] font-bold shrink-0" style={{ width: size, height: size, background: THEME.accentBg, color: THEME.accentDeep }}>{v.visitor_name[0]}</span>
}

/* ───────── History & report (visitor_history.php + visitor_report.php) ───────── */

function HistoryTab({ toast, onPass }) {
  const [from, setFrom] = useState(daysAgo(30))
  const [to, setTo] = useState(today())
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [list, setList] = useState(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(() => getVisitHistory({ from, to, search }).then(setList), [from, to, search])
  useEffect(() => { load() }, [load])
  const shown = (list || []).filter(v => status === 'all' || v.status === status)
  const stats = {
    total: shown.length,
    out: shown.filter(v => v.status === 'checked_out').length,
    inside: shown.filter(v => v.status === 'active').length,
    expired: shown.filter(v => passState(v) === 'expired').length,
  }
  const doExport = async () => { setExporting(true); downloadBlob(await exportVisits(shown), `visitors-${from}-to-${to}.csv`); setExporting(false); toast('Visitor report exported') }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Visits in range" value={stats.total} icon="ti-users" color={ACCENT} />
        <Kpi label="Checked out" value={stats.out} icon="ti-logout" color="#2563EB" />
        <Kpi label="Still inside" value={stats.inside} icon="ti-door-enter" color={C.success} />
        <Kpi label="Expired pass" value={stats.expired} icon="ti-clock-exclamation" color={C.red} />
      </div>
      <Card>
        <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, phone or host"
                className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-48" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
            </div>
            <span className="text-[12px]" style={{ color: C.textSecondary }}>From</span>
            <Input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} style={{ width: 150 }} />
            <span className="text-[12px]" style={{ color: C.textSecondary }}>to</span>
            <Input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} style={{ width: 150 }} />
            <Select value={status} onChange={e => setStatus(e.target.value)}><option value="all">Any status</option>{Object.entries(VISIT_STATUS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</Select>
          </div>
          <Btn variant="primary" icon="ti-file-spreadsheet" loading={exporting} disabled={!shown.length} onClick={doExport}>Export CSV</Btn>
        </div>
        {!list ? <Loader /> : shown.length === 0 ? <Empty icon="ti-calendar-off">No visits in this range.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 980 }}>
              <thead>
                <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                  <th className="px-5 py-2.5">Visitor</th><th className="px-3 py-2.5">Purpose</th><th className="px-3 py-2.5">Host</th>
                  <th className="px-3 py-2.5">Check-in</th><th className="px-3 py-2.5">Check-out</th><th className="px-3 py-2.5">Duration</th>
                  <th className="px-3 py-2.5">Status</th><th className="px-5 py-2.5 text-right">Pass</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(v => (
                  <tr key={v.id} className="mk-row" style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar v={v} size={30} /><div><div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{v.visitor_name}</div><div className="text-[11px]" style={{ color: C.textMuted }}>{v.visitor_phone}</div></div></div></td>
                    <td className="px-3 py-3 text-[12px]" style={{ color: C.textSecondary }}>{v.purpose}</td>
                    <td className="px-3 py-3 text-[12px]" style={{ color: C.textSecondary }}>{v.host_name}</td>
                    <td className="px-3 py-3 text-[12px] whitespace-nowrap" style={{ color: C.textPrimary }}>{dt(v.check_in_time)}</td>
                    <td className="px-3 py-3 text-[12px] whitespace-nowrap" style={{ color: C.textSecondary }}>{dt(v.check_out_time)}</td>
                    <td className="px-3 py-3 text-[12px]" style={{ color: C.textSecondary }}>{v.status === 'cancelled' ? '—' : dur(durationMins(v))}</td>
                    <td className="px-3 py-3"><Pill small meta={VISIT_STATUS[v.status]} /></td>
                    <td className="px-5 py-3 text-right"><IconBtn icon="ti-ticket" title="View gate pass" onClick={() => onPass(v)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ───────── Security logs (visitor_security_logs.php) ───────── */

function LogsTab() {
  const [from, setFrom] = useState(daysAgo(7))
  const [to, setTo] = useState(today())
  const [type, setType] = useState('all')
  const [list, setList] = useState(null)
  useEffect(() => { getSecurityLogs({ from, to }).then(setList) }, [from, to])
  const shown = (list || []).filter(l => type === 'all' || l.event_type === type)

  return (
    <Card>
      <CardHeader title="Security logs" sub="Every check-in, check-out, cancellation and expired pass"
        right={<div className="flex items-center gap-2 flex-wrap">
          <Select value={type} onChange={e => setType(e.target.value)}><option value="all">All events</option>{Object.entries(EVENT_TYPES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</Select>
          <Input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} style={{ width: 150 }} />
          <Input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} style={{ width: 150 }} />
        </div>} />
      {!list ? <Loader /> : shown.length === 0 ? <Empty icon="ti-shield-check">No events in this range.</Empty> : shown.map(l => {
        const m = EVENT_TYPES[l.event_type] || EVENT_TYPES.CHECK_IN
        return (
          <div key={l.id} className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.color + '14' }}>
              <i className={`ti ${m.icon} text-[16px]`} style={{ color: m.color }} aria-hidden="true"></i>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px]" style={{ color: C.textPrimary }}><b style={{ color: m.color }}>{m.label}</b> · {l.event_desc}</div>
              <div className="text-[11px]" style={{ color: C.textMuted }}>{l.visitor_phone && `${l.visitor_phone} · `}by {l.done_by}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[12px]" style={{ color: C.textPrimary }}>{dt(l.event_time)}</div>
              <div className="text-[11px]" style={{ color: C.textMuted }}>{timeAgo(l.event_time)}</div>
            </div>
          </div>
        )
      })}
    </Card>
  )
}

/* ───────── Gate pass (visitor_gate_pass.php) ───────── */

function GatePassModal({ v, onClose }) {
  const ps = passState(v)
  const rows = [
    ['Purpose', v.purpose], ['To meet', `${v.host_name}${v.host_department ? ` · ${v.host_department}` : ''}`],
    ['Site', v.site], ['Check-in', dt(v.check_in_time)], ['Valid until', dt(v.gate_pass_expiry)],
    ...(v.id_proof_type ? [['ID proof', `${v.id_proof_type}${v.id_proof_no ? ` · ${v.id_proof_no}` : ''}`]] : []),
    ...(v.check_out_time ? [['Check-out', dt(v.check_out_time)]] : []),
  ]

  const print = () => {
    const w = window.open('', '_blank', 'width=420,height=640')
    if (!w) return
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
    w.document.write(`<!doctype html><html><head><title>${passNo(v)}</title><style>
      body{font-family:system-ui,sans-serif;margin:0;padding:24px;color:#1A1A18}
      .pass{border:2px solid #1A1A18;border-radius:14px;padding:20px;max-width:340px;margin:auto}
      h1{font-size:13px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 4px}.no{font:700 22px monospace;margin:0 0 14px}
      .name{font-size:18px;font-weight:700}.ph{color:#5C5C57;font-size:13px;margin-bottom:12px}
      img{width:90px;height:90px;border-radius:10px;object-fit:cover;float:right}
      table{width:100%;border-collapse:collapse;font-size:13px;clear:both}td{padding:6px 0;border-top:1px solid #ddd}td:first-child{color:#5C5C57;width:40%}
      .st{margin-top:14px;text-align:center;font-weight:700;padding:8px;border-radius:8px;background:${ps === 'expired' ? '#FBEAE9;color:#8A2A2A' : '#ECFDF5;color:#0F766E'}}
    </style></head><body><div class="pass">
      ${v.visitor_photo ? `<img src="${v.visitor_photo}" alt="">` : ''}
      <h1>Visitor gate pass</h1><div class="no">${passNo(v)}</div>
      <div class="name">${esc(v.visitor_name)}</div><div class="ph">${esc(v.visitor_phone)}</div>
      <table>${rows.map(([k, val]) => `<tr><td>${esc(k)}</td><td>${esc(val)}</td></tr>`).join('')}</table>
      <div class="st">${ps === 'expired' ? 'THIS GATE PASS HAS EXPIRED' : ps === 'valid' ? `Valid until ${esc(dt(v.gate_pass_expiry))}` : 'Visit closed'}</div>
    </div><script>window.onload=()=>{window.print()}</script></body></html>`)
    w.document.close()
  }

  return (
    <Modal title="Gate pass" onClose={onClose} width={440}>
      <div className="rounded-2xl p-5" style={{ border: `2px solid ${C.textPrimary}` }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em]" style={{ color: ACCENT }}>Visitor gate pass</div>
            <div className="text-[22px] font-extrabold mono" style={{ color: C.textPrimary }}>{passNo(v)}</div>
          </div>
          <Avatar v={v} size={64} />
        </div>
        <div className="text-[17px] font-bold" style={{ color: C.textPrimary }}>{v.visitor_name}</div>
        <div className="text-[12.5px] mb-3" style={{ color: C.textSecondary }}>{v.visitor_phone}{v.visitor_email && ` · ${v.visitor_email}`}</div>
        {rows.map(([k, val]) => (
          <div key={k} className="flex justify-between gap-4 py-2 text-[12.5px]" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.textMuted }}>{k}</span><span className="text-right font-medium" style={{ color: C.textPrimary }}>{val}</span>
          </div>
        ))}
        <div className="mt-3 rounded-xl px-3 py-2.5 text-center text-[12.5px] font-bold"
          style={ps === 'expired' ? { background: C.dangerBg, color: C.danger } : ps === 'valid' ? { background: THEME.accentBg, color: THEME.accentDeep } : { background: C.surfaceAlt, color: C.textSecondary }}>
          {ps === 'expired' ? '⛔ This gate pass has expired' : ps === 'valid' ? `⏰ Valid until ${dt(v.gate_pass_expiry)}` : VISIT_STATUS[v.status].label}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Btn onClick={onClose}>Close</Btn>
        <Btn variant="accent" icon="ti-printer" onClick={print}>Print pass</Btn>
      </div>
    </Modal>
  )
}
