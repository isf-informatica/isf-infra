import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../common/Topbar'

/* Shared UI kit for MDM module pages (Policy Management, Content Publishing,
   Secure Browser). Same tokens as MdmHub.jsx / AppManagementView.jsx so every
   page in the app matches. Each page passes its own `accent` to <MdmPage>. */

export const INK = '#1A1A18'
const SUB = '#5C5C57'
const MUTED = '#8A8A85'

export const C = {
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
  red: '#E4483C',
}

export const PLATFORM_META = {
  android: { label: 'Android', icon: 'ti-brand-android', color: '#3DDC84' },
  windows: { label: 'Windows', icon: 'ti-brand-windows', color: '#0078D4' },
}

export const timeAgo = (iso) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  return `${Math.floor(h / 24)} d ago`
}
export const fmt = (n) => Number(n).toLocaleString('en-IN')
export const inputStyle = { border: `1px solid ${C.systemBorder}`, background: C.surface, color: C.textPrimary }

export const downloadBlob = (blob, name) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

const AccentCtx = createContext({ accent: INK, accentDeep: INK, accentBg: C.surfaceAlt, accentBorder: C.border })
export const useAccent = () => useContext(AccentCtx)

/* ───────── primitives ───────── */

export function Pill({ meta, children, small }) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full whitespace-nowrap ${small ? 'text-[10.5px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'}`}
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
      {meta.icon && <i className={`ti ${meta.icon} text-[11px]`} aria-hidden="true"></i>}
      {children ?? meta.label}
    </span>
  )
}
export const PILL = {
  success: (icon = 'ti-circle-check') => ({ color: C.success, bg: C.successBg, border: C.successBorder, icon }),
  warning: (icon = 'ti-alert-triangle') => ({ color: C.warning, bg: C.warningBg, border: C.warningBorder, icon }),
  danger: (icon = 'ti-ban') => ({ color: C.danger, bg: C.dangerBg, border: C.dangerBorder, icon }),
  neutral: (icon) => ({ color: C.textSecondary, bg: C.surfaceAlt, border: C.border, icon }),
}

export function Card({ children, className = '', style = {} }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{ background: C.surface, border: `1px solid ${C.border}`, ...style }}>
      {children}
    </div>
  )
}

export function CardHeader({ title, right, sub }) {
  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>{title}</div>
        {sub && <div className="text-[11.5px] mt-0.5" style={{ color: C.textSecondary }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

export function Btn({ children, onClick, variant = 'ghost', disabled, icon, loading, className = '', type = 'button', title }) {
  const { accent } = useAccent()
  const styles = {
    primary: { background: C.textPrimary, color: '#fff', border: `1px solid ${C.textPrimary}` },
    accent: { background: accent, color: '#fff', border: `1px solid ${accent}` },
    ghost: { background: C.surface, color: C.textPrimary, border: `1px solid ${C.border}` },
    danger: { background: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}` },
    success: { background: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} title={title}
      className={`mk-btn inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-xl transition-all ${className}`}
      style={{ ...styles[variant], opacity: disabled ? 0.5 : 1, cursor: disabled || loading ? 'not-allowed' : 'pointer' }}>
      {loading ? <i className="ti ti-loader-2 animate-spin text-[13px]" aria-hidden="true"></i>
        : icon && <i className={`ti ${icon} text-[13px]`} aria-hidden="true"></i>}
      {children}
    </button>
  )
}

export function IconBtn({ icon, onClick, title, loading, danger }) {
  return (
    <button onClick={onClick} disabled={loading} title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer shrink-0 mk-btn"
      style={{ background: 'transparent', border: `1px solid ${C.border}`, color: danger ? C.danger : C.textMuted }}>
      <i className={`ti ${loading ? 'ti-loader-2 animate-spin' : icon} text-[14px]`} aria-hidden="true"></i>
    </button>
  )
}

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-[13px]" style={{ color: C.textSecondary }}>
      <i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> {label}
    </div>
  )
}

export function Empty({ icon = 'ti-inbox', children }) {
  return (
    <div className="py-12 flex flex-col items-center gap-2 text-[13px]" style={{ color: C.textMuted }}>
      <i className={`ti ${icon} text-[22px]`} aria-hidden="true"></i>{children}
    </div>
  )
}

export function Modal({ title, onClose, children, width = 520 }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(26,26,24,0.45)', backdropFilter: 'blur(3px)' }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mk-pop w-full rounded-2xl overflow-hidden flex flex-col" style={{ maxWidth: width, maxHeight: 'calc(100vh - 32px)', background: C.surface, boxShadow: '0 30px 60px -20px rgba(26,26,24,0.45)' }}>
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="text-[15px] font-bold" style={{ color: C.textPrimary }}>{title}</div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ background: C.surfaceAlt, color: C.textSecondary, border: 'none' }}>
            <i className="ti ti-x text-[14px]" aria-hidden="true"></i>
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="block mb-4">
      <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.textPrimary }}>{label}</div>
      {children}
      {hint && <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>{hint}</div>}
    </label>
  )
}

export function Input(props) {
  return <input {...props} className={`mk-input w-full text-[13px] px-3 py-2 rounded-xl ${props.className || ''}`} style={{ ...inputStyle, ...(props.style || {}) }} />
}
export function Select({ children, className = '', ...props }) {
  return <select {...props} className={`mk-input text-[12.5px] px-3 py-2 rounded-xl cursor-pointer ${className}`} style={inputStyle}>{children}</select>
}

export function Switch({ on, onChange, disabled }) {
  const { accent } = useAccent()
  return (
    <button type="button" disabled={disabled} onClick={(e) => { e.stopPropagation(); onChange(!on) }}
      className="relative shrink-0 w-9 h-5 rounded-full transition-colors cursor-pointer" style={{ background: on ? accent : INK + '26', border: 'none', opacity: disabled ? 0.5 : 1 }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: on ? 18 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
    </button>
  )
}

export function Toggle({ on, onChange, label, desc, icon }) {
  return (
    <div className="w-full flex items-center justify-between gap-3 py-2.5 cursor-pointer" onClick={() => onChange(!on)}>
      <div className="flex items-start gap-2.5 min-w-0">
        {icon && <i className={`ti ${icon} text-[15px] mt-0.5`} style={{ color: on ? C.textPrimary : C.textMuted }} aria-hidden="true"></i>}
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{label}</div>
          {desc && <div className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>{desc}</div>}
        </div>
      </div>
      <Switch on={on} onChange={onChange} />
    </div>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="flex p-1 rounded-xl w-fit" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {options.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap"
          style={value === k ? { background: C.textPrimary, color: '#fff', border: 'none' } : { background: 'transparent', color: C.textSecondary, border: 'none' }}>
          {l}
        </button>
      ))}
    </div>
  )
}

export function Chips({ options, value, onChange, counts }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer"
          style={value === k ? { background: C.textPrimary, color: '#fff', border: `1px solid ${C.textPrimary}` } : { background: C.surface, color: C.textSecondary, border: `1px solid ${C.border}` }}>
          {l}{counts && <span style={{ opacity: 0.6 }}> {counts[k] ?? 0}</span>}
        </button>
      ))}
    </div>
  )
}

export function Kpi({ label, value, sub, icon, color }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>{label}</span>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + '14' }}>
          <i className={`ti ${icon} text-[16px]`} style={{ color }} aria-hidden="true"></i>
        </span>
      </div>
      <div className="text-[28px] font-extrabold leading-none tracking-tight" style={{ color: C.textPrimary }}>{value}</div>
      {sub && <div className="text-[11.5px] mt-2" style={{ color: C.textSecondary }}>{sub}</div>}
    </Card>
  )
}

/* Install / delivery progress for a rollout { total, done, failed, pending, status } */
export function RolloutBar({ r, doneLabel = 'applied' }) {
  const pct = r.total ? Math.round(((r.done + r.failed) / r.total) * 100) : 0
  return (
    <div>
      <div className="h-2 rounded-full overflow-hidden flex" style={{ background: C.surfaceAlt }}>
        <div className={r.status === 'running' ? 'mk-stripe' : ''} style={{ width: `${(r.done / r.total) * 100}%`, background: C.success, transition: 'width 600ms ease' }} />
        <div style={{ width: `${(r.failed / r.total) * 100}%`, background: C.red, transition: 'width 600ms ease' }} />
      </div>
      <div className="flex items-center gap-4 mt-2 text-[11.5px] flex-wrap" style={{ color: C.textSecondary }}>
        <span><b style={{ color: C.success }}>{fmt(r.done)}</b> {doneLabel}</span>
        <span><b style={{ color: C.red }}>{fmt(r.failed)}</b> failed</span>
        <span><b style={{ color: C.textPrimary }}>{fmt(r.pending)}</b> pending</span>
        <span className="ml-auto font-semibold" style={{ color: C.textPrimary }}>{pct}% · {fmt(r.total)} devices</span>
      </div>
    </div>
  )
}

export function RolloutStatus({ r }) {
  const { accentDeep, accentBg, accentBorder } = useAccent()
  if (r.status === 'running') return <Pill small meta={{ color: accentDeep, bg: accentBg, border: accentBorder, icon: 'ti-loader-2 animate-spin' }}>In progress</Pill>
  if (r.status === 'scheduled') return <Pill small meta={PILL.neutral('ti-calendar-time')}>Scheduled</Pill>
  if (r.failed > 0) return <Pill small meta={PILL.warning()}>Completed with errors</Pill>
  return <Pill small meta={PILL.success()}>Completed</Pill>
}

/* Institution multi-select with device counts. */
export function TargetPicker({ institutions, value, onChange, countFor, unit = 'devices' }) {
  const { accent, accentBg } = useAccent()
  const all = value.length === institutions.length && institutions.length > 0
  const total = value.reduce((s, id) => {
    const inst = institutions.find(i => i.id === id)
    return s + (inst ? countFor(inst) : 0)
  }, 0)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>Select institutions</div>
        <button onClick={() => onChange(all ? [] : institutions.map(i => i.id))} className="text-[12px] font-semibold cursor-pointer" style={{ color: C.textPrimary, background: 'transparent', border: 'none', textDecoration: 'underline' }}>
          {all ? 'Clear all' : 'Select all'}
        </button>
      </div>
      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
        {institutions.map(inst => {
          const on = value.includes(inst.id)
          return (
            <button key={inst.id} type="button" onClick={() => onChange(on ? value.filter(x => x !== inst.id) : [...value, inst.id])}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-left cursor-pointer transition-colors"
              style={{ background: on ? accentBg : C.surface, border: `1px solid ${on ? accent : C.border}` }}>
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: on ? accent : C.surface, border: `1.5px solid ${on ? accent : C.borderStrong}` }}>
                  {on && <i className="ti ti-check text-[12px] text-white" aria-hidden="true"></i>}
                </span>
                <span className="text-[13px] font-semibold truncate" style={{ color: C.textPrimary }}>{inst.name}</span>
              </span>
              <span className="text-[11.5px] shrink-0" style={{ color: C.textMuted }}>{countFor(inst)} {unit}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 text-[12px] px-3.5 py-2.5 rounded-xl flex items-center gap-2" style={{ background: C.surfaceAlt, color: C.textSecondary }}>
        <i className="ti ti-devices text-[14px]" aria-hidden="true"></i>
        {total > 0 ? <>Will apply to <b style={{ color: C.textPrimary }}>{fmt(total)} {unit}</b> across {value.length} institution{value.length > 1 ? 's' : ''}</> : 'Select at least one institution'}
      </div>
    </div>
  )
}

export function Stepper({ steps, step }) {
  return (
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
  )
}

/* ───────── toasts ───────── */

export function useToasts() {
  const [toasts, setToasts] = useState([])
  const toast = useCallback((msg, kind = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, msg, kind }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800)
  }, [])
  return { toasts, toast }
}

function ToastStack({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 items-end">
      {toasts.map(t => (
        <div key={t.id} className="mk-toast flex items-center gap-2.5 text-[12.5px] font-medium px-4 py-3 rounded-xl max-w-sm"
          style={{ background: C.textPrimary, color: '#fff', boxShadow: '0 14px 30px -12px rgba(0,0,0,0.45)' }}>
          <i className={`ti ${t.kind === 'error' ? 'ti-alert-circle' : t.kind === 'info' ? 'ti-info-circle' : 'ti-circle-check'} text-[15px]`}
            style={{ color: t.kind === 'error' ? '#F5766D' : t.kind === 'info' ? '#F7B733' : '#6EE7B7' }} aria-hidden="true"></i>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

/* ───────── page shell ───────── */

export function MdmPage({ accent, accentDeep, accentBg, accentBorder, gradient, icon, title, subtitle, tabs, tab, onTab, badges = {}, status, right, toasts, children, activeKey = 'mdm', backPath = '/mdm', backLabel = 'MDM software' }) {
  const navigate = useNavigate()
  return (
    <AccentCtx.Provider value={{ accent, accentDeep, accentBg, accentBorder }}>
      <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
        <style>{`
          .mk-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(0.97); }
          .mk-row { transition: background 120ms ease; }
          .mk-row:hover { background: ${C.surfaceAlt}; }
          .mk-input:focus { outline: none; box-shadow: 0 0 0 3px ${accent}26; border-color: ${accent} !important; }
          .mk-fade { animation: mkFade 260ms ease both; }
          @keyframes mkFade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
          .mk-pop { animation: mkPop 200ms cubic-bezier(.2,.9,.3,1.2) both; }
          @keyframes mkPop { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: none } }
          .mk-live { animation: mkLive 1.8s ease-in-out infinite; }
          @keyframes mkLive { 0%,100% { box-shadow: 0 0 0 0 ${C.success}66 } 50% { box-shadow: 0 0 0 5px ${C.success}00 } }
          .mk-stripe { background-image: linear-gradient(45deg, rgba(255,255,255,.28) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.28) 50%, rgba(255,255,255,.28) 75%, transparent 75%); background-size: 14px 14px; animation: mkStripe 0.8s linear infinite; }
          @keyframes mkStripe { to { background-position: 14px 0 } }
          .mk-toast { animation: mkToast 260ms ease both; }
          @keyframes mkToast { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: none } }
        `}</style>

        <Topbar C={C} />

        <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>

          <div className="flex-1 min-w-0 px-7 py-7">
            <button onClick={() => navigate(backPath)} className="flex items-center gap-1 text-[12px] font-medium mb-3 cursor-pointer" style={{ color: C.textMuted, background: 'transparent', border: 'none' }}>
              <i className="ti ti-arrow-left text-[12px]" aria-hidden="true"></i> {backLabel}
            </button>

            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: accent + '14', border: `1px solid ${accent}2e` }}>
                  <i className={`ti ${icon} text-[22px]`} style={{ color: accent }} aria-hidden="true"></i>
                </div>
                <div>
                  <h1 className="text-[20px] font-extrabold uppercase tracking-tight" style={{ color: C.textPrimary }}>{title}</h1>
                  <p className="text-[13px] mt-0.5" style={{ color: C.textSecondary }}>{subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-2 text-[11.5px] font-semibold px-3 py-1.5 rounded-full" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textSecondary }}>
                  <span className="w-2 h-2 rounded-full mk-live" style={{ background: C.success }} />
                  {status || 'Live · connected'}
                </span>
                {right}
              </div>
            </div>

            <div className="flex gap-1.5 mb-6 p-1 rounded-2xl w-fit max-w-full overflow-x-auto" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => onTab(t.key)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors"
                  style={tab === t.key ? { background: C.textPrimary, color: '#fff', border: 'none' } : { background: 'transparent', color: C.textSecondary, border: 'none' }}>
                  <i className={`ti ${t.icon} text-[14px]`} aria-hidden="true"></i> {t.label}
                  {badges[t.key] === 'live' && <span className="ml-0.5 w-1.5 h-1.5 rounded-full mk-live" style={{ background: accent }} />}
                  {typeof badges[t.key] === 'number' && badges[t.key] > 0 && (
                    <span className="ml-0.5 text-[10px] font-bold px-1.5 rounded-full" style={{ background: tab === t.key ? '#fff3' : C.warningBg, color: tab === t.key ? '#fff' : C.warning }}>{badges[t.key]}</span>
                  )}
                </button>
              ))}
            </div>

            <div key={tab} className="mk-fade">{children}</div>
          </div>
        </div>

        <ToastStack toasts={toasts} />
      </div>
    </AccentCtx.Provider>
  )
}

/* Polls a loader while `active` is true — used for live rollout progress. */
export function usePoll(fn, active, ms = 1600) {
  useEffect(() => {
    if (!active) return
    const t = setInterval(fn, ms)
    return () => clearInterval(t)
  }, [fn, active, ms])
}
