import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MdmPage, C, Card, CardHeader, Btn, IconBtn, Loader, Empty, Modal, Field, Input, Select, Toggle, Switch, Chips,
  Kpi, Pill, PILL, RolloutBar, RolloutStatus, TargetPicker,
  useToasts, usePoll, timeAgo, fmt, downloadBlob,
} from '../../components/mdm/MdmKit'
import { getInstitutions } from '../../api/appManagement'
import { deviceCountFor } from '../../api/mdmDemoStore'
import {
  CATEGORIES, getBrowserSummary, getConfig, updateConfig, setCategory, pushConfig, getRollout,
  getRules, addRule, deleteRule, setKeywords, getActivity, exportActivity,
} from '../../api/secureBrowser'

const ACCENT = '#E4483C'
const THEME = {
  accent: ACCENT, accentDeep: '#B5322A', accentBg: '#FDEEEC', accentBorder: '#F6C3BE',
  gradient: 'linear-gradient(135deg, #F5766D, #E4483C)',
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { key: 'filter', label: 'Web Filter', icon: 'ti-filter' },
  { key: 'lists', label: 'Allow / Block Lists', icon: 'ti-list-check' },
  { key: 'settings', label: 'Browser Settings', icon: 'ti-settings' },
  { key: 'activity', label: 'Activity Log', icon: 'ti-history' },
]
const CAT_LABEL = Object.fromEntries([...CATEGORIES.map(c => [c.key, c.label]), ['keyword', 'Blocked keyword']])

export default function SecureBrowserView() {
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [rollout, setRollout] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const [pushing, setPushing] = useState(false)
  const { toasts, toast } = useToasts()
  const prevRollout = useRef(null)

  const refreshSummary = useCallback(() => getBrowserSummary().then(setSummary).catch(() => {}), [])
  const refreshRollout = useCallback(async () => {
    const r = await getRollout()
    if (prevRollout.current?.status === 'running' && r?.status === 'completed') { toast(`Browser policy applied on ${fmt(r.done)}/${fmt(r.total)} devices`); refreshSummary() }
    prevRollout.current = r
    setRollout(r)
  }, [toast, refreshSummary])

  useEffect(() => { refreshSummary(); refreshRollout(); getInstitutions().then(setInstitutions) }, [refreshSummary, refreshRollout])
  usePoll(refreshRollout, rollout?.status === 'running')

  const changed = useCallback((msg) => { refreshSummary(); if (msg) toast(msg) }, [refreshSummary, toast])

  return (
    <MdmPage {...THEME} icon="ti-world" title="Secure Browser"
      subtitle="Locked-down browser with category filtering, allow-lists and live block alerts"
      tabs={TABS} tab={tab} onTab={setTab} toasts={toasts}
      badges={{ overview: rollout?.status === 'running' ? 'live' : null }}
      status={summary ? `Live · policy v${summary.version}` : 'connecting…'}
      right={summary && (
        <span className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full"
          style={summary.mode === 'allowlist' ? { color: C.success, background: C.successBg, border: `1px solid ${C.successBorder}` } : { color: THEME.accentDeep, background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
          <i className={`ti ${summary.mode === 'allowlist' ? 'ti-lock-check' : 'ti-filter'} text-[12px] mr-1`} aria-hidden="true"></i>
          {summary.mode === 'allowlist' ? 'Allow-list only' : 'Category filter'}
        </span>
      )}>

      {summary?.pendingPush && (
        <div className="mb-5 flex items-center justify-between gap-3 flex-wrap rounded-2xl px-5 py-3.5" style={{ background: C.warningBg, border: `1px solid ${C.warningBorder}` }}>
          <div className="flex items-center gap-2.5 text-[12.5px] font-medium" style={{ color: C.warning }}>
            <i className="ti ti-cloud-upload text-[16px]" aria-hidden="true"></i>
            You have saved changes that are not on devices yet.
          </div>
          <Btn variant="accent" icon="ti-send" onClick={() => setPushing(true)}>Push to devices</Btn>
        </div>
      )}

      {tab === 'overview' && <OverviewTab summary={summary} rollout={rollout} goTo={setTab} onPush={() => setPushing(true)} />}
      {tab === 'filter' && <FilterTab onChanged={changed} />}
      {tab === 'lists' && <ListsTab institutions={institutions} onChanged={changed} />}
      {tab === 'settings' && <SettingsTab onChanged={changed} />}
      {tab === 'activity' && <ActivityTab toast={toast} />}

      {pushing && (
        <PushModal institutions={institutions} onClose={() => setPushing(false)}
          onPushed={(res) => { setPushing(false); prevRollout.current = res.rollout; setRollout(res.rollout); refreshSummary(); toast(`Browser policy v${res.config.version} pushing to ${fmt(res.rollout.total)} devices`); setTab('overview') }} />
      )}
    </MdmPage>
  )
}

/* ───────── Overview ───────── */

function OverviewTab({ summary, rollout, goTo, onPush }) {
  if (!summary) return <Loader label="Collecting browser reports from devices…" />
  const maxD = Math.max(1, ...summary.topDomains.map(d => d.count))
  const maxC = Math.max(1, ...summary.byCategory.map(d => d.count))
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Blocked today" value={fmt(summary.blockedToday)} sub="Attempts stopped by the browser" icon="ti-shield-x" color={ACCENT} />
        <Kpi label="Off-hours attempts" value={fmt(summary.offHours)} sub="Outside 08:00–17:00" icon="ti-moon" color="#475467" />
        <Kpi label="Protected devices" value={fmt(summary.devices)} sub={`Policy v${summary.version}`} icon="ti-devices" color={C.success} />
        <Kpi label="Categories blocked" value={`${summary.categoriesOn}/${CATEGORIES.length}`} sub="Web filter categories on" icon="ti-filter" color="#3B6FE0" />
      </div>

      {rollout && (
        <Card className="px-5 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div>
              <div className="text-[13.5px] font-semibold flex items-center gap-2" style={{ color: C.textPrimary }}>Browser policy rollout <RolloutStatus r={rollout} /></div>
              <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{rollout.target} · by {rollout.by}, {timeAgo(rollout.startedAt)}</div>
            </div>
            <Btn icon="ti-send" onClick={onPush}>Push again</Btn>
          </div>
          <RolloutBar r={rollout} doneLabel="applied" />
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Top blocked sites — today" right={<Btn icon="ti-arrow-right" onClick={() => goTo('activity')}>Activity log</Btn>} />
          <div className="p-5 flex flex-col gap-3">
            {summary.topDomains.length === 0 ? <Empty>No blocks today.</Empty> : summary.topDomains.map(d => (
              <div key={d.domain}>
                <div className="flex justify-between text-[12.5px] mb-1.5"><span className="mono font-semibold" style={{ color: C.textPrimary }}>{d.domain}</span><span style={{ color: C.textSecondary }}>{fmt(d.count)}</span></div>
                <div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${(d.count / maxD) * 100}%`, background: ACCENT }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Blocks by category — today" right={<Btn icon="ti-filter" onClick={() => goTo('filter')}>Web filter</Btn>} />
          <div className="p-5 flex flex-col gap-3">
            {summary.byCategory.map(d => (
              <div key={d.category}>
                <div className="flex justify-between text-[12.5px] mb-1.5"><span className="font-semibold" style={{ color: C.textPrimary }}>{CAT_LABEL[d.category] || d.category}</span><span style={{ color: C.textSecondary }}>{fmt(d.count)}</span></div>
                <div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${(d.count / maxC) * 100}%`, background: '#475467' }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ───────── Web filter ───────── */

function FilterTab({ onChanged }) {
  const [cfg, setCfg] = useState(null)
  const [busy, setBusy] = useState(null)
  useEffect(() => { getConfig().then(setCfg) }, [])
  if (!cfg) return <Loader />

  const setMode = async (mode) => {
    if (mode === cfg.mode) return
    setBusy('mode'); setCfg(await updateConfig({ mode })); setBusy(null)
    onChanged(mode === 'allowlist' ? 'Allow-list mode saved — only approved sites will open' : 'Category filter mode saved')
  }
  const toggleCat = async (c, on) => {
    setBusy(c.key); setCfg(await setCategory(c.key, on)); setBusy(null)
    onChanged(`${c.label} ${on ? 'blocked' : 'allowed'} — push to apply`)
  }

  const modes = [
    { key: 'filter', title: 'Category filter', desc: 'Open web, but blocked categories, sites and keywords are stopped. For general classroom use.', icon: 'ti-filter', color: ACCENT, bg: THEME.accentBg, border: THEME.accentBorder },
    { key: 'allowlist', title: 'Allow-list only', desc: 'Only sites on the allow-list can open — everything else is blocked. For exams & young classes.', icon: 'ti-lock-check', color: C.success, bg: C.successBg, border: C.successBorder },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map(m => {
          const active = cfg.mode === m.key
          return (
            <button key={m.key} onClick={() => setMode(m.key)} className="text-left rounded-2xl p-5 cursor-pointer transition-all"
              style={{ background: C.surface, border: `1.5px solid ${active ? m.color : C.border}`, boxShadow: active ? `0 14px 30px -18px ${m.color}` : 'none' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                    <i className={`ti ${m.icon} text-[18px]`} style={{ color: m.color }} aria-hidden="true"></i>
                  </span>
                  <div className="text-[14px] font-bold" style={{ color: C.textPrimary }}>{m.title}</div>
                </div>
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ border: `2px solid ${active ? m.color : C.borderStrong}` }}>
                  {active && (busy === 'mode' ? <i className="ti ti-loader-2 animate-spin text-[10px]" style={{ color: m.color }} aria-hidden="true"></i> : <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />)}
                </span>
              </div>
              <p className="text-[12px] mt-3" style={{ color: C.textSecondary }}>{m.desc}</p>
            </button>
          )
        })}
      </div>

      <Card style={{ opacity: cfg.mode === 'allowlist' ? 0.55 : 1 }}>
        <CardHeader title="Blocked categories" sub={cfg.mode === 'allowlist' ? 'Not used in allow-list mode — every site outside the allow-list is blocked' : 'Category database updated daily'} />
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {CATEGORIES.map(c => {
            const on = cfg.categories[c.key]
            return (
              <div key={c.key} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl" style={{ border: `1px solid ${on ? THEME.accentBorder : C.border}`, background: on ? THEME.accentBg : C.surface }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: on ? '#fff' : C.surfaceAlt }}>
                    <i className={`ti ${c.icon} text-[16px]`} style={{ color: on ? ACCENT : C.textMuted }} aria-hidden="true"></i>
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: C.textPrimary }}>
                      {c.label}{c.locked && <i className="ti ti-lock text-[11px]" style={{ color: C.textMuted }} title="Always blocked for students" aria-hidden="true"></i>}
                    </div>
                    <div className="text-[11px]" style={{ color: C.textMuted }}>{fmt(c.sites)} sites · {on ? 'Blocked' : 'Allowed'}</div>
                  </div>
                </div>
                {busy === c.key ? <i className="ti ti-loader-2 animate-spin text-[14px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
                  : <Switch on={on} disabled={c.locked || cfg.mode === 'allowlist'} onChange={v => toggleCat(c, v)} />}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

/* ───────── Allow / block lists + keywords ───────── */

function ListsTab({ institutions, onChanged }) {
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')
  const [adding, setAdding] = useState(null)
  const [busy, setBusy] = useState(null)
  const [kw, setKw] = useState('')
  const [kwBusy, setKwBusy] = useState(false)

  const load = useCallback(() => getRules().then(setData), [])
  useEffect(() => { load() }, [load])

  const counts = useMemo(() => ({ all: data?.rules.length, allow: data?.rules.filter(r => r.type === 'allow').length, block: data?.rules.filter(r => r.type === 'block').length }), [data])
  if (!data) return <Loader />
  const rules = data.rules.filter(r => filter === 'all' || r.type === filter)

  const remove = async (r) => { setBusy(r.id); await deleteRule(r.id); await load(); setBusy(null); onChanged(`Removed ${r.domain}`) }
  const saveKeywords = async (list, msg) => { setKwBusy(true); const k = await setKeywords(list); setData(d => ({ ...d, keywords: k })); setKwBusy(false); onChanged(msg) }
  const addKw = () => { const v = kw.trim().toLowerCase(); if (!v || data.keywords.includes(v)) return; setKw(''); saveKeywords([...data.keywords, v], `Keyword "${v}" will be blocked`) }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <Card className="xl:col-span-2">
        <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
          <Chips options={[['all', 'All'], ['allow', 'Allowed'], ['block', 'Blocked']]} value={filter} onChange={setFilter} counts={counts} />
          <div className="flex gap-2">
            <Btn variant="success" icon="ti-circle-check" onClick={() => setAdding('allow')}>Allow site</Btn>
            <Btn variant="danger" icon="ti-ban" onClick={() => setAdding('block')}>Block site</Btn>
          </div>
        </div>
        {rules.length === 0 ? <Empty>No sites here.</Empty> : rules.map(r => (
          <div key={r.id} className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: r.type === 'allow' ? C.successBg : C.dangerBg, border: `1px solid ${r.type === 'allow' ? C.successBorder : C.dangerBorder}` }}>
              <i className={`ti ${r.type === 'allow' ? 'ti-circle-check' : 'ti-ban'} text-[15px]`} style={{ color: r.type === 'allow' ? C.success : C.danger }} aria-hidden="true"></i>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold mono" style={{ color: C.textPrimary }}>{r.domain}</div>
              <div className="text-[11.5px]" style={{ color: C.textMuted }}>{r.scope}{r.note ? ` · ${r.note}` : ''} · by {r.createdBy}, {timeAgo(r.createdAt)}</div>
            </div>
            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg hidden md:inline" style={{ background: C.surfaceAlt, color: C.textSecondary }}>{fmt(r.hits)} {r.type === 'allow' ? 'visits' : 'blocks'}</span>
            <IconBtn icon="ti-trash" title="Remove" loading={busy === r.id} onClick={() => remove(r)} />
          </div>
        ))}
      </Card>

      <Card>
        <CardHeader title="Blocked keywords" sub="Searches & URLs containing these words are blocked" />
        <div className="p-5">
          <div className="flex gap-2 mb-3">
            <Input value={kw} onChange={e => setKw(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKw()} placeholder="Add keyword" />
            <Btn icon="ti-plus" loading={kwBusy} onClick={addKw}>Add</Btn>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {data.keywords.map(k => (
              <span key={k} className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: THEME.accentBg, color: THEME.accentDeep, border: `1px solid ${THEME.accentBorder}` }}>
                {k}
                <i className="ti ti-x text-[11px] cursor-pointer" onClick={() => saveKeywords(data.keywords.filter(x => x !== k), `Keyword "${k}" removed`)} aria-hidden="true"></i>
              </span>
            ))}
          </div>
        </div>
      </Card>

      {adding && (
        <RuleModal type={adding} institutions={institutions} onClose={() => setAdding(null)}
          onSaved={async (r) => { setAdding(null); await load(); onChanged(`${r.domain} ${r.type === 'allow' ? 'allowed' : 'blocked'} — push to apply`) }} />
      )}
    </div>
  )
}

function RuleModal({ type, institutions, onClose, onSaved }) {
  const [domain, setDomain] = useState('')
  const [scope, setScope] = useState('All institutions')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const valid = /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(domain.trim().replace(/^https?:\/\//, ''))
  const submit = async (e) => { e.preventDefault(); if (!valid) return; setBusy(true); onSaved(await addRule({ type, domain, scope, note: note.trim() })) }
  return (
    <Modal title={type === 'allow' ? 'Allow a website' : 'Block a website'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Website / domain" hint="Sub-domains are included automatically, e.g. youtube.com covers m.youtube.com">
          <Input autoFocus value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" className="mono" />
        </Field>
        <Field label="Apply to">
          <Select value={scope} onChange={e => setScope(e.target.value)} className="w-full">
            <option>All institutions</option>
            {institutions.map(i => <option key={i.id}>{i.name}</option>)}
          </Select>
        </Field>
        <Field label="Note (optional)"><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Why this rule exists" /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn type="submit" variant={type === 'allow' ? 'success' : 'danger'} icon={type === 'allow' ? 'ti-circle-check' : 'ti-ban'} loading={busy} disabled={!valid}>{type === 'allow' ? 'Allow site' : 'Block site'}</Btn>
        </div>
      </form>
    </Modal>
  )
}

/* ───────── Browser settings ───────── */

function SettingsTab({ onChanged }) {
  const [cfg, setCfg] = useState(null)
  const [home, setHome] = useState('')
  const [kioskUrl, setKioskUrl] = useState('')
  useEffect(() => { getConfig().then(c => { setCfg(c); setHome(c.homepage); setKioskUrl(c.kioskUrl) }) }, [])
  if (!cfg) return <Loader />

  const set = async (patch, msg) => { setCfg(c => ({ ...c, ...patch })); await updateConfig(patch); onChanged(msg) }
  const rows = [
    ['safeSearch', 'ti-search', 'Enforce SafeSearch', 'Google & Bing always use strict SafeSearch'],
    ['youtubeRestricted', 'ti-brand-youtube', 'YouTube restricted mode', 'Hides mature videos and comments'],
    ['incognito', 'ti-spy', 'Allow incognito / private tabs', 'Off = every visit is logged'],
    ['downloads', 'ti-download', 'Allow file downloads', 'Off = no APK/EXE or file downloads from the web'],
    ['printing', 'ti-printer', 'Allow printing', ''],
    ['clearOnExit', 'ti-eraser', 'Clear cookies & sessions on exit', 'Logs students out of every site when the browser closes'],
  ]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <Card>
        <CardHeader title="Browser behaviour" />
        <div className="px-5 py-1">
          {rows.map(([k, ic, l, d], i) => (
            <div key={k}>
              {i > 0 && <div style={{ borderTop: `1px solid ${C.border}` }} />}
              <Toggle icon={ic} label={l} desc={d} on={cfg[k]} onChange={v => set({ [k]: v }, `${l}: ${v ? 'on' : 'off'} — push to apply`)} />
            </div>
          ))}
        </div>
      </Card>
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader title="Home page" />
          <div className="p-5">
            <Field label="Default home page" hint="Opens on every new tab and browser launch">
              <div className="flex gap-2">
                <Input value={home} onChange={e => setHome(e.target.value)} className="mono" />
                <Btn variant="primary" icon="ti-device-floppy" disabled={home === cfg.homepage} onClick={() => set({ homepage: home }, 'Home page saved — push to apply')}>Save</Btn>
              </div>
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Kiosk mode" sub="Lock the browser to a single website — for exams or digital notice boards"
            right={<Switch on={cfg.kiosk} onChange={v => { if (v && !kioskUrl.trim()) { setCfg(c => ({ ...c, kiosk: true })); return } set({ kiosk: v, kioskUrl }, v ? 'Kiosk mode on — push to apply' : 'Kiosk mode off — push to apply') }} />} />
          {cfg.kiosk && (
            <div className="p-5">
              <Field label="Kiosk URL">
                <div className="flex gap-2">
                  <Input value={kioskUrl} onChange={e => setKioskUrl(e.target.value)} placeholder="https://exam.easylearn.org.in" className="mono" />
                  <Btn variant="accent" icon="ti-device-floppy" disabled={!kioskUrl.trim()} onClick={() => set({ kiosk: true, kioskUrl: kioskUrl.trim() }, 'Kiosk URL saved — push to apply')}>Save</Btn>
                </div>
              </Field>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ───────── Activity log ───────── */

function ActivityTab({ toast }) {
  const [rows, setRows] = useState(null)
  const [cat, setCat] = useState('all')
  const [offOnly, setOffOnly] = useState(false)
  const [q, setQ] = useState('')
  const [exporting, setExporting] = useState(false)
  const [freshIds, setFreshIds] = useState([])
  const prevIds = useRef(null)

  const load = useCallback(async () => {
    const next = await getActivity()
    if (prevIds.current) setFreshIds(next.filter(r => !prevIds.current.has(r.id)).map(r => r.id))
    prevIds.current = new Set(next.map(r => r.id))
    setRows(next)
  }, [])
  useEffect(() => { load() }, [load])
  usePoll(load, true, 4000)

  const shown = useMemo(() => (rows || []).filter(r =>
    (cat === 'all' || r.category === cat) && (!offOnly || r.offHours) &&
    (!q.trim() || (r.url + r.device + r.school).toLowerCase().includes(q.trim().toLowerCase()))), [rows, cat, offOnly, q])

  const doExport = async () => { setExporting(true); downloadBlob(await exportActivity(shown), `browser-activity-${new Date().toISOString().slice(0, 10)}.csv`); setExporting(false); toast('Report downloaded') }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search site, device or school"
              className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-60" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
          </div>
          <Select value={cat} onChange={e => setCat(e.target.value)}>
            <option value="all">All categories</option>
            {Object.entries(CAT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
          <label className="flex items-center gap-2 text-[12px] font-semibold cursor-pointer" style={{ color: C.textSecondary }}>
            <Switch on={offOnly} onChange={setOffOnly} /> Off-hours only
          </label>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: C.success }}><span className="w-1.5 h-1.5 rounded-full mk-live" style={{ background: C.success }} />Live</span>
          <Btn variant="primary" icon="ti-file-spreadsheet" loading={exporting} onClick={doExport}>Export to Excel</Btn>
        </div>
      </div>
      {!rows ? <Loader label="Loading browser activity…" /> : shown.length === 0 ? <Empty>No matching activity.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 820 }}>
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                <th className="px-5 py-2.5">Time</th><th className="px-3 py-2.5">Site / search</th><th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Device</th><th className="px-3 py-2.5">Institution</th><th className="px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 60).map(r => (
                <tr key={r.id} className="mk-row" style={{ borderTop: `1px solid ${C.border}`, background: freshIds.includes(r.id) ? THEME.accentBg : undefined, transition: 'background 1.2s ease' }}>
                  <td className="px-5 py-2.5 text-[12px] whitespace-nowrap" style={{ color: C.textSecondary }}>
                    {timeAgo(r.at)}{r.offHours && <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: C.warningBg, color: C.warning }}>Off-hours</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px] font-semibold mono" style={{ color: C.textPrimary }}>{r.url}</td>
                  <td className="px-3 py-2.5 text-[12px]" style={{ color: C.textSecondary }}>{CAT_LABEL[r.category] || r.category}</td>
                  <td className="px-3 py-2.5 text-[12px] mono" style={{ color: C.textSecondary }}>{r.device}</td>
                  <td className="px-3 py-2.5 text-[12px]" style={{ color: C.textSecondary }}>{r.school}</td>
                  <td className="px-5 py-2.5 text-right"><Pill small meta={PILL.danger()}>{r.action}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

/* ───────── Push ───────── */

function PushModal({ institutions, onClose, onPushed }) {
  const [targets, setTargets] = useState([])
  const [busy, setBusy] = useState(false)
  const count = targets.reduce((s, id) => s + deviceCountFor(institutions.find(i => i.id === id) || {}), 0)
  const submit = async () => {
    setBusy(true)
    const names = institutions.filter(i => targets.includes(i.id)).map(i => i.name)
    onPushed(await pushConfig({ deviceCount: count, targetLabel: targets.length === institutions.length ? 'All institutions' : names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0] }))
  }
  return (
    <Modal title="Push browser policy" onClose={onClose} width={560}>
      <TargetPicker institutions={institutions} value={targets} onChange={setTargets} countFor={deviceCountFor} />
      <div className="flex justify-end gap-2 pt-5">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-send" loading={busy} disabled={!targets.length} onClick={submit}>Push to {fmt(count)} devices</Btn>
      </div>
    </Modal>
  )
}
