import { useNavigate } from 'react-router-dom'

/* Uses the same `C` design tokens as Dashboard.jsx — pass them in as a prop
   so this stays a single source of truth instead of duplicating the object. */
export default function Sidebar({ C, activeKey = 'mdm' }) {
  const navigate = useNavigate()

  const modules = [
    { key: 'drm', label: 'Digital Rights Management', icon: 'ti-shield-lock', path: '/modules/drm' },
    { key: 'mdm', label: 'MDM Software', icon: 'ti-device-desktop-analytics', path: '/mdm' },
    { key: 'vapt', label: 'VAPT', icon: 'ti-bug', path: '/modules/vapt' },
    { key: 'fortimates', label: 'FortiMates', icon: 'ti-coin', path: '/modules/fortimates' },
  ]

  return (
    <div className="w-64 shrink-0 min-h-full py-6 px-3" style={{ background: C.surface, borderRight: `1px solid ${C.border}` }}>
      <div className="px-3 mb-4 text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>
        ISF Infra
      </div>
      <nav className="flex flex-col gap-1">
        {modules.map((m) => {
          const active = m.key === activeKey
          return (
            <button
              key={m.key}
              onClick={() => navigate(m.path)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
              style={{
                background: active ? C.systemBg : 'transparent',
                borderLeft: active ? `3px solid ${C.brandFrom}` : '3px solid transparent',
              }}
            >
              <i className={`ti ${m.icon} text-[16px]`} style={{ color: active ? C.brandFrom : C.textMuted }} aria-hidden="true"></i>
              <span className="text-[13px] font-medium" style={{ color: active ? C.brandFrom : C.textSecondary }}>
                {m.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}