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
    key: 'signage',
    title: 'Digital Signboard',
    tagline: 'Screens & content management',
    icon: 'ti-device-tv',
    accent: '#C026D3', deep: '#A21CAF', bg: '#FDF4FF', border: '#F5D0FE',
    gradient: 'linear-gradient(135deg, #D946EF, #A21CAF)',
    path: '/modules/signage',
    summary: 'Control digital signboard screens and the content on them across every site from one dashboard — push playlists, schedule by time of day, and monitor every display remotely.',
    features: ['Remote screen management (restart / refresh / screenshot)', 'Content library (image / video / PDF / web / widget)', 'Playlists with looping & sequencing', 'Day-part scheduling & campaigns', 'Multi-zone layouts & multi-platform players', 'Playback analytics & uptime reports'],
  },
  {
    key: 'infradc',
    title: 'InfraDC',
    tagline: 'Remote device management',
    icon: 'ti-device-desktop',
    accent: '#2563EB', deep: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE',
    gradient: 'linear-gradient(135deg, #2563EB, #60A5FA)',
    path: '/mdm',
    summary: 'Remote device management — control, lock, wipe and monitor every enrolled Windows & Android device across your institutions from one console.',
    features: ['Device enrollment & provisioning', 'Remote management (lock / wipe / restart)', 'App management (blacklist / whitelist / push)', 'Security policies, Wi-Fi & time fencing', 'Content publishing & secure browser', 'Geofencing & real-time reports'],
  },
  {
    key: 'infradrm',
    title: 'InfraDRM',
    tagline: 'Digital Rights Management',
    icon: 'ti-shield-lock',
    accent: '#4F46E5', deep: '#3730A3', bg: '#EEF2FF', border: '#C7D2FE',
    gradient: 'linear-gradient(135deg, #4F46E5, #818CF8)',
    path: '/modules/drm',
    summary: 'Protect and license digital content across your network. Every video, PDF and eBook is AES-encrypted, device-bound, watermarked on screen, and traceable if it ever leaks.',
    features: ['Protected content library', 'Rights policies (view / download / print / time / geo)', 'Licenses & hardware device binding', 'Forensic leak tracing from a watermark', 'Live access audit log'],
  },
  {
    key: 'infranet',
    title: 'InfraNet',
    tagline: 'Network monitoring',
    icon: 'ti-affiliate',
    accent: '#0D9488', deep: '#0F766E', bg: '#ECFEFF', border: '#99F6E4',
    gradient: 'linear-gradient(135deg, #14B8A6, #0D9488)',
    soon: true,
    summary: 'Real-time visibility into connectivity and infrastructure health across every site — uptime, bandwidth, device reachability and alerts.',
    features: ['Live uptime & latency monitoring', 'Bandwidth & traffic insights', 'Device & link health', 'Outage alerts'],
  },
  {
    key: 'infradms',
    title: 'InfraDMS',
    tagline: 'Document Management System',
    icon: 'ti-file-text',
    accent: '#D97706', deep: '#B45309', bg: '#FFF7ED', border: '#FED7AA',
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    soon: true,
    summary: 'Centralized, secure document storage and workflows — versioning, access control and approvals for every institution.',
    features: ['Central document repository', 'Version control', 'Role-based access', 'Approval workflows'],
  },
  {
    key: 'infracloud',
    title: 'InfraCloud',
    tagline: 'Cloud infrastructure layer',
    icon: 'ti-cloud',
    accent: '#0EA5E9', deep: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD',
    gradient: 'linear-gradient(135deg, #38BDF8, #0284C7)',
    soon: true,
    summary: 'Storage, backup and hosting for all InfraPoint modules — the cloud layer that every other module runs on.',
    features: ['Object & file storage', 'Automated backups', 'Hosting for all modules', 'Usage & cost insights'],
  },
  {
    key: 'fortimates',
    title: 'FortiMates',
    tagline: 'Verified-ID email & call system',
    icon: 'ti-mail-check',
    accent: '#CA8A04', deep: '#A16207', bg: '#FEFCE8', border: '#FDE68A',
    gradient: 'linear-gradient(135deg, #EAB308, #CA8A04)',
    path: '/modules/fortimates/dashboard',
    summary: 'Eliminate fraud with sender verification and call tracking. A verified-ID email & call system with full KYC and admin controls.',
    features: ['Dashboard overview & analytics', 'KYC module & verification', 'Mail tracker (verified sender)', 'Call tracking', 'Requests queue', 'Admin & configuration'],
  },
  {
    key: 'vapt',
    title: 'VAPT',
    tagline: 'Vulnerability Assessment & Pen-Testing',
    icon: 'ti-shield-check',
    accent: '#0891B2', deep: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC',
    gradient: 'linear-gradient(135deg, #06B6D4, #0E7490)',
    path: '/modules/vapt',
    summary: 'Find and fix security gaps before attackers do. Scan web, API and cloud assets, review findings with CVSS scores and OWASP mapping, and generate reports.',
    features: ['Network / Web / API / Cloud scans', 'Findings with CVSS severity & remediation', 'OWASP Top 10 & compliance mapping', 'Executive & technical report generation'],
  },
  {
    key: 'infrasurveillance',
    title: 'InfraSurveillance',
    tagline: 'Camera & physical monitoring',
    icon: 'ti-video',
    accent: '#E11D48', deep: '#BE123C', bg: '#FFF1F2', border: '#FECDD3',
    gradient: 'linear-gradient(135deg, #F43F5E, #BE123C)',
    soon: true,
    summary: 'Live camera feeds and incident alerts across all sites — physical security monitoring integrated with the rest of the platform.',
    features: ['Live camera feeds', 'Incident & motion alerts', 'Multi-site view', 'Recording & playback'],
  },
  {
    key: 'smartmeters',
    title: 'SmartMeters',
    tagline: 'IoT utility tracking',
    icon: 'ti-gauge',
    accent: '#16A34A', deep: '#15803D', bg: '#F0FDF4', border: '#BBF7D0',
    gradient: 'linear-gradient(135deg, #22C55E, #15803D)',
    soon: true,
    summary: 'Monitor electricity, water and resource usage in real time with IoT meters — usage trends, alerts and cost tracking per site.',
    features: ['Real-time electricity & water usage', 'Per-site consumption', 'Usage alerts & thresholds', 'Cost & trend reports'],
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
        <div className="px-7 py-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>ISF Infra</p>
          <h1 className="text-[24px] font-extrabold tracking-tight mt-1" style={{ color: C.textPrimary }}>
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-[13.5px] mt-1.5 mb-7" style={{ color: C.textSecondary }}>
            Choose a module to get started. Each one opens with a quick overview first.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {mods.map(m => (
              <button key={m.key} onClick={() => navigate(`/home/${m.key}`)}
                className="hm-card group text-left rounded-2xl overflow-hidden flex flex-col cursor-pointer p-5"
                style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 1px 1px rgba(26,26,24,0.03)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 1px 1px rgba(26,26,24,0.04), 0 18px 34px -24px rgba(26,26,24,0.4)'; e.currentTarget.style.borderColor = C.borderStrong }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 1px rgba(26,26,24,0.03)'; e.currentTarget.style.borderColor = C.border }}>

                {/* Icon + soon badge */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: m.accent + '14', border: `1px solid ${m.accent}29` }}>
                    <i className={`ti ${m.icon} text-[22px]`} style={{ color: m.accent }} aria-hidden="true"></i>
                  </div>
                  {m.soon && (
                    <span className="text-[9.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{ background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}` }}>Soon</span>
                  )}
                </div>

                <div className="text-[15px] font-bold mt-4" style={{ color: C.textPrimary }}>{m.title}</div>
                <div className="text-[12.5px] mt-1 mb-5 flex-1" style={{ color: C.textSecondary }}>{m.tagline}</div>

                {m.soon ? (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: C.textMuted }}>
                    <i className="ti ti-clock text-[13px]" aria-hidden="true"></i> Coming soon
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>
                    View overview
                    <i className="ti ti-arrow-right text-[13px] transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: m.accent }} aria-hidden="true"></i>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
