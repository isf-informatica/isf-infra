import { useNavigate } from 'react-router-dom'
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
  systemBg: '#EDF3FF',
  systemBorder: '#D8E6FF',
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