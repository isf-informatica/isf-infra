import useAuthStore from '../../store/authStore'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'

/* Same tokens as Dashboard.jsx — kept identical so every page in the app matches. */
const C = {
  bgApp: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E4E9F2',
  borderStrong: '#D8E0EC',
  textPrimary: '#101828',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  brandFrom: '#3B6FE0',
  brandTo: '#16B8A6',
  server: '#7C5CFC',
  systemBg: '#EDF3FF',
  systemBorder: '#D8E6FF',
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