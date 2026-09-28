import { useNavigate } from 'react-router-dom'

const INK = '#1A1A18'
const SUB = '#5C5C57'
const BG = '#E8E8E3'

const CARDS = [
  { title: 'License Dashboard', desc: 'Overview of all active licenses', icon: 'ti-layout-dashboard', path: '/license/dashboard' },
  { title: 'Generate License', desc: 'Create and issue new license keys', icon: 'ti-key', path: '/license/generate' },
  { title: 'Manage Licenses', desc: 'View, edit and revoke licenses', icon: 'ti-list-details', path: '/license/manage' },
  { title: 'Assign to Schools', desc: 'Distribute licenses to institutions', icon: 'ti-building-community', path: '/license/assign' },
  { title: 'Usage & Activity', desc: 'Track license usage and history', icon: 'ti-history', path: '/license/usage' },
  { title: 'Violations', desc: 'Monitor and resolve license violations', icon: 'ti-alert-triangle', path: '/license/violations' },
]

export default function LicenseHub() {
  const navigate = useNavigate()

  return (
    <div className="p-8" style={{ background: BG, minHeight: '100%' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight" style={{ color: INK }}>License Management</h2>
        <p className="text-sm mt-1.5" style={{ color: SUB }}>Generate, assign and monitor licenses across every institution.</p>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {CARDS.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="text-left bg-white border p-5 flex flex-col gap-4 transition-colors"
            style={{ borderColor: INK + '1A' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = INK}
            onMouseLeave={e => e.currentTarget.style.borderColor = INK + '1A'}
          >
            <div className="w-11 h-11 flex items-center justify-center" style={{ background: INK }}>
              <i className={`ti ${card.icon} text-[20px] text-white`} aria-hidden="true"></i>
            </div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: INK }}>{card.title}</p>
              <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: SUB }}>{card.desc}</p>
            </div>
            <div className="mt-auto flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: INK }}>
              Open <i className="ti ti-arrow-right text-[14px]" aria-hidden="true"></i>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}