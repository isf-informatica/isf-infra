import { useParams, useNavigate, Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import Topbar from '../../components/common/Topbar'
import { C, visibleModules } from './Home'

/* Per-module PRODUCT LANDING PAGE — reached from a Home card.
   Flat / premium marketing style matching InfraPointLanding (uppercase
   headings, neutral bands, dark CTA). Accent is used only as a hint.
   Fully data-driven from the shared MODULES registry in Home.jsx. */

const INK = '#1A1A18'
const SUB = '#5C5C57'
const BAND = '#DEDFD8'
const DARK = '#0F172A'

export default function ModuleIntro() {
  const { key } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const mod = visibleModules(user).find(m => m.key === key)

  // Unknown key or not allowed for this login → back to home.
  if (!mod) return <Navigate to="/home" replace />

  const soon = !!mod.soon
  const open = () => { if (!soon) navigate(mod.path) }

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp, color: INK }}>
      <Topbar C={C} />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden" style={{ borderBottom: `1px solid ${INK}1A` }}>
        {/* accent identity: thin top rule + faint tint wash */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: mod.accent }} />
        <div className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full"
          style={{ background: mod.accent, opacity: 0.06, filter: 'blur(10px)' }} />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 py-10 sm:py-14 lg:py-16">
          <button onClick={() => navigate('/home')}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium mb-8 cursor-pointer bg-transparent border-none"
            style={{ color: SUB }}>
            <i className="ti ti-arrow-left text-[13px]" aria-hidden="true"></i> All modules
          </button>

          {/* eyebrow */}
          <div className="flex items-center gap-2.5 mb-5">
            <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: mod.accent + '14', border: `1px solid ${mod.accent}2e` }}>
              <i className={`ti ${mod.icon} text-[20px]`} style={{ color: mod.accent }} aria-hidden="true"></i>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: mod.accent }}>
              ISF Infra · Product
            </span>
            {soon && (
              <span className="text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{ background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}` }}>Soon</span>
            )}
          </div>

          <h1 className="text-[32px] sm:text-[42px] lg:text-[52px] font-extrabold uppercase tracking-tight leading-[1.05] max-w-3xl">
            {mod.title}
          </h1>
          <p className="text-[15px] sm:text-[17px] font-semibold mt-3" style={{ color: INK }}>{mod.tagline}</p>
          <p className="text-[13.5px] sm:text-[14.5px] mt-4 max-w-2xl leading-relaxed" style={{ color: SUB }}>
            {mod.summary}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8 max-w-xs sm:max-w-none">
            {soon ? (
              <span className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide"
                style={{ background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}` }}>
                <i className="ti ti-clock text-[14px]" aria-hidden="true"></i> Coming soon
              </span>
            ) : (
              <button onClick={open}
                className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-[13px] font-bold uppercase tracking-wide text-white cursor-pointer border-none transition-all"
                style={{ background: INK }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.18)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}>
                Open module <i className="ti ti-arrow-right text-[14px]" aria-hidden="true"></i>
              </button>
            )}
            <button onClick={() => navigate('/home')}
              className="inline-flex items-center justify-center px-5 py-2.5 text-[13px] font-semibold cursor-pointer transition-colors"
              style={{ border: `1px solid ${INK}`, color: INK, background: 'transparent' }}>
              Back to all modules
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ CAPABILITIES ═══════════ */}
      <section style={{ background: BAND, borderBottom: `1px solid ${INK}14` }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: SUB }}>
            {soon ? 'Planned capabilities' : "What's inside"}
          </span>
          <h2 className="text-[24px] sm:text-[30px] font-extrabold uppercase tracking-tight mt-2 max-w-2xl">
            {soon ? `What ${mod.title} will do` : `Everything ${mod.title} gives you`}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {mod.features.map((f, i) => (
              <div key={f} className="flex items-start gap-3 p-5"
                style={{ background: C.surface, border: `1px solid ${INK}14` }}>
                <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[13px] font-extrabold"
                  style={{ background: mod.accent + '14', color: mod.accent, border: `1px solid ${mod.accent}29` }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[13px] font-semibold leading-snug pt-1" style={{ color: INK }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section style={{ background: DARK }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-[24px] sm:text-[32px] font-extrabold uppercase tracking-tight text-white max-w-2xl leading-[1.1]">
              {soon ? `${mod.title} is on the roadmap` : `Ready to roll out ${mod.title}?`}
            </h2>
            <p className="text-[13.5px] mt-3 max-w-xl leading-relaxed" style={{ color: '#94A3B8' }}>
              {soon
                ? 'This module is coming soon. Explore the modules that are live today in the meantime.'
                : `${mod.tagline} — manage it for every institution from one console.`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            {soon ? (
              <button onClick={() => navigate('/home')}
                className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-[13px] font-bold uppercase tracking-wide cursor-pointer border-none"
                style={{ background: '#fff', color: INK }}>
                Browse modules <i className="ti ti-arrow-right text-[14px]" aria-hidden="true"></i>
              </button>
            ) : (
              <button onClick={open}
                className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-[13px] font-bold uppercase tracking-wide cursor-pointer border-none transition-all"
                style={{ background: '#fff', color: INK }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.92)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}>
                Open module <i className="ti ti-arrow-right text-[14px]" aria-hidden="true"></i>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
