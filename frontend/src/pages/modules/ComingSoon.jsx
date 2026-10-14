import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'

/* Shared design tokens — matched to the Login screen's ink / cream palette,
   same as Dashboard.jsx. Key names are unchanged so Sidebar/Topbar (which
   already accept a C prop) pick up the new palette automatically. */
const INK = '#1A1A18'
const SUB = '#5C5C57'
const MUTED = '#8A8A85'

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
  server: '#4A4A46',
  serverBg: '#F2F2EE',
  serverBorder: INK + '3D',
  system: INK,
  systemBg: '#F2F2EE',
  systemBorder: INK + '3D',
  success: '#2F6B45',
  successBg: '#EAF3EC',
  successBorder: '#BFDAC8',
  danger: '#8A2A2A',
  dangerBg: '#FDECEC',
  dangerBorder: '#E8A5A5',
  warning: '#8A6816',
  warningBg: '#FBF3E0',
  warningBorder: '#E7D39C',
}

export default function ComingSoon({ title, moduleKey }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      <Topbar C={C} />

      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey={moduleKey} />

        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
            <i className="ti ti-tools text-[26px]" style={{ color: C.brandFrom }} aria-hidden="true"></i>
          </div>
          <h1 className="text-[20px] font-semibold" style={{ color: C.textPrimary }}>{title}</h1>
          <p className="text-[13px] max-w-md" style={{ color: C.textSecondary }}>This module is being built. Check back soon.</p>
          <button
            onClick={() => navigate('/home')}
            className="mt-3 text-[13px] font-semibold px-5 py-2.5 rounded-xl cursor-pointer"
            style={{ color: C.brandFrom, background: C.systemBg, border: `1px solid ${C.systemBorder}` }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}