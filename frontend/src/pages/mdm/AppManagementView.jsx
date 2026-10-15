import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'
import {
  getInstitutions, getAppSummary, getAppInventory, syncInventory, setAppStatus,
  getAppRules, setEnforcementMode, createAppRule, deleteAppRule, getViolations,
  getDeployments, uploadPackage, createDeployment, retryDeployment,
  getAppUsage, exportUsageReport,
} from '../../api/appManagement'

/* Same tokens as Login.jsx / MdmHub.jsx / GroupsRoles.jsx — kept identical so every page matches. */
const INK = '#1A1A18'
const SUB = '#5C5C57'
const MUTED = '#8A8A85'
const ACCENT = '#F79420'
const ACCENT_DEEP = '#C96F0A'

const C = {
  bgApp: '#E8E8E3',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F2EE',
  border: INK + '1F',
  borderStrong: INK + '3D',
  textPrimary: INK,
  textSecondary: SUB,
  textMuted: MUTED,
  brandFrom: INK,
  brandTo: '#3A3A36',
  systemBg: '#F2F2EE',
  systemBorder: INK + '3D',
  success: '#17B26A',
  successBg: '#ECFDF5',
  successBorder: '#A7E9C8',
  warning: '#8A6816',
  warningBg: '#FBF3E0',
  warningBorder: '#E7D39C',
  danger: '#8A2A2A',
  dangerBg: '#FBEAE9',
  dangerBorder: '#EFC4C1',
  accent: ACCENT,
  accentBg: '#FEF4E6',
  accentBorder: '#F9D3A3',
}

const STATUS_META = {
  allowed: { label: 'Allowed', color: C.success, bg: C.successBg, border: C.successBorder, icon: 'ti-circle-check' },
  blocked: { label: 'Blacklisted', color: C.danger, bg: C.dangerBg, border: C.dangerBorder, icon: 'ti-ban' },
  review: { label: 'Needs review', color: C.warning, bg: C.warningBg, border: C.warningBorder, icon: 'ti-alert-triangle' },
}

const PLATFORM_META = {
  android: { label: 'Android', icon: 'ti-brand-android', color: '#3DDC84' },
  windows: { label: 'Windows', icon: 'ti-brand-windows', color: '#0078D4' },
}

const ACTION_LABEL = {
  block_and_uninstall: 'Block + silent uninstall',
  block_launch: 'Block launch only',
  always_allow: 'Always allow',
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { key: 'inventory', label: 'App Inventory', icon: 'ti-apps' },
  { key: 'rules', label: 'Blacklist / Whitelist', icon: 'ti-list-check' },
  { key: 'deploy', label: 'Push Apps', icon: 'ti-cloud-upload' },
  { key: 'usage', label: 'Usage Reports', icon: 'ti-chart-bar' },
]

const timeAgo = (iso) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  return `${Math.floor(h / 24)} d ago`
}
const fmt = (n) => Number(n).toLocaleString('en-IN')

/* ───────────────────────── small shared pieces ───────────────────────── */

function Pill({ meta, children, small }) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full whitespace-nowrap ${small ? 'text-[10.5px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'}`}
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
      {meta.icon && <i className={`ti ${meta.icon} text-[11px]`} aria-hidden="true"></i>}
      {children ?? meta.label}
    </span>
  )
}

function Card({ children, className = '', style = {} }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{ background: C.surface, border: `1px solid ${C.border}`, ...style }}>
      {children}
    </div>
  )
}

function CardHeader({ title, right, sub }) {
  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>{title}</div>
        {sub && <div className="text-[11.5px] mt-0.5" style={{ color: C.textSecondary }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

function Btn({ children, onClick, variant = 'ghost', disabled, icon, loading, className = '', type = 'button' }) {
  const styles = {
    primary: { background: C.textPrimary, color: '#fff', border: `1px solid ${C.textPrimary}` },
    accent: { background: ACCENT, color: '#fff', border: `1px solid ${ACCENT}` },
    ghost: { background: C.surface, color: C.textPrimary, border: `1px solid ${C.border}` },
    danger: { background: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}` },
    success: { background: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`am-btn inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-xl transition-all ${className}`}
      style={{ ...styles[variant], opacity: disabled ? 0.5 : 1, cursor: disabled || loading ? 'not-allowed' : 'pointer' }}>
      {loading ? <i className="ti ti-loader-2 animate-spin text-[13px]" aria-hidden="true"></i>
        : icon && <i className={`ti ${icon} text-[13px]`} aria-hidden="true"></i>}
      {children}
    </button>
  )
}

function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-[13px]" style={{ color: C.textSecondary }}>
      <i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> {label}
    </div>
  )
}

function Modal({ title, onClose, children, width = 520 }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(26,26,24,0.45)', backdropFilter: 'blur(3px)' }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="am-pop w-full rounded-2xl overflow-hidden" style={{ maxWidth: width, background: C.surface, boxShadow: '0 30px 60px -20px rgba(26,26,24,0.45)' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="text-[15px] font-bold" style={{ color: C.textPrimary }}>{title}</div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ background: C.surfaceAlt, color: C.textSecondary, border: 'none' }}>
            <i className="ti ti-x text-[14px]" aria-hidden="true"></i>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <label className="block mb-4">
      <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.textPrimary }}>{label}</div>
      {children}
      {hint && <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>{hint}</div>}
    </label>
  )
}

const inputStyle = { border: `1px solid ${C.systemBorder}`, background: C.surface, color: C.textPrimary }

function Toggle({ on, onChange, label, desc }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="w-full flex items-center justify-between gap-3 text-left py-2.5 cursor-pointer" style={{ background: 'transparent', border: 'none' }}>
      <div>
        <div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{label}</div>
        {desc && <div className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>{desc}</div>}
      </div>
      <span className="relative shrink-0 w-9 h-5 rounded-full transition-colors" style={{ background: on ? ACCENT : INK + '26' }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: on ? 18 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
      </span>
    </button>
  )
}

/* ───────────────────────── page ───────────────────────── */

export default function AppManagementView() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const [toasts, setToasts] = useState([])
  const [live, setLive] = useState(true)

  const toast = useCallback((msg, kind = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, msg, kind }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800)
  }, [])

  const refreshSummary = useCallback(() => getAppSummary().then(setSummary).catch(() => {}), [])

  useEffect(() => {
    refreshSummary()
    getInstitutions().then(setInstitutions)
  }, [refreshSummary])

  // Heartbeat — keeps the "agents online" indicator and KPIs fresh.
  useEffect(() => {
    if (!live) return
    const t = setInterval(refreshSummary, 15000)
    return () => clearInterval(t)
  }, [live, refreshSummary])

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <style>{`
        .am-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(0.97); }
        .am-row { transition: background 120ms ease; }
        .am-row:hover { background: ${C.surfaceAlt}; }
        .am-input:focus { outline: none; box-shadow: 0 0 0 3px ${ACCENT}26; border-color: ${ACCENT} !important; }
        .am-fade { animation: amFade 260ms ease both; }
        @keyframes amFade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        .am-pop { animation: amPop 200ms cubic-bezier(.2,.9,.3,1.2) both; }
        @keyframes amPop { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: none } }
        .am-live { animation: amLive 1.8s ease-in-out infinite; }
        @keyframes amLive { 0%,100% { box-shadow: 0 0 0 0 ${C.success}66 } 50% { box-shadow: 0 0 0 5px ${C.success}00 } }
        .am-stripe { background-image: linear-gradient(45deg, rgba(255,255,255,.28) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.28) 50%, rgba(255,255,255,.28) 75%, transparent 75%); background-size: 14px 14px; animation: amStripe 0.8s linear infinite; }
        @keyframes amStripe { to { background-position: 14px 0 } }
        .am-toast { animation: amToast 260ms ease both; }
        @keyframes amToast { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: none } }
      `}</style>

      <Topbar C={C} />

      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 min-w-0 px-7 py-7">
          {/* Breadcrumb */}
          <button onClick={() => navigate('/mdm')} className="flex items-center gap-1 text-[12px] font-medium mb-3 cursor-pointer" style={{ color: C.textMuted, background: 'transparent', border: 'none' }}>
            <i className="ti ti-arrow-left text-[12px]" aria-hidden="true"></i> MDM software
          </button>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #F7B733)`, boxShadow: `0 10px 22px -10px ${ACCENT}` }}>
                <i className="ti ti-apps text-[22px] text-white" aria-hidden="true"></i>
              </div>
              <div>
                <h1 className="text-[20px] font-extrabold uppercase tracking-tight" style={{ color: C.textPrimary }}>App Management</h1>
                <p className="text-[13px] mt-0.5" style={{ color: C.textSecondary }}>Control which applications run on every enrolled Windows & Android device</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setLive(l => !l)}
                className="flex items-center gap-2 text-[11.5px] font-semibold px-3 py-1.5 rounded-full cursor-pointer"
                style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textSecondary }}>
                <span className={`w-2 h-2 rounded-full ${live ? 'am-live' : ''}`} style={{ background: live ? C.success : C.textMuted }} />
                {live ? 'Live' : 'Paused'} · {summary ? `synced ${timeAgo(summary.lastSync)}` : 'connecting…'}
              </button>
              {summary && (
                <span className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full"
                  style={{ color: summary.mode === 'whitelist' ? C.success : C.danger, background: summary.mode === 'whitelist' ? C.successBg : C.dangerBg, border: `1px solid ${summary.mode === 'whitelist' ? C.successBorder : C.dangerBorder}` }}>
                  <i className={`ti ${summary.mode === 'whitelist' ? 'ti-shield-check' : 'ti-shield-x'} text-[12px] mr-1`} aria-hidden="true"></i>
                  {summary.mode === 'whitelist' ? 'Whitelist mode' : 'Blacklist mode'}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-6 p-1 rounded-2xl w-fit max-w-full overflow-x-auto" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors"
                style={tab === t.key ? { background: C.textPrimary, color: '#fff', border: 'none' } : { background: 'transparent', color: C.textSecondary, border: 'none' }}>
                <i className={`ti ${t.icon} text-[14px]`} aria-hidden="true"></i> {t.label}
                {t.key === 'inventory' && summary?.pendingReview > 0 && (
                  <span className="ml-0.5 text-[10px] font-bold px-1.5 rounded-full" style={{ background: tab === t.key ? '#fff3' : C.warningBg, color: tab === t.key ? '#fff' : C.warning }}>{summary.pendingReview}</span>
                )}
                {t.key === 'deploy' && summary?.activeDeployments > 0 && (
                  <span className="ml-0.5 w-1.5 h-1.5 rounded-full am-live" style={{ background: ACCENT }} />
                )}
              </button>
            ))}
          </div>

          <div key={tab} className="am-fade">
            {tab === 'overview' && <OverviewTab summary={summary} goTo={setTab} />}
            {tab === 'inventory' && <InventoryTab toast={toast} onChange={refreshSummary} />}
            {tab === 'rules' && <RulesTab toast={toast} institutions={institutions} onChange={refreshSummary} />}
            {tab === 'deploy' && <DeployTab toast={toast} institutions={institutions} onChange={refreshSummary} />}
            {tab === 'usage' && <UsageTab toast={toast} institutions={institutions} />}
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 items-end">
        {toasts.map(t => (
          <div key={t.id} className="am-toast flex items-center gap-2.5 text-[12.5px] font-medium px-4 py-3 rounded-xl max-w-sm"
            style={{ background: C.textPrimary, color: '#fff', boxShadow: '0 14px 30px -12px rgba(0,0,0,0.45)' }}>
            <i className={`ti ${t.kind === 'error' ? 'ti-alert-circle' : t.kind === 'info' ? 'ti-info-circle' : 'ti-circle-check'} text-[15px]`}
              style={{ color: t.kind === 'error' ? '#F5766D' : t.kind === 'info' ? '#F7B733' : '#6EE7B7' }} aria-hidden="true"></i>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───────────────────────── Overview ───────────────────────── */

function OverviewTab({ summary, goTo }) {
  const [violations, setViolations] = useState(null)
  const [usage, setUsage] = useState(null)

  useEffect(() => {
    getViolations().then(setViolations)
    getAppUsage('daily').then(setUsage)
  }, [])

  if (!summary) return <Loader label="Fetching app inventory from agents…" />

  const kpis = [
    { label: 'Apps detected', value: summary.totalApps, sub: `${fmt(summary.totalInstalls)} installs across fleet`, icon: 'ti-apps', color: ACCENT },
    { label: 'Managed apps', value: summary.managedApps, sub: 'Pushed & controlled by MDM', icon: 'ti-package', color: '#3B6FE0' },
    { label: 'Blacklisted', value: summary.blocked, sub: 'Blocked on all devices', icon: 'ti-ban', color: C.danger },
    { label: 'Violations (24h)', value: summary.violations24h, sub: 'Blacklisted app attempts', icon: 'ti-alert-octagon', color: '#E4483C' },
  ]
  const maxUse = usage ? Math.max(...usage.slice(0, 6).map(u => u.workingHrs + u.offHrs)) : 1

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>{k.label}</span>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: k.color + '14' }}>
                <i className={`ti ${k.icon} text-[16px]`} style={{ color: k.color }} aria-hidden="true"></i>
              </span>
            </div>
            <div className="text-[28px] font-extrabold leading-none tracking-tight" style={{ color: C.textPrimary }}>{fmt(k.value)}</div>
            <div className="text-[11.5px] mt-2" style={{ color: C.textSecondary }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {summary.pendingReview > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap rounded-2xl px-5 py-3.5" style={{ background: C.warningBg, border: `1px solid ${C.warningBorder}` }}>
          <div className="flex items-center gap-2.5 text-[12.5px] font-medium" style={{ color: C.warning }}>
            <i className="ti ti-alert-triangle text-[16px]" aria-hidden="true"></i>
            {summary.pendingReview} newly detected apps are waiting for review — allow or blacklist them.
          </div>
          <Btn variant="ghost" icon="ti-arrow-right" onClick={() => goTo('inventory')}>Review now</Btn>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Most used apps — today" sub="Working vs non-working hours, all institutions"
            right={<Btn variant="ghost" icon="ti-chart-bar" onClick={() => goTo('usage')}>Full report</Btn>} />
          <div className="p-5 flex flex-col gap-3.5">
            {!usage ? <Loader /> : usage.slice(0, 6).map(u => {
              const total = u.workingHrs + u.offHrs
              return (
                <div key={u.name}>
                  <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                    <span className="font-semibold flex items-center gap-1.5" style={{ color: C.textPrimary }}>
                      <i className={`ti ${PLATFORM_META[u.platform].icon} text-[13px]`} style={{ color: PLATFORM_META[u.platform].color }} aria-hidden="true"></i>
                      {u.name}
                    </span>
                    <span style={{ color: C.textSecondary }}>{fmt(total)} hrs</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden flex" style={{ background: C.surfaceAlt, width: `${(total / maxUse) * 100}%`, minWidth: 24 }}>
                    <div style={{ width: `${(u.workingHrs / total) * 100}%`, background: ACCENT }} />
                    <div style={{ width: `${(u.offHrs / total) * 100}%`, background: INK + '55' }} />
                  </div>
                </div>
              )
            })}
            {usage && (
              <div className="flex items-center gap-4 pt-2 text-[11px]" style={{ color: C.textMuted }}>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: ACCENT }} /> Working hours</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: INK + '55' }} /> Non-working hours</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Live violation alerts" sub="Blacklisted app activity reported by agents"
            right={<span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: C.success }}><span className="w-1.5 h-1.5 rounded-full am-live" style={{ background: C.success }} />Live</span>} />
          {!violations ? <Loader /> : (
            <div>
              {violations.map(v => (
                <div key={v.id} className="am-row px-5 py-3 flex items-start gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: C.dangerBg }}>
                    <i className="ti ti-ban text-[14px]" style={{ color: C.danger }} aria-hidden="true"></i>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold flex items-center gap-1.5 flex-wrap" style={{ color: C.textPrimary }}>
                      {v.app}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: C.surfaceAlt, color: C.textSecondary }}>{v.action}</span>
                      {v.offHours && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: C.warningBg, color: C.warning }}>Off-hours</span>}
                    </div>
                    <div className="text-[11.5px] mt-0.5 truncate" style={{ color: C.textMuted }}>
                      <span className="mono">{v.device}</span> · {v.school}
                    </div>
                  </div>
                  <span className="text-[11px] shrink-0" style={{ color: C.textMuted }}>{timeAgo(v.at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ───────────────────────── Inventory ───────────────────────── */

function InventoryTab({ toast, onChange }) {
  const [apps, setApps] = useState(null)
  const [q, setQ] = useState('')
  const [platform, setPlatform] = useState('all')
  const [status, setStatus] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [detail, setDetail] = useState(null)

  const load = useCallback(() => getAppInventory().then(setApps), [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (!apps) return []
    const s = q.trim().toLowerCase()
    return apps.filter(a =>
      (platform === 'all' || a.platform === platform) &&
      (status === 'all' || a.status === status) &&
      (!s || a.name.toLowerCase().includes(s) || a.pkg.toLowerCase().includes(s) || a.publisher.toLowerCase().includes(s)))
  }, [apps, q, platform, status])

  const doSync = async () => {
    setSyncing(true)
    try {
      const r = await syncInventory()
      await load()
      onChange()
      toast(`Inventory refreshed — ${r.devicesReported} devices reported`)
    } catch { toast('Sync failed. Try again.', 'error') }
    setSyncing(false)
  }

  const changeStatus = async (app, next) => {
    setBusyId(app.id)
    try {
      const r = await setAppStatus(app.id, next)
      setApps(prev => prev.map(a => a.id === app.id ? r.app : a))
      onChange()
      if (next === 'blocked') toast(`${app.name} blacklisted — uninstall command queued for ${r.commandQueuedFor} devices`)
      else toast(`${app.name} marked as allowed`)
      if (detail?.id === app.id) setDetail(r.app)
    } catch { toast('Could not update app status', 'error') }
    setBusyId(null)
  }

  const counts = useMemo(() => {
    const c = { all: apps?.length || 0, allowed: 0, blocked: 0, review: 0 }
    apps?.forEach(a => { c[a.status]++ })
    return c
  }, [apps])

  return (
    <Card>
      <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search app, package or publisher"
              className="am-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-64" style={inputStyle} />
          </div>
          <select value={platform} onChange={e => setPlatform(e.target.value)} className="am-input text-[12.5px] px-3 py-2 rounded-xl cursor-pointer" style={inputStyle}>
            <option value="all">All platforms</option>
            <option value="android">Android</option>
            <option value="windows">Windows</option>
          </select>
          <div className="flex gap-1">
            {[['all', 'All'], ['review', 'Needs review'], ['allowed', 'Allowed'], ['blocked', 'Blacklisted']].map(([k, l]) => (
              <button key={k} onClick={() => setStatus(k)}
                className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer"
                style={status === k ? { background: C.textPrimary, color: '#fff', border: `1px solid ${C.textPrimary}` } : { background: C.surface, color: C.textSecondary, border: `1px solid ${C.border}` }}>
                {l} <span style={{ opacity: 0.6 }}>{counts[k]}</span>
              </button>
            ))}
          </div>
        </div>
        <Btn variant="primary" icon="ti-refresh" loading={syncing} onClick={doSync}>{syncing ? 'Collecting from agents…' : 'Sync inventory'}</Btn>
      </div>

      {!apps ? <Loader label="Fetching installed apps from enrolled devices…" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 860 }}>
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                <th className="px-5 py-2.5">Application</th>
                <th className="px-3 py-2.5">Platform</th>
                <th className="px-3 py-2.5">Version</th>
                <th className="px-3 py-2.5">Installed on</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const p = PLATFORM_META[a.platform]
                return (
                  <tr key={a.id} className="am-row cursor-pointer" style={{ borderTop: `1px solid ${C.border}` }} onClick={() => setDetail(a)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold"
                          style={{ background: a.managed ? C.accentBg : C.surfaceAlt, color: a.managed ? ACCENT_DEEP : C.textSecondary, border: `1px solid ${a.managed ? C.accentBorder : C.border}` }}>
                          {a.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: C.textPrimary }}>
                            {a.name}
                            {a.managed && <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: C.accentBg, color: ACCENT_DEEP }}>Managed</span>}
                          </div>
                          <div className="text-[11px] mono truncate max-w-[260px]" style={{ color: C.textMuted }}>{a.pkg}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5 text-[12px]" style={{ color: C.textSecondary }}>
                        <i className={`ti ${p.icon} text-[14px]`} style={{ color: p.color }} aria-hidden="true"></i>{p.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[12px] mono" style={{ color: C.textSecondary }}>{a.version}</td>
                    <td className="px-3 py-3 text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{fmt(a.installs)} <span className="font-normal text-[11px]" style={{ color: C.textMuted }}>devices</span></td>
                    <td className="px-3 py-3"><Pill meta={STATUS_META[a.status]} small /></td>
                    <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex gap-1.5">
                        {a.status !== 'allowed' && (
                          <Btn variant="success" icon="ti-check" loading={busyId === a.id} onClick={() => changeStatus(a, 'allowed')} className="!px-2.5 !py-1.5 !text-[11.5px]">Allow</Btn>
                        )}
                        {a.status !== 'blocked' && (
                          <Btn variant="danger" icon="ti-ban" loading={busyId === a.id} onClick={() => changeStatus(a, 'blocked')} className="!px-2.5 !py-1.5 !text-[11.5px]">Blacklist</Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-[13px]" style={{ color: C.textMuted }}>No apps match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Pill meta={STATUS_META[detail.status]} />
            <Pill meta={{ color: C.textSecondary, bg: C.surfaceAlt, border: C.border, icon: PLATFORM_META[detail.platform].icon }}>{PLATFORM_META[detail.platform].label}</Pill>
            {detail.managed && <Pill meta={{ color: ACCENT_DEEP, bg: C.accentBg, border: C.accentBorder, icon: 'ti-package' }}>MDM managed</Pill>}
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-[12.5px] mb-5">
            {[
              ['Package / binary', <span className="mono">{detail.pkg}</span>],
              ['Publisher', detail.publisher],
              ['Version', <span className="mono">{detail.version}</span>],
              ['Category', detail.category],
              ['Installed on', `${fmt(detail.installs)} devices`],
              ['Package size', `${detail.sizeMb} MB`],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: C.textMuted }}>{k}</div>
                <div className="break-all" style={{ color: C.textPrimary }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            {detail.status !== 'allowed' && <Btn variant="success" icon="ti-check" loading={busyId === detail.id} onClick={() => changeStatus(detail, 'allowed')}>Allow</Btn>}
            {detail.status !== 'blocked' && <Btn variant="danger" icon="ti-ban" loading={busyId === detail.id} onClick={() => changeStatus(detail, 'blocked')}>Blacklist & uninstall</Btn>}
          </div>
        </Modal>
      )}
    </Card>
  )
}

/* ───────────────────────── Rules ───────────────────────── */

function RulesTab({ toast, institutions, onChange }) {
  const [data, setData] = useState(null)
  const [switching, setSwitching] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => getAppRules().then(setData), [])
  useEffect(() => { load() }, [load])

  const switchMode = async (mode) => {
    if (mode === data.mode) return
    setSwitching(true)
    try {
      await setEnforcementMode(mode)
      setData(d => ({ ...d, mode }))
      onChange()
      toast(mode === 'whitelist' ? 'Whitelist mode active — only approved apps can run' : 'Blacklist mode active — everything except blocked apps can run')
    } catch { toast('Could not change mode', 'error') }
    setSwitching(false)
  }

  const remove = async (rule) => {
    setDeleting(rule.id)
    try {
      await deleteAppRule(rule.id)
      setData(d => ({ ...d, rules: d.rules.filter(r => r.id !== rule.id) }))
      onChange()
      toast(`Rule removed — ${rule.label}`)
    } catch { toast('Could not delete rule', 'error') }
    setDeleting(null)
  }

  if (!data) return <Loader label="Loading enforcement policy…" />

  const rules = data.rules.filter(r => filter === 'all' || r.type === filter)
  const modes = [
    { key: 'blacklist', title: 'Blacklist mode', desc: 'All apps allowed except the ones you block. Best for general classroom devices.', icon: 'ti-shield-x', color: C.danger, bg: C.dangerBg, border: C.dangerBorder },
    { key: 'whitelist', title: 'Whitelist mode (kiosk)', desc: 'Only approved apps can be opened. Best for exam labs & interactive panels.', icon: 'ti-shield-check', color: C.success, bg: C.successBg, border: C.successBorder },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map(m => {
          const active = data.mode === m.key
          return (
            <button key={m.key} onClick={() => switchMode(m.key)} disabled={switching}
              className="text-left rounded-2xl p-5 transition-all cursor-pointer relative"
              style={{ background: C.surface, border: `1.5px solid ${active ? m.color : C.border}`, boxShadow: active ? `0 14px 30px -18px ${m.color}` : 'none' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                    <i className={`ti ${m.icon} text-[18px]`} style={{ color: m.color }} aria-hidden="true"></i>
                  </span>
                  <div className="text-[14px] font-bold" style={{ color: C.textPrimary }}>{m.title}</div>
                </div>
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ border: `2px solid ${active ? m.color : C.borderStrong}` }}>
                  {active && (switching ? <i className="ti ti-loader-2 animate-spin text-[10px]" style={{ color: m.color }} aria-hidden="true"></i> : <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />)}
                </span>
              </div>
              <p className="text-[12px] mt-3" style={{ color: C.textSecondary }}>{m.desc}</p>
            </button>
          )
        })}
      </div>

      <Card>
        <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex gap-1">
            {[['all', 'All rules'], ['blacklist', 'Blacklist'], ['whitelist', 'Whitelist']].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer"
                style={filter === k ? { background: C.textPrimary, color: '#fff', border: `1px solid ${C.textPrimary}` } : { background: C.surface, color: C.textSecondary, border: `1px solid ${C.border}` }}>
                {l} <span style={{ opacity: 0.6 }}>{k === 'all' ? data.rules.length : data.rules.filter(r => r.type === k).length}</span>
              </button>
            ))}
          </div>
          <Btn variant="accent" icon="ti-plus" onClick={() => setShowAdd(true)}>Add rule</Btn>
        </div>

        {rules.map(r => (
          <div key={r.id} className="am-row px-5 py-3.5 flex items-center justify-between gap-4" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: r.type === 'blacklist' ? C.dangerBg : C.successBg, border: `1px solid ${r.type === 'blacklist' ? C.dangerBorder : C.successBorder}` }}>
                <i className={`ti ${r.type === 'blacklist' ? 'ti-ban' : 'ti-circle-check'} text-[15px]`} style={{ color: r.type === 'blacklist' ? C.danger : C.success }} aria-hidden="true"></i>
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>{r.label}</div>
                <div className="text-[11.5px] flex items-center gap-1.5 flex-wrap" style={{ color: C.textMuted }}>
                  <span className="mono">{r.match}</span> · {r.scope} · by {r.createdBy}, {timeAgo(r.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold px-2 py-1 rounded-lg hidden md:inline" style={{ background: C.surfaceAlt, color: C.textSecondary }}>{ACTION_LABEL[r.action]}</span>
              <button onClick={() => remove(r)} disabled={deleting === r.id} title="Remove rule"
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted }}>
                <i className={`ti ${deleting === r.id ? 'ti-loader-2 animate-spin' : 'ti-trash'} text-[14px]`} aria-hidden="true"></i>
              </button>
            </div>
          </div>
        ))}
        {rules.length === 0 && <div className="py-12 text-center text-[13px]" style={{ color: C.textMuted }}>No rules yet.</div>}
      </Card>

      {showAdd && (
        <AddRuleModal institutions={institutions} onClose={() => setShowAdd(false)}
          onCreated={(rule) => {
            setData(d => ({ ...d, rules: [rule, ...d.rules] }))
            setShowAdd(false)
            onChange()
            toast(`${rule.type === 'blacklist' ? 'Blacklist' : 'Whitelist'} rule pushed to ${rule.scope}`)
          }} />
      )}
    </div>
  )
}

function AddRuleModal({ institutions, onClose, onCreated }) {
  const [form, setForm] = useState({ type: 'blacklist', label: '', match: '', scope: 'All institutions', action: 'block_and_uninstall' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.label.trim() || !form.match.trim()) return
    setSaving(true)
    try {
      const rule = await createAppRule({ ...form, label: form.label.trim(), match: form.match.trim(), action: form.type === 'whitelist' ? 'always_allow' : form.action })
      onCreated(rule)
    } catch { setSaving(false) }
  }

  return (
    <Modal title="New app rule" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[['blacklist', 'Blacklist', 'ti-ban', C.danger, C.dangerBg], ['whitelist', 'Whitelist', 'ti-circle-check', C.success, C.successBg]].map(([k, l, ic, col, bg]) => (
            <button type="button" key={k} onClick={() => set('type', k)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-semibold cursor-pointer"
              style={form.type === k ? { background: bg, color: col, border: `1.5px solid ${col}` } : { background: C.surface, color: C.textSecondary, border: `1px solid ${C.border}` }}>
              <i className={`ti ${ic} text-[14px]`} aria-hidden="true"></i>{l}
            </button>
          ))}
        </div>
        <Field label="App name">
          <input autoFocus value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. Instagram" className="am-input w-full text-[13px] px-3 py-2 rounded-xl" style={inputStyle} />
        </Field>
        <Field label="Package name / executable" hint="Android package (com.example.app) or Windows .exe — wildcards like com.isfinformatica.* are supported">
          <input value={form.match} onChange={e => set('match', e.target.value)} placeholder="com.instagram.android" className="am-input mono w-full text-[12.5px] px-3 py-2 rounded-xl" style={inputStyle} />
        </Field>
        <Field label="Apply to">
          <select value={form.scope} onChange={e => set('scope', e.target.value)} className="am-input w-full text-[13px] px-3 py-2 rounded-xl cursor-pointer" style={inputStyle}>
            <option>All institutions</option>
            {institutions.map(i => <option key={i.id}>{i.name}</option>)}
          </select>
        </Field>
        {form.type === 'blacklist' && (
          <Field label="Enforcement action">
            <select value={form.action} onChange={e => set('action', e.target.value)} className="am-input w-full text-[13px] px-3 py-2 rounded-xl cursor-pointer" style={inputStyle}>
              <option value="block_and_uninstall">Block + silent uninstall</option>
              <option value="block_launch">Block launch only (keep installed)</option>
            </select>
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn type="submit" variant="primary" icon="ti-send" loading={saving} disabled={!form.label.trim() || !form.match.trim()}>Save & push to devices</Btn>
        </div>
      </form>
    </Modal>
  )
}

/* ───────────────────────── Deploy ───────────────────────── */

function DeployTab({ toast, institutions, onChange }) {
  const [deps, setDeps] = useState(null)
  const [wizard, setWizard] = useState(false)
  const [retrying, setRetrying] = useState(null)

  const load = useCallback(() => getDeployments().then(setDeps), [])
  useEffect(() => { load() }, [load])

  const anyRunning = deps?.some(d => d.status === 'running')
  useEffect(() => {
    if (!anyRunning) return
    const t = setInterval(async () => {
      const next = await getDeployments()
      setDeps(prev => {
        next.forEach(n => {
          const p = prev?.find(x => x.id === n.id)
          if (p && p.status === 'running' && n.status === 'completed') {
            toast(`${n.app} ${n.version} installed on ${n.installed}/${n.total} devices`)
            onChange()
          }
        })
        return next
      })
    }, 1600)
    return () => clearInterval(t)
  }, [anyRunning, toast, onChange])

  const retry = async (d) => {
    setRetrying(d.id)
    await retryDeployment(d.id)
    await load()
    setRetrying(null)
    toast(`Retrying ${d.failed} failed device${d.failed > 1 ? 's' : ''}`, 'info')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${ACCENT}, #F7B733)`, boxShadow: `0 18px 36px -22px ${ACCENT}` }}>
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#FFFFFF30 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative">
          <div className="text-[16px] font-extrabold text-white">Push a custom app</div>
          <div className="text-[12.5px] mt-1 text-white/90">Upload an APK / EXE / MSI, pre-configure it and silently install it on selected institutions.</div>
        </div>
        <button onClick={() => setWizard(true)} className="relative am-btn flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide px-4 py-2.5 rounded-xl cursor-pointer"
          style={{ background: '#fff', color: ACCENT_DEEP, border: 'none' }}>
          <i className="ti ti-cloud-upload text-[15px]" aria-hidden="true"></i> New deployment
        </button>
      </div>

      <Card>
        <CardHeader title="Deployments" sub="Install status as reported back by device agents"
          right={anyRunning && <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: ACCENT_DEEP }}><i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i>Receiving agent reports</span>} />
        {!deps ? <Loader /> : deps.map(d => {
          const done = d.installed + d.failed
          const pct = d.total ? Math.round((done / d.total) * 100) : 0
          const p = PLATFORM_META[d.platform]
          return (
            <div key={d.id} className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                    <i className={`ti ${p.icon} text-[18px]`} style={{ color: p.color }} aria-hidden="true"></i>
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold flex items-center gap-2 flex-wrap" style={{ color: C.textPrimary }}>
                      {d.app} <span className="mono text-[11.5px] font-normal" style={{ color: C.textMuted }}>v{d.version}</span>
                      {d.status === 'running'
                        ? <Pill small meta={{ color: ACCENT_DEEP, bg: C.accentBg, border: C.accentBorder, icon: 'ti-loader-2 animate-spin' }}>Installing</Pill>
                        : d.failed > 0
                          ? <Pill small meta={{ color: C.warning, bg: C.warningBg, border: C.warningBorder, icon: 'ti-alert-triangle' }}>Completed with errors</Pill>
                          : <Pill small meta={{ ...STATUS_META.allowed, icon: 'ti-circle-check' }}>Completed</Pill>}
                    </div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
                      <span className="mono">{d.file}</span> · {d.target} · {d.silent ? 'Silent install' : 'User prompt'} · by {d.createdBy}, {timeAgo(d.startedAt)}
                    </div>
                  </div>
                </div>
                {d.status !== 'running' && d.failed > 0 && (
                  <Btn icon="ti-reload" loading={retrying === d.id} onClick={() => retry(d)}>Retry {d.failed} failed</Btn>
                )}
              </div>
              <div className="mt-3.5">
                <div className="h-2 rounded-full overflow-hidden flex" style={{ background: C.surfaceAlt }}>
                  <div className={d.status === 'running' ? 'am-stripe' : ''} style={{ width: `${(d.installed / d.total) * 100}%`, background: C.success, transition: 'width 600ms ease' }} />
                  <div style={{ width: `${(d.failed / d.total) * 100}%`, background: '#E4483C', transition: 'width 600ms ease' }} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-[11.5px] flex-wrap" style={{ color: C.textSecondary }}>
                  <span><b style={{ color: C.success }}>{fmt(d.installed)}</b> installed</span>
                  <span><b style={{ color: '#E4483C' }}>{fmt(d.failed)}</b> failed</span>
                  <span><b style={{ color: C.textPrimary }}>{fmt(d.pending)}</b> pending</span>
                  <span className="ml-auto font-semibold" style={{ color: C.textPrimary }}>{pct}% · {fmt(d.total)} devices</span>
                </div>
              </div>
            </div>
          )
        })}
      </Card>

      {wizard && (
        <DeployWizard institutions={institutions} onClose={() => setWizard(false)}
          onCreated={(dep) => {
            setDeps(prev => [dep, ...(prev || [])])
            setWizard(false)
            onChange()
            toast(`Deployment started — ${dep.app} queued for ${dep.total} devices`)
          }} />
      )}
    </div>
  )
}

// Approximate enrolled-device counts per institution for target sizing.
const deviceCountFor = (inst) => 40 + ((String(inst.name).length * 37 + Number(inst.id || 1) * 13) % 160)

function DeployWizard({ institutions, onClose, onCreated }) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [pkg, setPkg] = useState(null)
  const [meta, setMeta] = useState({ name: '', version: '' })
  const [targets, setTargets] = useState([])
  const [opts, setOpts] = useState({ silent: true, autoLaunch: false, kiosk: false, grantPerms: true })
  const [config, setConfig] = useState([{ k: 'server_url', v: 'https://api.easylearn.org.in' }, { k: 'school_code', v: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  const pickFile = async (f) => {
    if (!f) return
    if (!/\.(apk|exe|msi|appx)$/i.test(f.name)) return
    setFile(f)
    setUploading(true)
    setProgress(0)
    const r = await uploadPackage(f, setProgress)
    setPkg(r)
    setMeta({ name: r.detectedName, version: r.detectedVersion })
    setUploading(false)
  }

  const allSelected = targets.length === institutions.length && institutions.length > 0
  const deviceCount = targets.reduce((s, id) => {
    const inst = institutions.find(i => i.id === id)
    return s + (inst ? deviceCountFor(inst) : 0)
  }, 0)

  const submit = async () => {
    setSubmitting(true)
    const names = institutions.filter(i => targets.includes(i.id)).map(i => i.name)
    const dep = await createDeployment({
      name: meta.name, version: meta.version, fileName: pkg.fileName, platform: pkg.platform, pkg: pkg.detectedPkg, sizeMb: pkg.sizeMb,
      deviceCount, targetLabel: allSelected ? 'All institutions' : names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0],
      silent: opts.silent, autoLaunch: opts.autoLaunch,
      config: Object.fromEntries(config.filter(c => c.k.trim()).map(c => [c.k.trim(), c.v])),
    })
    onCreated(dep)
  }

  const steps = ['Upload package', 'Target devices', 'Configure & push']

  return (
    <Modal title="New app deployment" onClose={onClose} width={640}>
      {/* stepper */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => {
          const n = i + 1
          const state = n < step ? 'done' : n === step ? 'active' : 'todo'
          return (
            <div key={s} className="flex items-center gap-2 flex-1 min-w-0">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={state === 'todo' ? { background: C.surfaceAlt, color: C.textMuted } : { background: state === 'done' ? C.success : C.textPrimary, color: '#fff' }}>
                {state === 'done' ? <i className="ti ti-check text-[12px]" aria-hidden="true"></i> : n}
              </span>
              <span className="text-[12px] font-semibold truncate" style={{ color: state === 'todo' ? C.textMuted : C.textPrimary }}>{s}</span>
              {n < steps.length && <span className="flex-1 h-px" style={{ background: C.border }} />}
            </div>
          )
        })}
      </div>

      {step === 1 && (
        <>
          {!file ? (
            <div onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files?.[0]) }}
              className="rounded-2xl py-10 px-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
              style={{ border: `2px dashed ${drag ? ACCENT : C.borderStrong}`, background: drag ? C.accentBg : C.surfaceAlt }}>
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}` }}>
                <i className="ti ti-cloud-upload text-[22px]" style={{ color: ACCENT_DEEP }} aria-hidden="true"></i>
              </span>
              <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>Drop your package here or click to browse</div>
              <div className="text-[11.5px] mt-1" style={{ color: C.textMuted }}>.apk for Android · .exe / .msi / .appx for Windows · up to 2 GB</div>
              <input ref={inputRef} type="file" accept=".apk,.exe,.msi,.appx" className="hidden" onChange={e => pickFile(e.target.files?.[0])} />
            </div>
          ) : (
            <div className="rounded-2xl p-4" style={{ border: `1px solid ${C.border}`, background: C.surfaceAlt }}>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <i className={`ti ${/\.apk$/i.test(file.name) ? 'ti-brand-android' : 'ti-brand-windows'} text-[18px]`} style={{ color: /\.apk$/i.test(file.name) ? '#3DDC84' : '#0078D4' }} aria-hidden="true"></i>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate mono" style={{ color: C.textPrimary }}>{file.name}</div>
                  <div className="text-[11.5px]" style={{ color: C.textMuted }}>
                    {(file.size / (1024 * 1024)).toFixed(1)} MB · {uploading ? (progress < 100 ? `Uploading ${progress}%` : 'Scanning package & verifying signature…') : 'Uploaded & verified'}
                  </div>
                </div>
                {!uploading && <button onClick={() => { setFile(null); setPkg(null) }} className="text-[11.5px] font-semibold cursor-pointer" style={{ color: C.textMuted, background: 'transparent', border: 'none' }}>Replace</button>}
              </div>
              <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: C.surface }}>
                <div className={uploading ? 'am-stripe' : ''} style={{ height: '100%', width: `${progress}%`, background: uploading ? ACCENT : C.success, transition: 'width 150ms linear' }} />
              </div>
              {pkg && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Field label="App name"><input value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} className="am-input w-full text-[13px] px-3 py-2 rounded-xl" style={inputStyle} /></Field>
                  <Field label="Version"><input value={meta.version} onChange={e => setMeta(m => ({ ...m, version: e.target.value }))} className="am-input mono w-full text-[12.5px] px-3 py-2 rounded-xl" style={inputStyle} /></Field>
                  <div className="col-span-2 grid grid-cols-2 gap-3 text-[11.5px]">
                    <div><span style={{ color: C.textMuted }}>Package</span><div className="mono truncate" style={{ color: C.textPrimary }}>{pkg.detectedPkg}</div></div>
                    <div><span style={{ color: C.textMuted }}>Signature</span><div style={{ color: pkg.signature.startsWith('Verified') ? C.success : C.warning }}>{pkg.signature}</div></div>
                    <div className="col-span-2"><span style={{ color: C.textMuted }}>SHA-256</span><div className="mono truncate" style={{ color: C.textSecondary }}>{pkg.sha256}</div></div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-5">
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" icon="ti-arrow-right" disabled={!pkg || !meta.name.trim()} onClick={() => setStep(2)}>Continue</Btn>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>Select institutions</div>
            <button onClick={() => setTargets(allSelected ? [] : institutions.map(i => i.id))} className="text-[12px] font-semibold cursor-pointer" style={{ color: ACCENT_DEEP, background: 'transparent', border: 'none' }}>
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {institutions.map(inst => {
              const on = targets.includes(inst.id)
              return (
                <button key={inst.id} onClick={() => setTargets(t => on ? t.filter(x => x !== inst.id) : [...t, inst.id])}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left cursor-pointer transition-colors"
                  style={{ background: on ? C.accentBg : C.surface, border: `1px solid ${on ? ACCENT : C.border}` }}>
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? ACCENT : C.surface, border: `1.5px solid ${on ? ACCENT : C.borderStrong}` }}>
                      {on && <i className="ti ti-check text-[12px] text-white" aria-hidden="true"></i>}
                    </span>
                    <span className="text-[13px] font-semibold truncate" style={{ color: C.textPrimary }}>{inst.name}</span>
                  </span>
                  <span className="text-[11.5px] shrink-0" style={{ color: C.textMuted }}>{deviceCountFor(inst)} {pkg?.platform === 'android' ? 'Android' : 'Windows'} devices</span>
                </button>
              )
            })}
          </div>
          <div className="mt-4 text-[12px] px-3.5 py-2.5 rounded-xl flex items-center gap-2" style={{ background: C.surfaceAlt, color: C.textSecondary }}>
            <i className="ti ti-devices text-[14px]" aria-hidden="true"></i>
            {deviceCount > 0 ? <>Will be pushed to <b style={{ color: C.textPrimary }}>{fmt(deviceCount)} devices</b> across {targets.length} institution{targets.length > 1 ? 's' : ''}</> : 'Select at least one institution'}
          </div>
          <div className="flex justify-between gap-2 pt-5">
            <Btn icon="ti-arrow-left" onClick={() => setStep(1)}>Back</Btn>
            <Btn variant="primary" icon="ti-arrow-right" disabled={!targets.length} onClick={() => setStep(3)}>Continue</Btn>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="rounded-xl px-4 py-1 mb-4" style={{ border: `1px solid ${C.border}` }}>
            <Toggle on={opts.silent} onChange={v => setOpts(o => ({ ...o, silent: v }))} label="Silent install" desc="Install in background without user prompt" />
            <div style={{ borderTop: `1px solid ${C.border}` }} />
            <Toggle on={opts.grantPerms} onChange={v => setOpts(o => ({ ...o, grantPerms: v }))} label="Auto-grant runtime permissions" desc="Storage, camera & microphone granted at install" />
            <div style={{ borderTop: `1px solid ${C.border}` }} />
            <Toggle on={opts.autoLaunch} onChange={v => setOpts(o => ({ ...o, autoLaunch: v }))} label="Launch after install" desc="Open the app once installation completes" />
            <div style={{ borderTop: `1px solid ${C.border}` }} />
            <Toggle on={opts.kiosk} onChange={v => setOpts(o => ({ ...o, kiosk: v }))} label="Add to whitelist" desc="Allow this app even when whitelist mode is active" />
          </div>

          <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.textPrimary }}>Pre-configuration <span className="font-normal" style={{ color: C.textMuted }}>(managed app config)</span></div>
          <div className="flex flex-col gap-2 mb-2">
            {config.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={row.k} onChange={e => setConfig(c => c.map((r, j) => j === i ? { ...r, k: e.target.value } : r))} placeholder="key"
                  className="am-input mono flex-1 text-[12px] px-3 py-2 rounded-xl" style={inputStyle} />
                <input value={row.v} onChange={e => setConfig(c => c.map((r, j) => j === i ? { ...r, v: e.target.value } : r))} placeholder="value"
                  className="am-input mono flex-[1.4] text-[12px] px-3 py-2 rounded-xl" style={inputStyle} />
                <button onClick={() => setConfig(c => c.filter((_, j) => j !== i))} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer shrink-0"
                  style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted }}>
                  <i className="ti ti-x text-[13px]" aria-hidden="true"></i>
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => setConfig(c => [...c, { k: '', v: '' }])} className="text-[12px] font-semibold cursor-pointer mb-4" style={{ color: ACCENT_DEEP, background: 'transparent', border: 'none' }}>
            + Add key
          </button>

          <div className="rounded-xl px-4 py-3 text-[12px] flex items-start gap-2.5" style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.textPrimary }}>
            <i className="ti ti-info-circle text-[15px] mt-0.5" style={{ color: ACCENT_DEEP }} aria-hidden="true"></i>
            <span><b>{meta.name} v{meta.version}</b> will be pushed to <b>{fmt(deviceCount)} devices</b>. Offline devices will install automatically when they reconnect.</span>
          </div>

          <div className="flex justify-between gap-2 pt-5">
            <Btn icon="ti-arrow-left" onClick={() => setStep(2)}>Back</Btn>
            <Btn variant="accent" icon="ti-send" loading={submitting} onClick={submit}>Push to {fmt(deviceCount)} devices</Btn>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ───────────────────────── Usage ───────────────────────── */

function UsageTab({ toast, institutions }) {
  const [period, setPeriod] = useState('daily')
  const [school, setSchool] = useState('all')
  const [rows, setRows] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setRows(null)
    getAppUsage(period, school).then(setRows)
  }, [period, school])

  const doExport = async () => {
    if (!rows) return
    setExporting(true)
    try {
      const blob = await exportUsageReport(rows, period)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `app-usage-${period}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast('Report downloaded')
    } catch { toast('Export failed', 'error') }
    setExporting(false)
  }

  const totals = useMemo(() => {
    if (!rows) return null
    const w = rows.reduce((s, r) => s + r.workingHrs, 0)
    const o = rows.reduce((s, r) => s + r.offHrs, 0)
    return { w, o, pct: w + o ? Math.round((o / (w + o)) * 100) : 0 }
  }, [rows])
  const max = rows ? Math.max(...rows.map(r => r.workingHrs + r.offHrs)) : 1
  const periodLabel = { daily: 'Today', monthly: 'This month', yearly: 'This year' }[period]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-1 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {['daily', 'monthly', 'yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg capitalize cursor-pointer"
                style={period === p ? { background: C.textPrimary, color: '#fff', border: 'none' } : { background: 'transparent', color: C.textSecondary, border: 'none' }}>
                {p}
              </button>
            ))}
          </div>
          <select value={school} onChange={e => setSchool(e.target.value)} className="am-input text-[12.5px] px-3 py-2 rounded-xl cursor-pointer" style={inputStyle}>
            <option value="all">All institutions</option>
            {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <Btn variant="primary" icon="ti-file-spreadsheet" loading={exporting} disabled={!rows} onClick={doExport}>Export to Excel</Btn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Working-hour usage', value: totals ? `${fmt(totals.w)} hrs` : '—', icon: 'ti-sun', color: ACCENT },
          { label: 'Non-working-hour usage', value: totals ? `${fmt(totals.o)} hrs` : '—', icon: 'ti-moon', color: '#475467' },
          { label: 'Off-hours share', value: totals ? `${totals.pct}%` : '—', icon: 'ti-alert-triangle', color: totals && totals.pct > 15 ? '#E4483C' : C.success },
        ].map(k => (
          <Card key={k.label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>{k.label}</span>
              <i className={`ti ${k.icon} text-[16px]`} style={{ color: k.color }} aria-hidden="true"></i>
            </div>
            <div className="text-[24px] font-extrabold tracking-tight" style={{ color: C.textPrimary }}>{k.value}</div>
            <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>{periodLabel}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title={`App usage — ${periodLabel.toLowerCase()}`} sub="Sorted by total usage · working hours 08:00–17:00 as configured in project" />
        {!rows ? <Loader label="Aggregating agent usage logs…" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 760 }}>
              <thead>
                <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                  <th className="px-5 py-2.5 w-8">#</th>
                  <th className="px-3 py-2.5">Application</th>
                  <th className="px-3 py-2.5">Devices</th>
                  <th className="px-3 py-2.5 w-[38%]">Usage</th>
                  <th className="px-3 py-2.5 text-right">Working</th>
                  <th className="px-5 py-2.5 text-right">Off-hours</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const t = r.workingHrs + r.offHrs
                  const offPct = t ? (r.offHrs / t) * 100 : 0
                  const p = PLATFORM_META[r.platform]
                  return (
                    <tr key={r.name} className="am-row" style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="px-5 py-3 text-[12px] font-semibold" style={{ color: C.textMuted }}>{i + 1}</td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: C.textPrimary }}>
                          <i className={`ti ${p.icon} text-[14px]`} style={{ color: p.color }} aria-hidden="true"></i>{r.name}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[12.5px]" style={{ color: C.textSecondary }}>{fmt(r.devices)}</td>
                      <td className="px-3 py-3">
                        <div className="h-2 rounded-full overflow-hidden flex" style={{ width: `${(t / max) * 100}%`, minWidth: 16, background: C.surfaceAlt }}>
                          <div style={{ width: `${100 - offPct}%`, background: ACCENT }} />
                          <div style={{ width: `${offPct}%`, background: INK + '55' }} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{fmt(r.workingHrs)} h</td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[12.5px] font-semibold" style={{ color: offPct > 30 ? '#E4483C' : C.textSecondary }}>{fmt(r.offHrs)} h</span>
                        {offPct > 30 && <i className="ti ti-alert-triangle text-[12px] ml-1" style={{ color: '#E4483C' }} title="High off-hours usage" aria-hidden="true"></i>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
