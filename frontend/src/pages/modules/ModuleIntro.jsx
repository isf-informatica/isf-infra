import { useParams, useNavigate, Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import Topbar from '../../components/common/Topbar'
import { C, visibleModules } from './Home'

/* Summary screen shown after a Home card is clicked, before entering the module.
   Reads the module from the shared MODULES registry in Home.jsx. */
export default function ModuleIntro() {
  const { key } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const mod = visibleModules(user).find(m => m.key === key)

  // Unknown key or not allowed for this login → back to home.
  if (!mod) return <Navigate to="/home" replace />

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <Topbar C={C} />
      <div style={{ minHeight: 'calc(100vh - 73px)' }}>
        <div className="px-7 py-8 max-w-4xl">
          <button onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 text-[12.5px] font-medium mb-5 cursor-pointer bg-transparent border-none"
            style={{ color: C.textSecondary }}>
            <i className="ti ti-arrow-left text-[13px]" aria-hidden="true"></i> All modules
          </button>

          {/* Hero */}
          <div className="rounded-[22px] overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 1px 1px rgba(26,26,24,0.04), 0 16px 34px -22px rgba(26,26,24,0.3)' }}>
            <div className="h-36 relative flex items-center px-7 gap-5" style={{ background: mod.gradient }}>
              <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#FFFFFF22 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
              <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 22px -8px rgba(0,0,0,0.3)' }}>
                <i className={`ti ${mod.icon} text-[36px] text-white`} aria-hidden="true"></i>
              </div>
              <div className="relative">
                <h1 className="text-[24px] font-extrabold tracking-tight text-white">{mod.title}</h1>
                <p className="text-[13.5px] mt-1 text-white/90">{mod.tagline}</p>
              </div>
            </div>

            <div className="p-7">
              {/* Summary */}
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.textMuted }}>Overview</div>
              <p className="text-[14px] leading-relaxed" style={{ color: C.textPrimary }}>{mod.summary}</p>

              {/* Features */}
              <div className="text-[11px] font-semibold uppercase tracking-wider mt-6 mb-3" style={{ color: C.textMuted }}>{mod.soon ? 'Planned capabilities' : "What's inside"}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {mod.features.map(f => (
                  <div key={f} className="flex items-start gap-2.5 px-4 py-3 rounded-xl" style={{ background: mod.bg, border: `1px solid ${mod.border}` }}>
                    <i className="ti ti-circle-check text-[16px] mt-0.5 shrink-0" style={{ color: mod.accent }} aria-hidden="true"></i>
                    <span className="text-[12.5px] font-medium" style={{ color: C.textPrimary }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* Enter */}
              <div className="flex items-center justify-between gap-3 flex-wrap mt-7 pt-6" style={{ borderTop: `1px solid ${C.border}` }}>
                <span className="text-[12.5px]" style={{ color: C.textMuted }}>{mod.soon ? 'This module is on the roadmap.' : 'Ready to continue?'}</span>
                <div className="flex gap-2">
                  <button onClick={() => navigate('/home')}
                    className="px-4 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer"
                    style={{ background: C.surface, color: C.textSecondary, border: `1px solid ${C.border}` }}>
                    Back
                  </button>
                  {mod.soon ? (
                    <span className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-bold uppercase tracking-wide"
                      style={{ background: mod.bg, color: mod.deep, border: `1px solid ${mod.border}` }}>
                      <i className="ti ti-clock text-[14px]" aria-hidden="true"></i> Coming soon
                    </span>
                  ) : (
                  <button onClick={() => navigate(mod.path)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-bold uppercase tracking-wide text-white border-none cursor-pointer transition-all"
                    style={{ background: mod.gradient, boxShadow: `0 10px 22px -10px ${mod.accent}` }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}>
                    Open module <i className="ti ti-arrow-right text-[14px]" aria-hidden="true"></i>
                  </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
