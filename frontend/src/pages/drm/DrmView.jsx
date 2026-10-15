import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MdmPage, C, Card, CardHeader, Btn, IconBtn, Loader, Empty, Modal, Field, Input, Select, Toggle, Switch, Chips,
  Segmented, Kpi, Pill, PILL, Stepper, useToasts, usePoll, timeAgo, fmt, downloadBlob,
} from '../../components/mdm/MdmKit'
import { getInstitutions } from '../../api/appManagement'
import {
  DEFAULT_POLICY, getDrmSummary, getAssets, protectAsset, rotateKey, verifyIntegrity, setAssetPolicy, revokeAsset,
  getPolicies, savePolicy, getLicenses, issueLicense, renewLicense, revokeLicense, addSeats,
  getDevices, setDeviceStatus, getEvents, exportEvents, traceLeak, getTraces,
} from '../../api/drm'

const ACCENT = '#4F46E5'
const THEME = {
  accent: ACCENT, accentDeep: '#3730A3', accentBg: '#EEF2FF', accentBorder: '#C7D2FE',
  gradient: 'linear-gradient(135deg, #4F46E5, #818CF8)',
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { key: 'content', label: 'Protected Content', icon: 'ti-lock' },
  { key: 'policies', label: 'Rights Policies', icon: 'ti-adjustments' },
  { key: 'licenses', label: 'Licenses', icon: 'ti-certificate' },
  { key: 'devices', label: 'Devices', icon: 'ti-devices' },
  { key: 'forensics', label: 'Forensics & Audit', icon: 'ti-fingerprint' },
]

const TYPE_META = {
  video: { label: 'Video', icon: 'ti-player-play', color: '#7C5CFC' },
  pdf: { label: 'PDF', icon: 'ti-file-type-pdf', color: '#E4483C' },
  ebook: { label: 'eBook', icon: 'ti-book', color: '#0891B2' },
  doc: { label: 'Document', icon: 'ti-file-text', color: '#2563EB' },
}
const LIC_STATUS = {
  active: PILL.success(),
  expiring: PILL.warning('ti-hourglass'),
  expired: PILL.neutral('ti-clock-off'),
  revoked: PILL.danger('ti-ban'),
  scheduled: { color: THEME.accentDeep, bg: THEME.accentBg, border: THEME.accentBorder, icon: 'ti-calendar-time' },
}
const sizeLabel = (mb) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`)
const dateLabel = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const daysLeft = (iso) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)

export default function DrmView() {
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const { toasts, toast } = useToasts()

  const refreshSummary = useCallback(() => getDrmSummary().then(setSummary).catch(() => {}), [])
  useEffect(() => { refreshSummary(); getInstitutions().then(setInstitutions) }, [refreshSummary])

  return (
    <MdmPage {...THEME} icon="ti-shield-lock" title="Digital Rights Management"
      subtitle="Encrypt, license and track every video, PDF and eBook you distribute"
      tabs={TABS} tab={tab} onTab={setTab} toasts={toasts}
      activeKey="drm" backPath="/home" backLabel="Home"
      badges={{ licenses: summary?.expiring || 0, forensics: 'live' }}
      status={summary ? `Live · ${fmt(summary.devices)} devices authorized` : 'connecting…'}
      right={<span className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full" style={{ color: THEME.accentDeep, background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
        <i className="ti ti-key text-[12px] mr-1" aria-hidden="true"></i>License server online</span>}>
      {tab === 'overview' && <OverviewTab summary={summary} goTo={setTab} />}
      {tab === 'content' && <ContentTab toast={toast} onChange={refreshSummary} />}
      {tab === 'policies' && <PoliciesTab toast={toast} />}
      {tab === 'licenses' && <LicensesTab institutions={institutions} toast={toast} onChange={refreshSummary} />}
      {tab === 'devices' && <DevicesTab toast={toast} onChange={refreshSummary} />}
      {tab === 'forensics' && <ForensicsTab toast={toast} />}
    </MdmPage>
  )
}

/* ───────── Overview ───────── */

function OverviewTab({ summary, goTo }) {
  if (!summary) return <Loader label="Connecting to license server…" />
  const pipeline = [
    { icon: 'ti-cloud-lock', title: 'Encrypted storage', text: 'AES-encrypted files & HLS segments' },
    { icon: 'ti-key', title: 'License server', text: 'Checks user, device, time & place' },
    { icon: 'ti-clock-shield', title: 'Short-lived key', text: 'Device-bound key, auto-expires' },
    { icon: 'ti-eye-check', title: 'Watermarked view', text: 'User ID + time on every screen' },
  ]
  const maxViews = Math.max(1, ...summary.topAssets.map(a => a.views))
  const maxDen = Math.max(1, ...summary.deniedByReason.map(d => d[1]))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Protected content" value={summary.assets} sub={`${summary.storageGb} GB encrypted`} icon="ti-lock" color={ACCENT} />
        <Kpi label="Active licenses" value={summary.activeLicenses} sub={summary.expiring ? `${summary.expiring} expiring in 14 days` : `${fmt(summary.seatsUsed)} seats in use`} icon="ti-certificate" color={C.success} />
        <Kpi label="Authorized devices" value={fmt(summary.devices)} sub={`${summary.blockedDevices} blocked`} icon="ti-devices" color="#0891B2" />
        <Kpi label="Access today" value={fmt(summary.accessToday)} sub={`${fmt(summary.deniedToday)} attempts denied`} icon="ti-activity" color={C.red} />
      </div>

      <Card className="p-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: C.textMuted }}>How every file is protected</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {pipeline.map((p, i) => (
            <div key={p.title} className="relative rounded-xl p-4 flex items-start gap-3" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fff' }}>
                <i className={`ti ${p.icon} text-[17px]`} style={{ color: ACCENT }} aria-hidden="true"></i>
              </span>
              <div>
                <div className="text-[12.5px] font-bold" style={{ color: C.textPrimary }}>{i + 1}. {p.title}</div>
                <div className="text-[11.5px] mt-0.5" style={{ color: C.textSecondary }}>{p.text}</div>
              </div>
              {i < pipeline.length - 1 && <i className="ti ti-chevron-right hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-[16px] z-10" style={{ color: ACCENT }} aria-hidden="true"></i>}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Security alerts" sub="Blocked attempts reported by the DRM player"
            right={<Btn icon="ti-arrow-right" onClick={() => goTo('forensics')}>Audit log</Btn>} />
          {summary.alerts.length === 0 ? <Empty icon="ti-shield-check">No alerts.</Empty> : summary.alerts.map(a => (
            <div key={a.id} className="mk-row px-5 py-3 flex items-start gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: C.dangerBg }}>
                <i className="ti ti-shield-x text-[15px]" style={{ color: C.danger }} aria-hidden="true"></i>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{a.action} — <span style={{ color: C.danger }}>{a.reason}</span></div>
                <div className="text-[11.5px] mt-0.5 truncate" style={{ color: C.textMuted }}>{a.user} · <span className="mono">{a.device}</span> · {a.asset}</div>
              </div>
              <span className="text-[11px] shrink-0" style={{ color: C.textMuted }}>{timeAgo(a.at)}</span>
            </div>
          ))}
        </Card>

        <div className="xl:col-span-2 flex flex-col gap-5">
          <Card>
            <CardHeader title="Most accessed content" />
            <div className="p-5 flex flex-col gap-3">
              {summary.topAssets.map(a => (
                <div key={a.title}>
                  <div className="flex justify-between gap-3 text-[12px] mb-1.5">
                    <span className="font-semibold truncate" style={{ color: C.textPrimary }}>{a.title}</span>
                    <span className="shrink-0" style={{ color: C.textSecondary }}>{fmt(a.views)}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${(a.views / maxViews) * 100}%`, background: TYPE_META[a.type].color }} /></div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Denied today — by reason" />
            <div className="p-5 flex flex-col gap-3">
              {summary.deniedByReason.length === 0 ? <div className="text-[12px]" style={{ color: C.textMuted }}>Nothing denied today.</div> : summary.deniedByReason.map(([r, n]) => (
                <div key={r}>
                  <div className="flex justify-between text-[12px] mb-1.5"><span className="font-semibold" style={{ color: C.textPrimary }}>{r}</span><span style={{ color: C.textSecondary }}>{n}</span></div>
                  <div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${(n / maxDen) * 100}%`, background: C.red }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ───────── Protected content ───────── */

function ContentTab({ toast, onChange }) {
  const [assets, setAssets] = useState(null)
  const [policies, setPolicies] = useState([])
  const [type, setType] = useState('all')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [detail, setDetail] = useState(null)

  const load = useCallback(() => getAssets().then(setAssets), [])
  useEffect(() => { load(); getPolicies().then(setPolicies) }, [load])

  const counts = useMemo(() => {
    const c = { all: assets?.length || 0 }
    Object.keys(TYPE_META).forEach(k => { c[k] = assets?.filter(a => a.type === k).length || 0 })
    return c
  }, [assets])
  const shown = (assets || []).filter(a => (type === 'all' || a.type === type) && (!q.trim() || a.title.toLowerCase().includes(q.trim().toLowerCase())))

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search content"
              className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-56" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
          </div>
          <Chips options={[['all', 'All'], ...Object.entries(TYPE_META).map(([k, m]) => [k, m.label])]} value={type} onChange={setType} counts={counts} />
        </div>
        <Btn variant="accent" icon="ti-lock-plus" onClick={() => setAdding(true)}>Protect new content</Btn>
      </div>
      {!assets ? <Loader label="Loading protected content…" /> : shown.length === 0 ? <Empty icon="ti-lock-off">No content here.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 900 }}>
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                <th className="px-5 py-2.5">Content</th><th className="px-3 py-2.5">Protection</th><th className="px-3 py-2.5">Rights policy</th>
                <th className="px-3 py-2.5">Licenses</th><th className="px-3 py-2.5">Opens</th><th className="px-5 py-2.5 text-right">Key</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(a => {
                const m = TYPE_META[a.type]
                return (
                  <tr key={a.id} className="mk-row cursor-pointer" style={{ borderTop: `1px solid ${C.border}` }} onClick={() => setDetail(a)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative" style={{ background: m.color + '14' }}>
                          <i className={`ti ${m.icon} text-[18px]`} style={{ color: m.color }} aria-hidden="true"></i>
                          <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center" style={{ background: ACCENT, width: 18, height: 18, border: '2px solid #fff' }}>
                            <i className="ti ti-lock text-[9px] text-white" aria-hidden="true"></i>
                          </span>
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold truncate max-w-[320px]" style={{ color: C.textPrimary }}>{a.title}</div>
                          <div className="text-[11px]" style={{ color: C.textMuted }}>{m.label} · {a.meta} · {sizeLabel(a.sizeMb)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-[12px] font-semibold" style={{ color: C.textPrimary }}>{a.encryption}</div>
                      <div className="text-[11px]" style={{ color: C.textMuted }}>{a.watermark ? 'Forensic watermark on' : 'No watermark'}</div>
                    </td>
                    <td className="px-3 py-3"><span className="text-[11.5px] font-semibold px-2 py-1 rounded-lg" style={{ background: THEME.accentBg, color: THEME.accentDeep }}>{a.policy}</span></td>
                    <td className="px-3 py-3 text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{a.licenses}</td>
                    <td className="px-3 py-3 text-[12.5px]" style={{ color: C.textSecondary }}>{fmt(a.views)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="text-[11px] mono" style={{ color: C.textSecondary }}>{a.keyId}</div>
                      <div className="text-[10.5px]" style={{ color: C.textMuted }}>rotated {timeAgo(a.keyRotatedAt)}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <ProtectWizard policies={policies} onClose={() => setAdding(false)}
          onDone={async (a) => { setAdding(false); await load(); onChange(); toast(`Protected — ${a.title} (${a.encryption})`) }} />
      )}
      {detail && (
        <AssetDetail asset={detail} policies={policies} toast={toast} onClose={() => setDetail(null)}
          onChanged={async () => { await load(); onChange() }} />
      )}
    </Card>
  )
}

function ProtectWizard({ policies, onClose, onDone }) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [policyId, setPolicyId] = useState(policies[0]?.id || '')
  const [watermark, setWatermark] = useState(true)
  const [stage, setStage] = useState(null)
  const [drag, setDrag] = useState(false)
  const ref = useRef(null)

  const pick = (f) => { if (!f) return; setFile(f); setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')) }
  const run = async () => {
    setStep(3)
    const a = await protectAsset(file, { title: title.trim(), policyId, watermark }, (i, pct, stages) => setStage({ i, pct, stages }))
    setStage(s => ({ ...s, done: true, asset: a }))
  }

  return (
    <Modal title="Protect new content" onClose={stage && !stage.done ? () => {} : onClose} width={600}>
      <Stepper steps={['Choose file', 'Rights & watermark', 'Encrypt & register']} step={step} />
      {step === 1 && (
        <>
          {!file ? (
            <div onClick={() => ref.current?.click()} onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]) }}
              className="rounded-2xl py-10 px-6 flex flex-col items-center text-center cursor-pointer"
              style={{ border: `2px dashed ${drag ? ACCENT : C.borderStrong}`, background: drag ? THEME.accentBg : C.surfaceAlt }}>
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
                <i className="ti ti-cloud-lock text-[22px]" style={{ color: ACCENT }} aria-hidden="true"></i>
              </span>
              <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>Drop the original file here or click to browse</div>
              <div className="text-[11.5px] mt-1" style={{ color: C.textMuted }}>MP4 video · PDF · EPUB · Word — encrypted on the server, original never leaves it</div>
              <input ref={ref} type="file" accept=".mp4,.mkv,.mov,.webm,.pdf,.epub,.doc,.docx" className="hidden" onChange={e => pick(e.target.files?.[0])} />
            </div>
          ) : (
            <>
              <div className="rounded-xl p-3.5 mb-4 flex items-center gap-3" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                <i className="ti ti-file text-[20px]" style={{ color: C.textSecondary }} aria-hidden="true"></i>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold mono truncate" style={{ color: C.textPrimary }}>{file.name}</div>
                  <div className="text-[11px]" style={{ color: C.textMuted }}>{sizeLabel(file.size / (1024 * 1024))}</div>
                </div>
                <button onClick={() => setFile(null)} className="text-[11.5px] font-semibold cursor-pointer" style={{ color: C.textMuted, background: 'transparent', border: 'none' }}>Replace</button>
              </div>
              <Field label="Title shown to students"><Input value={title} onChange={e => setTitle(e.target.value)} /></Field>
            </>
          )}
          <div className="flex justify-end gap-2 pt-3">
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" icon="ti-arrow-right" disabled={!file || !title.trim()} onClick={() => setStep(2)}>Continue</Btn>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.textPrimary }}>Rights policy</div>
          <div className="flex flex-col gap-2 mb-4">
            {policies.map(p => (
              <button key={p.id} type="button" onClick={() => setPolicyId(p.id)} className="text-left px-4 py-3 rounded-xl cursor-pointer"
                style={{ border: `1px solid ${policyId === p.id ? ACCENT : C.border}`, background: policyId === p.id ? THEME.accentBg : C.surface }}>
                <div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{p.name}</div>
                <div className="text-[11px]" style={{ color: C.textMuted }}>{p.desc}</div>
              </button>
            ))}
          </div>
          <div className="rounded-xl px-4 py-1" style={{ border: `1px solid ${C.border}` }}>
            <Toggle icon="ti-fingerprint" label="Forensic watermark" desc="Student name, ID and time stamped on every page / frame — traceable if leaked" on={watermark} onChange={setWatermark} />
          </div>
          <div className="flex justify-between gap-2 pt-5">
            <Btn icon="ti-arrow-left" onClick={() => setStep(1)}>Back</Btn>
            <Btn variant="accent" icon="ti-lock" onClick={run}>Encrypt & protect</Btn>
          </div>
        </>
      )}
      {step === 3 && stage && (
        <>
          <div className="flex flex-col gap-2.5">
            {stage.stages.map(([k, label], i) => {
              const state = stage.done || i < stage.i ? 'done' : i === stage.i ? 'run' : 'todo'
              return (
                <div key={k} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ border: `1px solid ${state === 'run' ? ACCENT : C.border}`, background: state === 'run' ? THEME.accentBg : C.surface }}>
                  <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: state === 'done' ? C.success : state === 'run' ? ACCENT : C.surfaceAlt }}>
                    <i className={`ti ${state === 'done' ? 'ti-check' : state === 'run' ? 'ti-loader-2 animate-spin' : 'ti-point'} text-[12px]`} style={{ color: state === 'todo' ? C.textMuted : '#fff' }} aria-hidden="true"></i>
                  </span>
                  <span className="text-[12.5px] font-semibold flex-1" style={{ color: state === 'todo' ? C.textMuted : C.textPrimary }}>{label}</span>
                  {state === 'run' && <span className="text-[11.5px] font-semibold" style={{ color: THEME.accentDeep }}>{stage.pct}%</span>}
                </div>
              )
            })}
          </div>
          {stage.done && (
            <div className="mt-4 rounded-xl p-4 text-[12px]" style={{ background: C.successBg, border: `1px solid ${C.successBorder}` }}>
              <div className="font-bold mb-2 flex items-center gap-1.5" style={{ color: C.success }}><i className="ti ti-shield-check" aria-hidden="true"></i> Content is now protected</div>
              <div className="grid grid-cols-[110px_1fr] gap-y-1" style={{ color: C.textPrimary }}>
                <span style={{ color: C.textMuted }}>Encryption</span><span>{stage.asset.encryption}</span>
                <span style={{ color: C.textMuted }}>Key ID</span><span className="mono">{stage.asset.keyId}</span>
                <span style={{ color: C.textMuted }}>SHA-256</span><span className="mono truncate">{stage.asset.sha256}</span>
                <span style={{ color: C.textMuted }}>Policy</span><span>{stage.asset.policy}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-5">
            <Btn variant="accent" icon="ti-check" disabled={!stage.done} onClick={() => onDone(stage.asset)}>Done</Btn>
          </div>
        </>
      )}
    </Modal>
  )
}

function AssetDetail({ asset, policies, toast, onClose, onChanged }) {
  const [a, setA] = useState(asset)
  const [busy, setBusy] = useState(null)
  const [verified, setVerified] = useState(null)
  const m = TYPE_META[a.type]

  const doRotate = async () => { setBusy('rotate'); const n = await rotateKey(a.id); setA(x => ({ ...x, keyId: n.keyId, keyRotatedAt: n.keyRotatedAt })); setBusy(null); onChanged(); toast('Content key rotated — devices will fetch the new key on next open') }
  const doVerify = async () => { setBusy('verify'); const r = await verifyIntegrity(a.id); setVerified(r); setBusy(null); toast('Integrity verified — file matches its registered hash') }
  const doPolicy = async (pid) => { setBusy('policy'); await setAssetPolicy(a.id, pid); setA(x => ({ ...x, policyId: pid, policy: policies.find(p => p.id === pid)?.name })); setBusy(null); onChanged(); toast('Rights policy updated — applies on next license check') }
  const doRevoke = async () => {
    if (!window.confirm('Revoke every license for this content? All students lose access immediately.')) return
    setBusy('revoke'); const r = await revokeAsset(a.id); setBusy(null); onChanged(); setA(x => ({ ...x, licenses: 0 })); toast(`${r.revoked} license${r.revoked === 1 ? '' : 's'} revoked`)
  }

  return (
    <Modal title={a.title} onClose={onClose} width={620}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Pill meta={{ color: m.color, bg: m.color + '14', border: m.color + '40', icon: m.icon }}>{m.label}</Pill>
        <Pill meta={PILL.success('ti-lock')}>Protected</Pill>
        {a.watermark && <Pill meta={{ color: THEME.accentDeep, bg: THEME.accentBg, border: THEME.accentBorder, icon: 'ti-fingerprint' }}>Forensic watermark</Pill>}
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-[12.5px] mb-5">
        {[
          ['Encryption', a.encryption], ['Size', `${sizeLabel(a.sizeMb)} · ${a.meta}`],
          ['Content key ID', <span className="mono">{a.keyId}</span>], ['Key last rotated', timeAgo(a.keyRotatedAt)],
          ['Protected on', dateLabel(a.protectedAt)], ['Owner', a.owner],
          ['Active licenses', a.licenses], ['Total opens', fmt(a.views)],
        ].map(([k, v]) => (
          <div key={k}>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: C.textMuted }}>{k}</div>
            <div style={{ color: C.textPrimary }}>{v}</div>
          </div>
        ))}
        <div className="col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: C.textMuted }}>SHA-256 (integrity)</div>
          <div className="mono text-[11.5px] break-all" style={{ color: C.textSecondary }}>{a.sha256}</div>
          {verified && <div className="text-[11.5px] mt-1 font-semibold flex items-center gap-1" style={{ color: C.success }}><i className="ti ti-circle-check" aria-hidden="true"></i>Verified {timeAgo(verified.checkedAt)} — no tampering</div>}
        </div>
      </div>
      <Field label="Rights policy">
        <Select value={a.policyId} onChange={e => doPolicy(e.target.value)} className="w-full">
          {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Field>
      <div className="flex flex-wrap justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
        <Btn icon="ti-shield-check" loading={busy === 'verify'} onClick={doVerify}>Verify integrity</Btn>
        <Btn icon="ti-refresh" loading={busy === 'rotate'} onClick={doRotate}>Rotate key</Btn>
        <Btn variant="danger" icon="ti-ban" loading={busy === 'revoke'} onClick={doRevoke}>Revoke all access</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Rights policies ───────── */

const PERMS = [
  ['view', 'View / stream', 'ti-eye'],
  ['download', 'Download for offline', 'ti-download'],
  ['print', 'Print', 'ti-printer'],
  ['copy', 'Copy / paste text', 'ti-copy'],
  ['screenCapture', 'Screenshots & screen recording', 'ti-screenshot'],
  ['annotate', 'Highlights & notes', 'ti-highlight'],
  ['share', 'Share / forward', 'ti-share'],
]

function PoliciesTab({ toast }) {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null)
  const load = useCallback(() => getPolicies().then(setList), [])
  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[12.5px]" style={{ color: C.textSecondary }}>A rights policy decides what a licensee can do with the content — on which devices, for how long, from where.</p>
        <Btn variant="accent" icon="ti-plus" onClick={() => setEditing({})}>New policy</Btn>
      </div>
      {!list ? <Loader /> : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {list.map(p => {
            const s = p.settings
            const time = s.time.mode === 'perpetual' ? 'No expiry' : s.time.mode === 'window' ? 'Exam window' : s.time.mode === 'rental' ? `${s.time.days}-day rental` : `${s.time.days}-day subscription`
            return (
              <Card key={p.id} className="p-5 cursor-pointer transition-all" style={{}}>
                <div onClick={() => setEditing(p)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-bold" style={{ color: C.textPrimary }}>{p.name}</div>
                      <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{p.desc}</div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-lg shrink-0" style={{ background: C.surfaceAlt, color: C.textSecondary }}>{p.assets} item{p.assets === 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {PERMS.map(([k, l, ic]) => {
                      const on = s.perms[k]
                      return (
                        <span key={k} className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
                          style={on ? { background: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` } : { background: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}` }}>
                          <i className={`ti ${on ? ic : 'ti-ban'} text-[11px]`} aria-hidden="true"></i>{k === 'print' && on ? `Print ≤${s.perms.printPages} pages` : l}
                        </span>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                    {[
                      ['ti-devices', `${s.device.maxDevices} device${s.device.maxDevices > 1 ? 's' : ''} · ${s.device.concurrent} at a time`],
                      ['ti-hourglass', time],
                      ['ti-map-pin', s.geo.restrict ? (s.geo.ipRanges.length ? 'Lab network only' : s.geo.regions.join(', ')) : 'Any location'],
                      ['ti-fingerprint', s.watermark.visible ? 'Visible + forensic' : s.watermark.forensic ? 'Forensic only' : 'No watermark'],
                    ].map(([ic, t]) => (
                      <div key={t} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: C.textSecondary }}>
                        <i className={`ti ${ic} text-[13px]`} style={{ color: ACCENT }} aria-hidden="true"></i>{t}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {editing && <PolicyEditor policy={editing} onClose={() => setEditing(null)} onSaved={async (p) => { setEditing(null); await load(); toast(`Policy saved — ${p.name}. Applies on each device's next license check.`) }} />}
    </div>
  )
}

function Section({ icon, title, children, right }) {
  return (
    <div className="rounded-2xl mb-4" style={{ border: `1px solid ${C.border}` }}>
      <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, borderRadius: '16px 16px 0 0' }}>
        <div className="flex items-center gap-2.5"><i className={`ti ${icon} text-[16px]`} style={{ color: ACCENT }} aria-hidden="true"></i><div className="text-[13px] font-bold" style={{ color: C.textPrimary }}>{title}</div></div>
        {right}
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  )
}

function WatermarkPreview({ wm }) {
  const text = wm.text.replace('{name}', 'Aarav P.').replace('{id}', 'STU-20261040').replace('{time}', new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }))
  return (
    <div className="relative rounded-xl overflow-hidden h-40 my-3" style={{ background: '#fff', border: `1px solid ${C.border}` }}>
      <div className="p-4 flex flex-col gap-2">
        <div className="h-3 rounded w-2/3" style={{ background: C.surfaceAlt }} />
        {[90, 100, 85, 95, 70, 88].map((w, i) => <div key={i} className="h-2 rounded" style={{ width: `${w}%`, background: C.surfaceAlt }} />)}
      </div>
      {wm.visible && (wm.position === 'tiled' ? (
        <div className="absolute inset-0 flex flex-wrap content-around justify-around pointer-events-none" style={{ opacity: wm.opacity / 100 }}>
          {Array.from({ length: 6 }).map((_, i) => <span key={i} className="text-[10px] font-bold -rotate-[24deg] whitespace-nowrap" style={{ color: ACCENT }}>{text}</span>)}
        </div>
      ) : wm.position === 'footer' ? (
        <div className="absolute bottom-2 inset-x-0 text-center text-[10.5px] font-bold" style={{ color: ACCENT, opacity: Math.max(0.35, wm.opacity / 100) }}>{text}</div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[15px] font-extrabold -rotate-[24deg] whitespace-nowrap" style={{ color: ACCENT, opacity: wm.opacity / 100 }}>{text}</span>
        </div>
      ))}
      {wm.forensic && <span className="absolute top-2 right-2 text-[9.5px] font-bold px-1.5 py-0.5 rounded" style={{ background: THEME.accentBg, color: THEME.accentDeep }}>+ invisible forensic mark</span>}
    </div>
  )
}

const Div = () => <div style={{ borderTop: `1px solid ${C.border}` }} />

function PolicyEditor({ policy, onClose, onSaved }) {
  const [name, setName] = useState(policy.name || '')
  const [desc, setDesc] = useState(policy.desc || '')
  const [s, setS] = useState(() => JSON.parse(JSON.stringify(policy.settings || DEFAULT_POLICY())))
  const [ip, setIp] = useState('')
  const [saving, setSaving] = useState(false)
  const upd = (g, k, v) => setS(p => ({ ...p, [g]: { ...p[g], [k]: v } }))

  const save = async () => { if (!name.trim()) return; setSaving(true); onSaved(await savePolicy({ id: policy.id, name: name.trim(), desc: desc.trim(), settings: s })) }

  return (
    <Modal title={policy.id ? 'Edit rights policy' : 'New rights policy'} onClose={onClose} width={760}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Policy name"><Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Student — View & Offline" /></Field>
        <Field label="Description"><Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Who it is for" /></Field>
      </div>

      <Section icon="ti-key" title="What the licensee can do">
        {PERMS.map(([k, l, ic], i) => (
          <div key={k}>
            {i > 0 && <Div />}
            <Toggle icon={ic} label={l} on={s.perms[k]} onChange={v => upd('perms', k, v)} />
            {k === 'print' && s.perms.print && (
              <div className="pb-3 w-48"><Field label="Max pages per user"><Input type="number" min="1" value={s.perms.printPages || 10} onChange={e => upd('perms', 'printPages', +e.target.value)} /></Field></div>
            )}
          </div>
        ))}
      </Section>

      <Section icon="ti-devices" title="Device limits">
        <div className="grid grid-cols-2 gap-3 pt-3">
          <Field label="Devices per user" hint="Content is bound to each device's hardware fingerprint">
            <Select value={s.device.maxDevices} onChange={e => upd('device', 'maxDevices', +e.target.value)} className="w-full">{[1, 2, 3, 5].map(n => <option key={n} value={n}>{n}</option>)}</Select>
          </Field>
          <Field label="Simultaneous streams">
            <Select value={s.device.concurrent} onChange={e => upd('device', 'concurrent', +e.target.value)} className="w-full">{[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}</Select>
          </Field>
        </div>
      </Section>

      <Section icon="ti-hourglass" title="Time limits">
        <div className="pt-3">
          <Segmented options={[['subscription', 'Subscription'], ['rental', 'Rental'], ['window', 'Fixed window'], ['perpetual', 'No expiry']]} value={s.time.mode} onChange={v => upd('time', 'mode', v)} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            {(s.time.mode === 'subscription' || s.time.mode === 'rental') && (
              <Field label={s.time.mode === 'rental' ? 'Days after first open' : 'Subscription length (days)'}>
                <Input type="number" min="1" value={s.time.days} onChange={e => upd('time', 'days', +e.target.value)} />
              </Field>
            )}
            {s.time.mode === 'window' && (<>
              <Field label="Opens at"><Input type="datetime-local" value={s.time.start} onChange={e => upd('time', 'start', e.target.value)} /></Field>
              <Field label="Closes at"><Input type="datetime-local" value={s.time.end} onChange={e => upd('time', 'end', e.target.value)} /></Field>
            </>)}
            {s.perms.download && s.time.mode !== 'window' && (
              <Field label="Offline grace period (days)" hint="Device must reconnect to renew its key">
                <Input type="number" min="0" value={s.time.offlineDays} onChange={e => upd('time', 'offlineDays', +e.target.value)} />
              </Field>
            )}
          </div>
        </div>
      </Section>

      <Section icon="ti-map-pin" title="Location & network" right={<Switch on={s.geo.restrict} onChange={v => upd('geo', 'restrict', v)} />}>
        {s.geo.restrict ? (
          <div className="py-3">
            <Field label="Allowed region"><Select value={s.geo.regions[0]} onChange={e => upd('geo', 'regions', [e.target.value])} className="w-full">{['India', 'Maharashtra', 'Mumbai Metropolitan Region'].map(r => <option key={r}>{r}</option>)}</Select></Field>
            <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.textPrimary }}>Allowed IP ranges <span className="font-normal" style={{ color: C.textMuted }}>(optional — e.g. school lab)</span></div>
            <div className="flex gap-2 mb-2">
              <Input value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.12.0/24" className="mono" />
              <Btn icon="ti-plus" onClick={() => { if (ip.trim()) { upd('geo', 'ipRanges', [...s.geo.ipRanges, ip.trim()]); setIp('') } }}>Add</Btn>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {s.geo.ipRanges.map(r => (
                <span key={r} className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg mono" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textPrimary }}>
                  {r}<i className="ti ti-x text-[11px] cursor-pointer" style={{ color: C.textMuted }} onClick={() => upd('geo', 'ipRanges', s.geo.ipRanges.filter(x => x !== r))} aria-hidden="true"></i>
                </span>
              ))}
            </div>
          </div>
        ) : <div className="py-3 text-[11.5px]" style={{ color: C.textMuted }}>Off — content opens from any location.</div>}
      </Section>

      <Section icon="ti-adjustments-horizontal" title="Video quality">
        <div className="pt-3 w-56"><Field label="Maximum resolution"><Select value={s.quality.maxRes} onChange={e => upd('quality', 'maxRes', e.target.value)} className="w-full">{['480p', '720p', '1080p'].map(r => <option key={r}>{r}</option>)}</Select></Field></div>
      </Section>

      <Section icon="ti-fingerprint" title="Watermark">
        <Toggle label="Visible watermark" desc="Shown over every page / video frame" on={s.watermark.visible} onChange={v => upd('watermark', 'visible', v)} />
        {s.watermark.visible && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="md:col-span-3"><Field label="Text" hint="Placeholders: {name} {id} {time}"><Input value={s.watermark.text} onChange={e => upd('watermark', 'text', e.target.value)} className="mono" /></Field></div>
            <Field label="Position"><Select value={s.watermark.position} onChange={e => upd('watermark', 'position', e.target.value)} className="w-full"><option value="diagonal">Diagonal centre</option><option value="tiled">Tiled</option><option value="footer">Footer</option></Select></Field>
            <Field label={`Opacity — ${s.watermark.opacity}%`}><input type="range" min="10" max="60" value={s.watermark.opacity} onChange={e => upd('watermark', 'opacity', +e.target.value)} className="w-full" style={{ accentColor: ACCENT }} /></Field>
          </div>
        )}
        <Div />
        <Toggle label="Invisible forensic watermark" desc="Hidden user + device ID — used to trace leaked copies" on={s.watermark.forensic} onChange={v => upd('watermark', 'forensic', v)} />
        <WatermarkPreview wm={s.watermark} />
      </Section>

      <div className="flex justify-end gap-2 pt-1">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-device-floppy" loading={saving} disabled={!name.trim()} onClick={save}>Save policy</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Licenses ───────── */

function LicensesTab({ institutions, toast, onChange }) {
  const [list, setList] = useState(null)
  const [filter, setFilter] = useState('all')
  const [issuing, setIssuing] = useState(false)
  const [busy, setBusy] = useState(null)
  const [renewFor, setRenewFor] = useState(null)

  const load = useCallback(() => getLicenses().then(setList), [])
  useEffect(() => { load() }, [load])

  const counts = useMemo(() => {
    const c = { all: list?.length || 0 }
    ;['active', 'expiring', 'scheduled', 'expired', 'revoked'].forEach(k => { c[k] = list?.filter(l => l.status === k).length || 0 })
    return c
  }, [list])
  const shown = (list || []).filter(l => filter === 'all' || l.status === filter)

  const act = async (l, kind, arg) => {
    setBusy(l.id + kind)
    if (kind === 'revoke') { if (!window.confirm(`Revoke license for ${l.licensee}? Devices lose the key at their next check.`)) { setBusy(null); return } await revokeLicense(l.id); toast(`License revoked — ${l.licensee}`) }
    if (kind === 'renew') { await renewLicense(l.id, arg); toast(`Renewed by ${arg} days — ${l.licensee}`) }
    if (kind === 'seats') { await addSeats(l.id, arg); toast(`${arg} seats added`) }
    await load(); onChange(); setBusy(null); setRenewFor(null)
  }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <Chips options={[['all', 'All'], ['active', 'Active'], ['expiring', 'Expiring'], ['scheduled', 'Scheduled'], ['expired', 'Expired'], ['revoked', 'Revoked']]} value={filter} onChange={setFilter} counts={counts} />
        <Btn variant="accent" icon="ti-certificate" onClick={() => setIssuing(true)}>Issue license</Btn>
      </div>
      {!list ? <Loader label="Loading licenses…" /> : shown.length === 0 ? <Empty icon="ti-certificate-off">No licenses here.</Empty> : shown.map(l => {
        const pct = l.seats ? Math.round((l.used / l.seats) * 100) : 0
        const dl = daysLeft(l.expiresAt)
        return (
          <div key={l.id} className="mk-row px-5 py-4 flex items-center gap-4 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="min-w-0 flex-1" style={{ minWidth: 280 }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>{l.licensee}</span>
                <Pill small meta={LIC_STATUS[l.status]}>{l.status[0].toUpperCase() + l.status.slice(1)}</Pill>
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: C.textSecondary }}>{l.asset}</div>
              <div className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>{l.policy} · issued {dateLabel(l.issuedAt)}</div>
            </div>
            <div className="w-40 shrink-0">
              <div className="flex justify-between text-[11.5px] mb-1"><span style={{ color: C.textSecondary }}>Seats</span><b style={{ color: C.textPrimary }}>{fmt(l.used)} / {fmt(l.seats)}</b></div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.surfaceAlt }}><div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? C.red : ACCENT }} /></div>
            </div>
            <div className="w-32 shrink-0 text-[11.5px]">
              <div style={{ color: C.textMuted }}>{l.status === 'expired' ? 'Expired' : 'Expires'}</div>
              <div className="font-semibold" style={{ color: l.status === 'expiring' ? C.warning : C.textPrimary }}>{dateLabel(l.expiresAt)}</div>
              {dl > 0 && l.status !== 'revoked' && <div style={{ color: l.status === 'expiring' ? C.warning : C.textMuted }}>{dl} days left</div>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 relative">
              {l.status !== 'revoked' && (
                <>
                  <Btn icon="ti-calendar-plus" loading={busy?.startsWith(l.id + 'renew')} onClick={() => setRenewFor(renewFor === l.id ? null : l.id)}>Renew</Btn>
                  {pct >= 90 && <Btn icon="ti-users-plus" loading={busy === l.id + 'seats'} onClick={() => act(l, 'seats', 50)}>+50 seats</Btn>}
                  <IconBtn icon="ti-ban" title="Revoke" danger loading={busy === l.id + 'revoke'} onClick={() => act(l, 'revoke')} />
                </>
              )}
              {renewFor === l.id && (
                <div className="absolute right-0 top-11 z-20 rounded-xl p-1.5 flex flex-col mk-pop" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 16px 32px -14px rgba(26,26,24,0.3)' }}>
                  {[30, 90, 365].map(d => (
                    <button key={d} onClick={() => act(l, 'renew', d)} className="text-left text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer mk-row" style={{ background: 'transparent', border: 'none', color: C.textPrimary }}>+{d} days</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
      {issuing && <IssueModal institutions={institutions} onClose={() => setIssuing(false)} onIssued={async (l) => { setIssuing(false); await load(); onChange(); toast(`License issued — ${l.licensee} · ${fmt(l.seats)} seats`) }} />}
    </Card>
  )
}

function IssueModal({ institutions, onClose, onIssued }) {
  const [assets, setAssets] = useState([])
  const [policies, setPolicies] = useState([])
  const [form, setForm] = useState({ school: '', group: '', assetId: '', policyId: '', seats: 100, days: 365, startsAt: '' })
  const [issued, setIssued] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    getAssets().then(a => { setAssets(a); setForm(f => ({ ...f, assetId: f.assetId || a[0]?.id || '', policyId: f.policyId || a[0]?.policyId || '' })) })
    getPolicies().then(setPolicies)
  }, [])
  useEffect(() => { if (institutions[0] && !form.school) setForm(f => ({ ...f, school: institutions[0].name })) }, [institutions, form.school])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.school && form.group.trim() && form.assetId && form.policyId && form.seats > 0 && form.days > 0

  const submit = async () => {
    setBusy(true)
    const l = await issueLicense({ licensee: `${form.school} — ${form.group.trim()}`, assetId: form.assetId, policyId: form.policyId, seats: form.seats, days: form.days, startsAt: form.startsAt })
    setIssued(l); setBusy(false)
  }

  return (
    <Modal title="Issue license" onClose={onClose} width={600}>
      {!issued ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3">
            <Field label="Institution"><Select value={form.school} onChange={e => set('school', e.target.value)} className="w-full">{institutions.map(i => <option key={i.id}>{i.name}</option>)}</Select></Field>
            <Field label="Class / group"><Input value={form.group} onChange={e => set('group', e.target.value)} placeholder="e.g. Class 10 (all sections)" /></Field>
          </div>
          <Field label="Content"><Select value={form.assetId} onChange={e => { const a = assets.find(x => x.id === e.target.value); setForm(f => ({ ...f, assetId: e.target.value, policyId: a?.policyId || f.policyId })) }} className="w-full">{assets.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</Select></Field>
          <Field label="Rights policy"><Select value={form.policyId} onChange={e => set('policyId', e.target.value)} className="w-full">{policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Seats (users)"><Input type="number" min="1" value={form.seats} onChange={e => set('seats', +e.target.value)} /></Field>
            <Field label="Valid for (days)"><Input type="number" min="1" value={form.days} onChange={e => set('days', +e.target.value)} /></Field>
            <Field label="Starts" hint="Blank = now"><Input type="date" value={form.startsAt} onChange={e => set('startsAt', e.target.value)} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn variant="accent" icon="ti-certificate" loading={busy} disabled={!valid} onClick={submit}>Issue license</Btn>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl p-5 mb-4 text-center" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
            <i className="ti ti-certificate text-[30px]" style={{ color: ACCENT }} aria-hidden="true"></i>
            <div className="text-[14px] font-bold mt-1" style={{ color: C.textPrimary }}>License issued</div>
            <div className="text-[12px] mt-0.5" style={{ color: C.textSecondary }}>{issued.licensee}</div>
            <div className="mono text-[15px] font-bold mt-3 tracking-wider" style={{ color: THEME.accentDeep }}>{issued.key}</div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-y-1.5 text-[12.5px] mb-4">
            <span style={{ color: C.textMuted }}>Content</span><span style={{ color: C.textPrimary }}>{issued.asset}</span>
            <span style={{ color: C.textMuted }}>Policy</span><span style={{ color: C.textPrimary }}>{issued.policy}</span>
            <span style={{ color: C.textMuted }}>Seats</span><span style={{ color: C.textPrimary }}>{fmt(issued.seats)}</span>
            <span style={{ color: C.textMuted }}>Valid until</span><span style={{ color: C.textPrimary }}>{dateLabel(issued.expiresAt)}</span>
          </div>
          <div className="flex justify-end gap-2">
            <Btn icon="ti-copy" onClick={() => { try { navigator.clipboard.writeText(issued.key) } catch { /* clipboard blocked */ } }}>Copy key</Btn>
            <Btn variant="accent" icon="ti-check" onClick={() => onIssued(issued)}>Done</Btn>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ───────── Devices ───────── */

function DevicesTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(null)
  const load = useCallback(() => getDevices().then(setList), [])
  useEffect(() => { load() }, [load])
  const counts = { all: list?.length || 0, authorized: list?.filter(d => d.status === 'authorized').length || 0, blocked: list?.filter(d => d.status === 'blocked').length || 0 }
  const shown = (list || []).filter(d => filter === 'all' || d.status === filter)

  const toggle = async (d) => {
    const next = d.status === 'authorized' ? 'blocked' : 'authorized'
    if (next === 'blocked' && !window.confirm(`Deauthorize ${d.name}? Its content keys are wiped on next sync.`)) return
    setBusy(d.id); await setDeviceStatus(d.id, next); await load(); onChange(); setBusy(null)
    toast(next === 'blocked' ? `${d.name} deauthorized — keys will be wiped` : `${d.name} authorized`)
  }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <Chips options={[['all', 'All'], ['authorized', 'Authorized'], ['blocked', 'Blocked']]} value={filter} onChange={setFilter} counts={counts} />
        <span className="text-[11.5px]" style={{ color: C.textMuted }}>Each device is bound by a hardware fingerprint — copied files will not open on another device.</span>
      </div>
      {!list ? <Loader /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 900 }}>
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                <th className="px-5 py-2.5">Device</th><th className="px-3 py-2.5">User</th><th className="px-3 py-2.5">Fingerprint</th>
                <th className="px-3 py-2.5">Licenses</th><th className="px-3 py-2.5">Last seen</th><th className="px-5 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(d => (
                <tr key={d.id} className="mk-row" style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: d.status === 'blocked' ? C.dangerBg : THEME.accentBg }}>
                        <i className={`ti ${d.os.startsWith('Android') ? 'ti-device-tablet' : 'ti-device-laptop'} text-[16px]`} style={{ color: d.status === 'blocked' ? C.danger : ACCENT }} aria-hidden="true"></i>
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold mono" style={{ color: C.textPrimary }}>{d.name}</div>
                        <div className="text-[11px]" style={{ color: C.textMuted }}>{d.os} · {d.school}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><div className="text-[12.5px]" style={{ color: C.textPrimary }}>{d.user}</div><div className="text-[11px] mono" style={{ color: C.textMuted }}>{d.userId}</div></td>
                  <td className="px-3 py-3 text-[11.5px] mono" style={{ color: C.textSecondary }}>{d.fingerprint}</td>
                  <td className="px-3 py-3 text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{d.licenses}</td>
                  <td className="px-3 py-3 text-[12px]" style={{ color: C.textSecondary }}>{timeAgo(d.lastSeen)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {d.status === 'blocked' ? <Pill small meta={PILL.danger()}>Blocked</Pill> : <Pill small meta={PILL.success()}>Authorized</Pill>}
                      <Btn variant={d.status === 'blocked' ? 'success' : 'danger'} icon={d.status === 'blocked' ? 'ti-check' : 'ti-ban'} loading={busy === d.id} onClick={() => toggle(d)} className="!px-2.5 !py-1.5 !text-[11.5px]">
                        {d.status === 'blocked' ? 'Authorize' : 'Deauthorize'}
                      </Btn>
                    </div>
                    {d.blockReason && <div className="text-[10.5px] mt-1" style={{ color: C.danger }}>{d.blockReason}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

/* ───────── Forensics & audit ───────── */

function ForensicsTab({ toast }) {
  const [rows, setRows] = useState(null)
  const [result, setResult] = useState('all')
  const [q, setQ] = useState('')
  const [exporting, setExporting] = useState(false)
  const [fresh, setFresh] = useState([])
  const prev = useRef(null)

  const load = useCallback(async () => {
    const next = await getEvents()
    if (prev.current) setFresh(next.filter(r => !prev.current.has(r.id)).map(r => r.id))
    prev.current = new Set(next.map(r => r.id))
    setRows(next)
  }, [])
  useEffect(() => { load() }, [load])
  usePoll(load, true, 4000)

  const counts = { all: rows?.length || 0, allowed: rows?.filter(r => r.result === 'allowed').length || 0, denied: rows?.filter(r => r.result === 'denied').length || 0 }
  const shown = (rows || []).filter(r => (result === 'all' || r.result === result) && (!q.trim() || `${r.user} ${r.userId} ${r.device} ${r.asset} ${r.school}`.toLowerCase().includes(q.trim().toLowerCase())))
  const doExport = async () => { setExporting(true); downloadBlob(await exportEvents(shown), `drm-audit-log-${new Date().toISOString().slice(0, 10)}.csv`); setExporting(false); toast('Audit log downloaded') }

  return (
    <div className="flex flex-col gap-5">
      <LeakTracer toast={toast} />
      <Card>
        <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search user, device, content"
                className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-60" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
            </div>
            <Chips options={[['all', 'All'], ['allowed', 'Allowed'], ['denied', 'Denied']]} value={result} onChange={setResult} counts={counts} />
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: C.success }}><span className="w-1.5 h-1.5 rounded-full mk-live" style={{ background: C.success }} />Live</span>
            <Btn variant="primary" icon="ti-file-spreadsheet" loading={exporting} onClick={doExport}>Export to Excel</Btn>
          </div>
        </div>
        {!rows ? <Loader label="Loading audit log…" /> : shown.length === 0 ? <Empty>No matching events.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 980 }}>
              <thead>
                <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                  <th className="px-5 py-2.5">Time</th><th className="px-3 py-2.5">User</th><th className="px-3 py-2.5">Device / IP</th>
                  <th className="px-3 py-2.5">Content</th><th className="px-3 py-2.5">Action</th><th className="px-5 py-2.5 text-right">Result</th>
                </tr>
              </thead>
              <tbody>
                {shown.slice(0, 60).map(r => (
                  <tr key={r.id} className="mk-row" style={{ borderTop: `1px solid ${C.border}`, background: fresh.includes(r.id) ? THEME.accentBg : undefined, transition: 'background 1.2s ease' }}>
                    <td className="px-5 py-2.5 text-[12px] whitespace-nowrap" style={{ color: C.textSecondary }}>{timeAgo(r.at)}</td>
                    <td className="px-3 py-2.5"><div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{r.user}</div><div className="text-[10.5px] mono" style={{ color: C.textMuted }}>{r.userId}</div></td>
                    <td className="px-3 py-2.5"><div className="text-[12px] mono" style={{ color: C.textSecondary }}>{r.device}</div><div className="text-[10.5px]" style={{ color: C.textMuted }}>{r.ip} · {r.location}</div></td>
                    <td className="px-3 py-2.5 text-[12px] max-w-[260px] truncate" style={{ color: C.textSecondary }}>{r.asset}</td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ color: C.textPrimary }}>{r.action}{r.reason && <div className="text-[10.5px]" style={{ color: C.danger }}>{r.reason}</div>}</td>
                    <td className="px-5 py-2.5 text-right">{r.result === 'allowed' ? <Pill small meta={PILL.success()}>Allowed</Pill> : <Pill small meta={PILL.danger()}>Denied</Pill>}</td>
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

function LeakTracer({ toast }) {
  const [stage, setStage] = useState(null)
  const [res, setRes] = useState(null)
  const [history, setHistory] = useState([])
  const [drag, setDrag] = useState(false)
  const ref = useRef(null)
  useEffect(() => { getTraces().then(setHistory) }, [])

  const run = async (file) => {
    if (!file) return
    setRes(null)
    setStage({ i: 0, pct: 0, stages: [], file: file.name })
    const r = await traceLeak(file, (i, pct, stages) => setStage(s => ({ ...s, i, pct, stages })))
    setStage(null); setRes(r); setHistory(h => [r, ...h])
    toast(`Source identified — ${r.user} (${r.confidence}% match)`, 'info')
  }

  return (
    <Card>
      <CardHeader title="Trace a leaked file" sub="Upload a leaked PDF, video clip or screenshot — the forensic watermark reveals who it came from" />
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          {!stage ? (
            <div onClick={() => ref.current?.click()} onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); run(e.dataTransfer.files?.[0]) }}
              className="rounded-2xl py-9 px-6 flex flex-col items-center text-center cursor-pointer h-full justify-center"
              style={{ border: `2px dashed ${drag ? ACCENT : C.borderStrong}`, background: drag ? THEME.accentBg : C.surfaceAlt, minHeight: 190 }}>
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
                <i className="ti ti-fingerprint text-[22px]" style={{ color: ACCENT }} aria-hidden="true"></i>
              </span>
              <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>Drop the leaked file here</div>
              <div className="text-[11.5px] mt-1" style={{ color: C.textMuted }}>PDF · image · video clip found on WhatsApp, Telegram or the web</div>
              <input ref={ref} type="file" className="hidden" onChange={e => run(e.target.files?.[0])} />
            </div>
          ) : (
            <div className="flex flex-col gap-2" style={{ minHeight: 190 }}>
              <div className="text-[12px] mb-1 mono truncate" style={{ color: C.textSecondary }}>{stage.file}</div>
              {stage.stages.map((label, i) => {
                const st = i < stage.i ? 'done' : i === stage.i ? 'run' : 'todo'
                return (
                  <div key={label} className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ border: `1px solid ${st === 'run' ? ACCENT : C.border}`, background: st === 'run' ? THEME.accentBg : C.surface }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: st === 'done' ? C.success : st === 'run' ? ACCENT : C.surfaceAlt }}>
                      <i className={`ti ${st === 'done' ? 'ti-check' : st === 'run' ? 'ti-loader-2 animate-spin' : 'ti-point'} text-[11px]`} style={{ color: st === 'todo' ? C.textMuted : '#fff' }} aria-hidden="true"></i>
                    </span>
                    <span className="text-[12.5px] font-semibold flex-1" style={{ color: st === 'todo' ? C.textMuted : C.textPrimary }}>{label}</span>
                    {st === 'run' && <span className="text-[11px] font-semibold" style={{ color: THEME.accentDeep }}>{stage.pct}%</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div>
          {res ? (
            <div className="rounded-2xl p-5 mk-pop" style={{ border: `1.5px solid ${C.red}`, background: '#FFF8F7' }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 text-[13.5px] font-bold" style={{ color: C.danger }}><i className="ti ti-target-arrow text-[17px]" aria-hidden="true"></i>Leak source identified</div>
                <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: C.dangerBg, color: C.danger }}>{res.confidence}% match</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-y-1.5 text-[12.5px]">
                {[
                  ['User', <b>{res.user}</b>], ['User ID', <span className="mono">{res.userId}</span>], ['Institution', res.school],
                  ['Device', <span className="mono">{res.device}</span>], ['Fingerprint', <span className="mono">{res.fingerprint}</span>],
                  ['Content', res.asset], ['Opened at', new Date(res.openedAt).toLocaleString('en-IN')], ['IP', res.ip], ['License', res.licensee],
                ].map(([k, v]) => (<Fragment key={k}><span style={{ color: C.textMuted }}>{k}</span><span style={{ color: C.textPrimary }}>{v}</span></Fragment>))}
              </div>
              <div className="text-[10.5px] mono mt-3 px-2.5 py-1.5 rounded-lg truncate" style={{ background: C.surfaceAlt, color: C.textSecondary }}>payload: {res.payload}</div>
            </div>
          ) : (
            <div className="rounded-2xl p-5 h-full flex flex-col justify-center" style={{ background: C.surfaceAlt, minHeight: 190 }}>
              <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.textPrimary }}>How tracing works</div>
              <ol className="text-[12px] flex flex-col gap-1.5 list-decimal pl-4" style={{ color: C.textSecondary }}>
                <li>Every page or frame a student opens carries an invisible mark with their ID, device and time.</li>
                <li>The mark survives screenshots, phone-camera photos, cropping and compression.</li>
                <li>Uploading the leaked copy decodes the mark and matches it to the license record.</li>
              </ol>
              {history.length > 0 && <div className="text-[11.5px] mt-3" style={{ color: C.textMuted }}>{history.length} trace{history.length > 1 ? 's' : ''} run so far · last {timeAgo(history[0].tracedAt)}</div>}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
