import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import Topbar from '../../components/common/Topbar'

/* Shared ink / cream palette — same tokens the rest of the app uses. */
const INK = '#1A1A18'
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
  success: '#2F6B45',
  successBg: '#EAF3EC',
  successBorder: '#BFDAC8',
}

const LICENSE_MANAGER_EMAIL = 'yash@isf.com'

/* One registry for the home cards AND the per-module intro page. */
export const MODULES = [
  {
    key: 'drm',
    title: 'Digital Rights Management',
    tagline: 'Protect & track your paid content',
    icon: 'ti-shield-lock',
    accent: '#4F46E5', deep: '#3730A3', bg: '#EEF2FF', border: '#C7D2FE',
    gradient: 'linear-gradient(135deg, #4F46E5, #818CF8)',
    path: '/modules/drm',
    summary: 'Encrypt, license and track every video, PDF and eBook you distribute. Content is AES-encrypted on the server, streamed with a device-bound key, watermarked on every screen, and traceable if it ever leaks.',
    features: ['Protected content library', 'Rights policies (view / download / print / time / geo)', 'Licenses & hardware device binding', 'Forensic leak tracing from a watermark', 'Live access audit log'],
  },
  {
    key: 'mdm',
    title: 'MDM Software',
    tagline: 'Manage every enrolled device',
    icon: 'ti-device-desktop-analytics',
    accent: '#2563EB', deep: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE',
    gradient: 'linear-gradient(135deg, #2563EB, #60A5FA)',
    path: '/mdm',
    summary: 'A single console to manage every enrolled Windows & Android device across your institutions — enroll devices, push apps and security policies, publish content and lock down browsing.',
    features: ['Device enrollment & provisioning', 'Remote device management', 'App management (blacklist / whitelist / push)', 'Security policies, Wi-Fi & time fencing', 'Content publishing & secure browser', 'Geofencing & real-time reports'],
  },
  {
    key: 'vapt',
    title: 'VAPT',
    tagline: 'Find & fix security weaknesses',
    icon: 'ti-shield-bolt',
    accent: '#0891B2', deep: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC',
    gradient: 'linear-gradient(135deg, #06B6D4, #0E7490)',
    path: '/modules/vapt',
    summary: 'Assess your web, API and cloud assets for security weaknesses. Run scans, review findings with CVSS scores and OWASP mapping, track remediation and generate client reports.',
    features: ['Network / Web / API / Cloud scans', 'Findings with CVSS severity & remediation', 'OWASP Top 10 & compliance mapping', 'Executive & technical report generation'],
  },
  {
    key: 'fortimates',
    title: 'FortiMates',
    tagline: 'Fintech & KYC platform',
    icon: 'ti-coin',
    accent: '#CA8A04', deep: '#A16207', bg: '#FEFCE8', border: '#FDE68A',
    gradient: 'linear-gradient(135deg, #EAB308, #CA8A04)',
    path: '/modules/fortimates/dashboard',
    summary: 'Fintech identity & KYC platform — verify users, track mails and calls, and manage requests from one admin dashboard.',
    features: ['Dashboard overview & analytics', 'KYC module & verification', 'Requests queue', 'Mail & call tracking', 'Admin & configuration'],
  },
  {
    key: 'support',
    title: 'Support',
    tagline: 'Raise & track tickets',
    icon: 'ti-headset',
    accent: '#2F6B45', deep: '#235536', bg: '#EAF3EC', border: '#BFDAC8',
    gradient: 'linear-gradient(135deg, #2F6B45, #5BA373)',
    path: '/support',
    roles: ['requester', 'service_desk', 'admin', 'master'],
    summary: 'Raise, assign and resolve support tickets between requesters, service-desk staff and admins — all tracked in one place.',
    features: ['Raise a request', 'Ticket queue', 'Staff assignment', 'Resolution tracking'],
  },
  {
    key: 'license',
    title: 'License Management',
    tagline: 'Issue & manage license keys',
    icon: 'ti-key',
    accent: '#7C5CFC', deep: '#5B3FD6', bg: '#F3F0FF', border: '#D6CCFE',
    gradient: 'linear-gradient(135deg, #A78BFA, #7C5CFC)',
    path: '/license',
    email: LICENSE_MANAGER_EMAIL,
    summary: 'Generate and manage product license keys — issue new keys, assign them to institutions, track usage and handle violations.',
    features: ['License dashboard', 'Generate keys', 'Assign to schools', 'Usage & violations'],
  },
]

/* Visible modules for the current login — same gating as the Sidebar. */
export function visibleModules(user) {
  const role = user?.role
  const email = (user?.email ?? '').toLowerCase()
  return MODULES.filter(m => {
    if (m.roles && !m.roles.includes(role)) return false
    if (m.email && email !== m.email) return false
    return true
  })
}

export default function Home() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const mods = visibleModules(user)

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <style>{`
        .hm-card { transition: transform 260ms cubic-bezier(.2,.9,.3,1), box-shadow 260ms ease, border-color 260ms ease; }
      `}</style>
      <Topbar C={C} />

      <div style={{ minHeight: 'calc(100vh - 73px)' }}>
        <div className="max-w-7xl mx-auto px-7 py-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>ISF Infra</p>
          <h1 className="text-[24px] font-extrabold tracking-tight mt-1" style={{ color: C.textPrimary }}>
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-[13.5px] mt-1.5 mb-7" style={{ color: C.textSecondary }}>
            Choose a module to get started. Each one opens with a quick overview first.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {mods.map(m => (
              <button key={m.key} onClick={() => navigate(`/home/${m.key}`)}
                className="hm-card group text-left rounded-[22px] overflow-hidden flex flex-col cursor-pointer"
                style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 1px 1px rgba(26,26,24,0.04), 0 14px 30px -20px rgba(26,26,24,0.25)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = `0 1px 1px rgba(26,26,24,0.05), 0 28px 46px -20px ${m.accent}66`; e.currentTarget.style.borderColor = m.accent + '66' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 1px rgba(26,26,24,0.04), 0 14px 30px -20px rgba(26,26,24,0.25)'; e.currentTarget.style.borderColor = C.border }}>

                {/* Gradient header */}
                <div className="h-28 relative flex items-center justify-center" style={{ background: m.gradient }}>
                  <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#FFFFFF22 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 18px -8px rgba(0,0,0,0.3)' }}>
                    <i className={`ti ${m.icon} text-[28px] text-white`} aria-hidden="true"></i>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="text-[15px] font-bold" style={{ color: C.textPrimary }}>{m.title}</div>
                  <div className="text-[12.5px] mt-0.5 mb-4 flex-1" style={{ color: C.textSecondary }}>{m.tagline}</div>
                  <span className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[12.5px] font-bold uppercase tracking-wide text-white transition-all"
                    style={{ background: m.gradient, boxShadow: `0 10px 20px -10px ${m.accent}` }}>
                    View <i className="ti ti-arrow-right text-[13px]" aria-hidden="true"></i>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
