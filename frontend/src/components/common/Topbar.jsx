import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/* Shared topbar used by Dashboard, Home, and ComingSoon — pass the same `C`
   tokens object each page already defines so colors stay identical everywhere. */
export default function Topbar({ C }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between px-7 py-4" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
          <i className="ti ti-server-2 text-white text-lg" aria-hidden="true"></i>
        </div>
        <div>
          <div className="text-[14.5px] font-semibold" style={{ color: C.textPrimary }}>EasyReach</div>
          <div className="text-[12px]" style={{ color: C.textSecondary }}>ISF Media Server Control</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${C.server || '#7C5CFC'}, #A78BFA)` }}>
          {user?.name?.[0]}
        </div>
        <span className="text-[13.5px] font-medium" style={{ color: C.textPrimary }}>{user?.name}</span>
        <button onClick={() => { logout(); navigate('/login') }}
          className="text-[12.5px] font-medium px-3.5 py-1.5 rounded-full cursor-pointer border"
          style={{ color: '#E4483C', background: '#FEF1F0', borderColor: '#FBD5D2' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}