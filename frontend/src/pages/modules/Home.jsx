import useAuthStore from '../../store/authStore'
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

export default function Home() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      <Topbar C={C} />

      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        {/* No module active on the home page — none of the 4 items highlighted */}
        <Sidebar C={C} activeKey={null} />

        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: C.brandFrom }}>ISF Infra</p>
          <h1 className="text-[26px] font-semibold" style={{ color: C.textPrimary }}>
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-[13.5px] max-w-md" style={{ color: C.textSecondary }}>
            Pick a module from the left to get started.
          </p>
        </div>
      </div>
    </div>
  )
}