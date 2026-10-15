import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MdmPage, C, Card, CardHeader, Btn, IconBtn, Loader, Empty, Modal, Field, Input, Select, Toggle, Switch, Chips,
  Kpi, Pill, PILL, PLATFORM_META, RolloutBar, RolloutStatus, TargetPicker, Stepper,
  useToasts, usePoll, timeAgo, fmt, downloadBlob,
} from '../../components/mdm/MdmKit'
import { getInstitutions } from '../../api/appManagement'
import { deviceCountFor } from '../../api/mdmDemoStore'
import {
  DEFAULT_SETTINGS, getPolicySummary, getPolicies, savePolicy, duplicatePolicy, deletePolicy, pushPolicy,
  getRollouts, retryRollout, getViolations, remediate, getAuditLog, exportCompliance,
} from '../../api/policyManagement'

const ACCENT = '#17B26A'
const THEME = {
  accent: ACCENT, accentDeep: '#0E8A50', accentBg: '#ECFDF5', accentBorder: '#A7E9C8',
  gradient: 'linear-gradient(135deg, #17B26A, #6EE7B7)',
}

const TABS = [
  { key: 'policies', label: 'Policies', icon: 'ti-shield-check' },
  { key: 'compliance', label: 'Compliance', icon: 'ti-alert-octagon' },
  { key: 'rollouts', label: 'Rollouts', icon: 'ti-send' },
  { key: 'audit', label: 'Audit Log', icon: 'ti-history' },
]

const RESTRICTIONS = [
  ['camera', 'Camera', 'ti-camera'],
  ['usbStorage', 'USB / SD card storage', 'ti-device-sd-card'],
  ['bluetooth', 'Bluetooth', 'ti-bluetooth'],
  ['screenshot', 'Screenshots & screen recording', 'ti-screenshot'],
  ['hotspot', 'Mobile hotspot / tethering', 'ti-access-point'],
  ['factoryReset', 'Factory reset by user', 'ti-restore'],
  ['unknownSources', 'Install from unknown sources', 'ti-package-import'],
  ['developerOptions', 'Developer options / USB debugging', 'ti-code'],
]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SEVERITY = {
  high: PILL.danger('ti-alert-octagon'),
  medium: PILL.warning('ti-alert-triangle'),
  low: PILL.neutral('ti-info-circle'),
}

export default function PolicyManagementView() {
  const [tab, setTab] = useState('policies')
  const [summary, setSummary] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const { toasts, toast } = useToasts()

  const refreshSummary = useCallback(() => getPolicySummary().then(setSummary).catch(() => {}), [])
  useEffect(() => { refreshSummary(); getInstitutions().then(setInstitutions) }, [refreshSummary])

  return (
    <MdmPage {...THEME} icon="ti-shield-check" title="Policy Management"
      subtitle="Create security policies once and enforce them on every enrolled device"
      tabs={TABS} tab={tab} onTab={setTab} toasts={toasts}
      badges={{ compliance: summary?.openViolations || 0, rollouts: summary?.running ? 'live' : null }}
      status={summary ? `Live · ${summary.compliancePct}% compliant` : 'connecting…'}>
      {tab === 'policies' && <PoliciesTab summary={summary} institutions={institutions} toast={toast} onChange={refreshSummary} goTo={setTab} />}
      {tab === 'compliance' && <ComplianceTab toast={toast} onChange={refreshSummary} />}
      {tab === 'rollouts' && <RolloutsTab toast={toast} onChange={refreshSummary} />}
      {tab === 'audit' && <AuditTab />}
    </MdmPage>
  )
}

/* ───────── Policies ───────── */

function PoliciesTab({ summary, institutions, toast, onChange, goTo }) {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null) // policy object or {} for new
  const [pushing, setPushing] = useState(null)
  const [busy, setBusy] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => getPolicies().then(setList), [])
  useEffect(() => { load() }, [load])

  const shown = (list || []).filter(p => filter === 'all' || p.status === filter)
  const counts = useMemo(() => ({ all: list?.length, active: list?.filter(p => p.status === 'active').length, draft: list?.filter(p => p.status === 'draft').length }), [list])

  const dup = async (p) => { setBusy(p.id); await duplicatePolicy(p.id); await load(); onChange(); setBusy(null); toast(`Duplicated — ${p.name}`) }
  const del = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? Devices using it will revert to the default policy.`)) return
    setBusy(p.id); await deletePolicy(p.id); await load(); onChange(); setBusy(null); toast(`Policy deleted — ${p.name}`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Active policies" value={summary ? summary.activePolicies : '—'} sub={summary ? `${summary.drafts} draft${summary.drafts === 1 ? '' : 's'}` : ' '} icon="ti-shield-check" color={ACCENT} />
        <Kpi label="Devices covered" value={summary ? fmt(summary.devices) : '—'} sub="Windows + Android" icon="ti-devices" color="#3B6FE0" />
        <Kpi label="Compliance" value={summary ? `${summary.compliancePct}%` : '—'} sub={summary ? `${fmt(summary.compliant)} of ${fmt(summary.devices)} devices` : ' '} icon="ti-circle-check" color={C.success} />
        <Kpi label="Open violations" value={summary ? summary.openViolations : '—'} sub="Need attention" icon="ti-alert-octagon" color={C.red} />
      </div>

      <Card>
        <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
          <Chips options={[['all', 'All'], ['active', 'Active'], ['draft', 'Drafts']]} value={filter} onChange={setFilter} counts={counts} />
          <Btn variant="accent" icon="ti-plus" onClick={() => setEditing({})}>New policy</Btn>
        </div>
        {!list ? <Loader label="Loading policies…" /> : shown.length === 0 ? <Empty icon="ti-shield">No policies here.</Empty> : shown.map(p => {
          const pct = p.devices ? Math.round((p.compliant / p.devices) * 100) : 0
          const plat = PLATFORM_META[p.platform]
          const s = p.settings
          const highlights = [
            !s.restrictions.camera && 'Camera off',
            !s.restrictions.usbStorage && 'USB/SD blocked',
            s.network.wifiFencing && `Wi-Fi fence: ${s.network.ssids.join(', ')}`,
            s.timeFencing.enabled && `${s.timeFencing.start}–${s.timeFencing.end}`,
            s.geofence.enabled && `Geofence ${s.geofence.radiusM} m`,
            s.security.encryptExternal && 'Storage encrypted',
          ].filter(Boolean)
          return (
            <div key={p.id} className="mk-row px-5 py-4 flex items-center gap-4 flex-wrap cursor-pointer" style={{ borderBottom: `1px solid ${C.border}` }} onClick={() => setEditing(p)}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
                <i className={`ti ${plat.icon} text-[18px]`} style={{ color: plat.color }} aria-hidden="true"></i>
              </span>
              <div className="min-w-0 flex-1" style={{ minWidth: 240 }}>
                <div className="text-[13.5px] font-semibold flex items-center gap-2 flex-wrap" style={{ color: C.textPrimary }}>
                  {p.name}
                  <span className="mono text-[11px] font-normal" style={{ color: C.textMuted }}>v{p.version}</span>
                  {p.status === 'draft' ? <Pill small meta={PILL.neutral('ti-pencil')}>Draft</Pill> : <Pill small meta={PILL.success()}>Active</Pill>}
                </div>
                <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{p.desc}</div>
                {highlights.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {highlights.slice(0, 4).map(h => <span key={h} className="text-[10.5px] font-medium px-2 py-0.5 rounded-md" style={{ background: C.surfaceAlt, color: C.textSecondary }}>{h}</span>)}
                  </div>
                )}
              </div>
              <div className="w-48 shrink-0">
                {p.status === 'active' ? (
                  <>
                    <div className="flex justify-between text-[11.5px] mb-1">
                      <span style={{ color: C.textSecondary }}>{p.targets}</span>
                      <b style={{ color: pct >= 95 ? C.success : pct >= 85 ? C.warning : C.red }}>{pct}%</b>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.surfaceAlt }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct >= 95 ? C.success : pct >= 85 ? '#E0A526' : C.red }} />
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>{fmt(p.compliant)} / {fmt(p.devices)} compliant</div>
                  </>
                ) : <div className="text-[11.5px]" style={{ color: C.textMuted }}>Not pushed yet</div>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                <Btn variant={p.status === 'draft' ? 'accent' : 'ghost'} icon="ti-send" onClick={() => setPushing(p)}>Push</Btn>
                <IconBtn icon="ti-copy" title="Duplicate" loading={busy === p.id} onClick={() => dup(p)} />
                <IconBtn icon="ti-trash" title="Delete" danger onClick={() => del(p)} />
              </div>
            </div>
          )
        })}
      </Card>

      {editing && (
        <PolicyEditor policy={editing} onClose={() => setEditing(null)}
          onSaved={async (saved, thenPush) => {
            setEditing(null); await load(); onChange()
            toast(editing.id ? `Saved — ${saved.name} is now v${saved.version}` : `Draft created — ${saved.name}`)
            if (thenPush) setPushing(saved)
          }} />
      )}
      {pushing && (
        <PushModal policy={pushing} institutions={institutions} onClose={() => setPushing(null)}
          onPushed={async (ro) => { setPushing(null); await load(); onChange(); toast(ro.status === 'scheduled' ? `${ro.policy} v${ro.version} scheduled for 22:00 on ${fmt(ro.total)} devices` : `Pushing ${ro.policy} v${ro.version} to ${fmt(ro.total)} devices`); goTo('rollouts') }} />
      )}
    </div>
  )
}

function Section({ icon, title, desc, children, right }) {
  return (
    <div className="rounded-2xl mb-4" style={{ border: `1px solid ${C.border}` }}>
      <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, borderRadius: '16px 16px 0 0' }}>
        <div className="flex items-center gap-2.5">
          <i className={`ti ${icon} text-[16px]`} style={{ color: C.textPrimary }} aria-hidden="true"></i>
          <div>
            <div className="text-[13px] font-bold" style={{ color: C.textPrimary }}>{title}</div>
            {desc && <div className="text-[11px]" style={{ color: C.textMuted }}>{desc}</div>}
          </div>
        </div>
        {right}
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  )
}
const Divider = () => <div style={{ borderTop: `1px solid ${C.border}` }} />

function PolicyEditor({ policy, onClose, onSaved }) {
  const isNew = !policy.id
  const [name, setName] = useState(policy.name || '')
  const [desc, setDesc] = useState(policy.desc || '')
  const [platform, setPlatform] = useState(policy.platform || 'android')
  const [s, setS] = useState(() => JSON.parse(JSON.stringify(policy.settings || DEFAULT_SETTINGS())))
  const [ssid, setSsid] = useState('')
  const [saving, setSaving] = useState(null)

  const upd = (group, key, val) => setS(prev => ({ ...prev, [group]: { ...prev[group], [key]: val } }))
  const addSsid = () => { const v = ssid.trim(); if (v && !s.network.ssids.includes(v)) upd('network', 'ssids', [...s.network.ssids, v]); setSsid('') }

  const save = async (thenPush) => {
    if (!name.trim()) return
    setSaving(thenPush ? 'push' : 'save')
    const saved = await savePolicy({ id: policy.id, name: name.trim(), desc: desc.trim(), platform, settings: s })
    onSaved(saved, thenPush)
  }

  return (
    <Modal title={isNew ? 'New policy' : `Edit policy — v${policy.version}`} onClose={onClose} width={760}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2"><Field label="Policy name"><Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Classroom Tablet — Standard" /></Field></div>
        <Field label="Platform">
          <Select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full">
            <option value="android">Android</option>
            <option value="windows">Windows</option>
          </Select>
        </Field>
      </div>
      <Field label="Description"><Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Where and why this policy is used" /></Field>

      <Section icon="ti-lock-cog" title="Hardware & feature restrictions" desc="Switched off = disabled on the device">
        {RESTRICTIONS.map(([k, l, ic], i) => (
          <div key={k}>{i > 0 && <Divider />}<Toggle icon={ic} label={l} on={s.restrictions[k]} onChange={v => upd('restrictions', k, v)} /></div>
        ))}
      </Section>

      <Section icon="ti-password" title="Security">
        <Toggle icon="ti-lock" label="Require screen lock" on={s.security.screenLock} onChange={v => upd('security', 'screenLock', v)} />
        {s.security.screenLock && (
          <div className="grid grid-cols-3 gap-3 pb-3">
            <Field label="PIN length">
              <Select value={s.security.pinLength} onChange={e => upd('security', 'pinLength', +e.target.value)} className="w-full">
                {[4, 6, 8].map(n => <option key={n} value={n}>{n} digits</option>)}
              </Select>
            </Field>
            <Field label="Auto-lock after">
              <Select value={s.security.autoLockMins} onChange={e => upd('security', 'autoLockMins', +e.target.value)} className="w-full">
                {[1, 2, 5, 10, 15].map(n => <option key={n} value={n}>{n} min</option>)}
              </Select>
            </Field>
            <Field label="Wipe after failed tries">
              <Select value={s.security.maxFailedAttempts} onChange={e => upd('security', 'maxFailedAttempts', +e.target.value)} className="w-full">
                {[5, 10, 15].map(n => <option key={n} value={n}>{n} attempts</option>)}
              </Select>
            </Field>
          </div>
        )}
        <Divider />
        <Toggle icon="ti-file-lock" label="Encrypt external storage" desc="SD cards / USB drives are encrypted with a device key" on={s.security.encryptExternal} onChange={v => upd('security', 'encryptExternal', v)} />
      </Section>

      <Section icon="ti-wifi" title="Wi-Fi fencing" desc="Device must stay on the institute's own Wi-Fi"
        right={<Switch on={s.network.wifiFencing} onChange={v => upd('network', 'wifiFencing', v)} />}>
        {s.network.wifiFencing ? (
          <div className="py-3">
            <div className="flex gap-2 mb-2.5">
              <Input value={ssid} onChange={e => setSsid(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSsid())} placeholder="Add allowed SSID, e.g. iDream_5G" />
              <Btn icon="ti-plus" onClick={addSsid}>Add</Btn>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {s.network.ssids.length === 0 && <span className="text-[11.5px]" style={{ color: C.textMuted }}>No SSIDs added yet.</span>}
              {s.network.ssids.map(x => (
                <span key={x} className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg mono" style={{ background: C.surfaceAlt, color: C.textPrimary, border: `1px solid ${C.border}` }}>
                  <i className="ti ti-wifi text-[12px]" aria-hidden="true"></i>{x}
                  <i className="ti ti-x text-[11px] cursor-pointer" style={{ color: C.textMuted }} onClick={() => upd('network', 'ssids', s.network.ssids.filter(y => y !== x))} aria-hidden="true"></i>
                </span>
              ))}
            </div>
            <Divider />
            <Toggle label="Alert when device joins another network" on={s.network.alertOnMismatch} onChange={v => upd('network', 'alertOnMismatch', v)} />
          </div>
        ) : <div className="py-3 text-[11.5px]" style={{ color: C.textMuted }}>Off — device can join any network.</div>}
      </Section>

      <Section icon="ti-clock-hour-8" title="Time fencing (working hours)" desc="Usage outside these hours is flagged or blocked"
        right={<Switch on={s.timeFencing.enabled} onChange={v => upd('timeFencing', 'enabled', v)} />}>
        {s.timeFencing.enabled ? (
          <div className="py-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Start"><Input type="time" value={s.timeFencing.start} onChange={e => upd('timeFencing', 'start', e.target.value)} /></Field>
              <Field label="End"><Input type="time" value={s.timeFencing.end} onChange={e => upd('timeFencing', 'end', e.target.value)} /></Field>
              <Field label="After hours">
                <Select value={s.timeFencing.afterHours} onChange={e => upd('timeFencing', 'afterHours', e.target.value)} className="w-full">
                  <option value="alert">Allow + raise alert</option>
                  <option value="lock">Lock device</option>
                </Select>
              </Field>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map(d => {
                const on = s.timeFencing.days.includes(d)
                return (
                  <button key={d} type="button" onClick={() => upd('timeFencing', 'days', on ? s.timeFencing.days.filter(x => x !== d) : [...s.timeFencing.days, d])}
                    className="text-[12px] font-semibold w-12 py-1.5 rounded-lg cursor-pointer"
                    style={on ? { background: C.textPrimary, color: '#fff', border: `1px solid ${C.textPrimary}` } : { background: C.surface, color: C.textSecondary, border: `1px solid ${C.border}` }}>{d}</button>
                )
              })}
            </div>
          </div>
        ) : <div className="py-3 text-[11.5px]" style={{ color: C.textMuted }}>Off — no working-hour tracking.</div>}
      </Section>

      <Section icon="ti-map-pin" title="Geofencing" desc="Centre = institute address coordinates"
        right={<Switch on={s.geofence.enabled} onChange={v => upd('geofence', 'enabled', v)} />}>
        {s.geofence.enabled ? (
          <div className="grid grid-cols-2 gap-3 pt-3">
            <Field label="Fence radius">
              <Select value={s.geofence.radiusM} onChange={e => upd('geofence', 'radiusM', +e.target.value)} className="w-full">
                {[50, 100, 200, 500, 1000].map(n => <option key={n} value={n}>{n} m</option>)}
              </Select>
            </Field>
            <Field label="Location report interval">
              <Select value={s.geofence.intervalMins} onChange={e => upd('geofence', 'intervalMins', +e.target.value)} className="w-full">
                {[5, 15, 30, 60].map(n => <option key={n} value={n}>Every {n} min</option>)}
              </Select>
            </Field>
          </div>
        ) : <div className="py-3 text-[11.5px]" style={{ color: C.textMuted }}>Off — no location alerts.</div>}
      </Section>

      <Section icon="ti-refresh" title="Updates">
        <div className="grid grid-cols-2 gap-3 pt-3">
          <Field label="OS update window">
            <Select value={s.updates.osWindow} onChange={e => upd('updates', 'osWindow', e.target.value)} className="w-full">
              {['22:00–05:00', '18:00–22:00', 'Sunday only', 'Manual'].map(w => <option key={w}>{w}</option>)}
            </Select>
          </Field>
          <div className="pt-6"><Toggle label="Auto-update managed apps" on={s.updates.autoUpdateApps} onChange={v => upd('updates', 'autoUpdateApps', v)} /></div>
        </div>
      </Section>

      <div className="flex justify-end gap-2 pt-1 sticky bottom-0" style={{ background: C.surface }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" icon="ti-device-floppy" loading={saving === 'save'} disabled={!name.trim()} onClick={() => save(false)}>{isNew ? 'Save as draft' : 'Save'}</Btn>
        <Btn variant="accent" icon="ti-send" loading={saving === 'push'} disabled={!name.trim()} onClick={() => save(true)}>Save & push</Btn>
      </div>
    </Modal>
  )
}

function PushModal({ policy, institutions, onClose, onPushed }) {
  const [step, setStep] = useState(1)
  const [targets, setTargets] = useState([])
  const [mode, setMode] = useState('now')
  const [submitting, setSubmitting] = useState(false)
  const allSelected = targets.length === institutions.length
  const count = targets.reduce((s, id) => s + deviceCountFor(institutions.find(i => i.id === id) || {}), 0)

  const submit = async () => {
    setSubmitting(true)
    const names = institutions.filter(i => targets.includes(i.id)).map(i => i.name)
    const ro = await pushPolicy(policy.id, { targetLabel: allSelected ? 'All institutions' : names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0], deviceCount: count, schedule: mode })
    onPushed(ro)
  }

  return (
    <Modal title={`Push "${policy.name}"`} onClose={onClose} width={580}>
      <Stepper steps={['Target institutions', 'Confirm']} step={step} />
      {step === 1 ? (
        <>
          <TargetPicker institutions={institutions} value={targets} onChange={setTargets} countFor={deviceCountFor} />
          <div className="flex justify-end gap-2 pt-5">
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" icon="ti-arrow-right" disabled={!targets.length} onClick={() => setStep(2)}>Continue</Btn>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl p-4 mb-4 text-[12.5px]" style={{ background: C.surfaceAlt }}>
            <div className="grid grid-cols-2 gap-y-2">
              <span style={{ color: C.textMuted }}>Policy</span><b style={{ color: C.textPrimary }}>{policy.name} · v{policy.version}</b>
              <span style={{ color: C.textMuted }}>Devices</span><b style={{ color: C.textPrimary }}>{fmt(count)}</b>
              <span style={{ color: C.textMuted }}>Institutions</span><b style={{ color: C.textPrimary }}>{targets.length}</b>
            </div>
          </div>
          <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.textPrimary }}>When to apply</div>
          <div className="flex flex-col gap-2 mb-4">
            {[['now', 'Apply immediately', 'Online devices update within a minute'], ['night', 'Apply tonight (22:00)', 'Avoids disturbing classes']].map(([k, l, d]) => (
              <button key={k} type="button" onClick={() => setMode(k)} className="text-left px-4 py-3 rounded-xl cursor-pointer"
                style={{ border: `1px solid ${mode === k ? ACCENT : C.border}`, background: mode === k ? THEME.accentBg : C.surface }}>
                <div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{l}</div>
                <div className="text-[11px]" style={{ color: C.textMuted }}>{d}</div>
              </button>
            ))}
          </div>
          <div className="rounded-xl px-4 py-3 text-[12px] flex items-start gap-2.5" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}`, color: C.textPrimary }}>
            <i className="ti ti-info-circle text-[15px] mt-0.5" style={{ color: THEME.accentDeep }} aria-hidden="true"></i>
            Offline devices receive this policy automatically when they reconnect.
          </div>
          <div className="flex justify-between gap-2 pt-5">
            <Btn icon="ti-arrow-left" onClick={() => setStep(1)}>Back</Btn>
            <Btn variant="accent" icon="ti-send" loading={submitting} onClick={submit}>Push to {fmt(count)} devices</Btn>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ───────── Compliance ───────── */

function ComplianceTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [sev, setSev] = useState('all')
  const [busy, setBusy] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { getViolations().then(setList) }, [])
  const counts = useMemo(() => {
    const c = { all: list?.length || 0, high: 0, medium: 0, low: 0 }
    list?.forEach(v => { c[v.severity]++ })
    return c
  }, [list])

  const act = async (v, action) => {
    setBusy(v.id + action)
    await remediate(v.id, action)
    setList(l => l.filter(x => x.id !== v.id))
    onChange()
    setBusy(null)
    toast(action === 'lock' ? `${v.device} locked remotely` : `Policy re-applied on ${v.device}`)
  }
  const doExport = async () => { setExporting(true); downloadBlob(await exportCompliance(), `policy-compliance-${new Date().toISOString().slice(0, 10)}.csv`); setExporting(false); toast('Report downloaded') }

  const shown = (list || []).filter(v => sev === 'all' || v.severity === sev)

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <Chips options={[['all', 'All'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]} value={sev} onChange={setSev} counts={counts} />
        <Btn variant="primary" icon="ti-file-spreadsheet" loading={exporting} onClick={doExport}>Export to Excel</Btn>
      </div>
      {!list ? <Loader label="Checking device compliance…" /> : shown.length === 0 ? <Empty icon="ti-circle-check">All devices are compliant.</Empty> : shown.map(v => (
        <div key={v.id} className="mk-row px-5 py-3.5 flex items-center gap-4 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="min-w-0 flex-1" style={{ minWidth: 260 }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold mono" style={{ color: C.textPrimary }}>{v.device}</span>
              <Pill small meta={SEVERITY[v.severity]}>{v.severity[0].toUpperCase() + v.severity.slice(1)}</Pill>
            </div>
            <div className="text-[12.5px] mt-1" style={{ color: C.textPrimary }}>{v.reason}</div>
            <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{v.school} · {v.policy} · {timeAgo(v.at)}</div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Btn icon="ti-refresh" loading={busy === v.id + 'reapply'} onClick={() => act(v, 'reapply')}>Re-apply policy</Btn>
            <Btn variant="danger" icon="ti-lock" loading={busy === v.id + 'lock'} onClick={() => act(v, 'lock')}>Lock device</Btn>
          </div>
        </div>
      ))}
    </Card>
  )
}

/* ───────── Rollouts ───────── */

function RolloutsTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [busy, setBusy] = useState(null)
  const prevRef = useRef(null)
  const load = useCallback(async () => {
    const next = await getRollouts()
    next.forEach(n => {
      const p = prevRef.current?.find(x => x.id === n.id)
      if (p && p.status === 'running' && n.status === 'completed') { toast(`${n.policy} v${n.version} applied on ${fmt(n.done)}/${fmt(n.total)} devices`); onChange() }
    })
    prevRef.current = next
    setList(next)
  }, [toast, onChange])
  useEffect(() => { load() }, [load])
  usePoll(load, list?.some(r => r.status === 'running'))

  return (
    <Card>
      <CardHeader title="Policy rollouts" sub="Status reported back by device agents" />
      {!list ? <Loader /> : list.length === 0 ? <Empty>No rollouts yet.</Empty> : list.map(r => (
        <div key={r.id} className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div>
              <div className="text-[13.5px] font-semibold flex items-center gap-2 flex-wrap" style={{ color: C.textPrimary }}>
                {r.policy} <span className="mono text-[11.5px] font-normal" style={{ color: C.textMuted }}>v{r.version}</span> <RolloutStatus r={r} />
              </div>
              <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{r.target} · by {r.by}, {timeAgo(r.startedAt)}</div>
            </div>
            {r.status !== 'running' && r.failed > 0 && (
              <Btn icon="ti-reload" loading={busy === r.id} onClick={async () => { setBusy(r.id); await retryRollout(r.id); await load(); setBusy(null); toast(`Retrying ${r.failed} device${r.failed > 1 ? 's' : ''}`, 'info') }}>Retry {r.failed} failed</Btn>
            )}
          </div>
          <RolloutBar r={r} doneLabel="applied" />
        </div>
      ))}
    </Card>
  )
}

/* ───────── Audit ───────── */

function AuditTab() {
  const [list, setList] = useState(null)
  useEffect(() => { getAuditLog().then(setList) }, [])
  return (
    <Card>
      <CardHeader title="Audit log" sub="Every policy change, who made it and when" />
      {!list ? <Loader /> : list.map(a => (
        <div key={a.id} className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: C.surfaceAlt, color: C.textPrimary }}>{a.by[0]}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px]" style={{ color: C.textPrimary }}><b>{a.by}</b> · {a.action}</div>
            <div className="text-[11.5px]" style={{ color: C.textMuted }}>{a.target}</div>
          </div>
          <span className="text-[11px] shrink-0" style={{ color: C.textMuted }}>{new Date(a.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
      ))}
    </Card>
  )
}
