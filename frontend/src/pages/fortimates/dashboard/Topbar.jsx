import { ChevronDown, Menu } from 'lucide-react'
import { adminUser as fallbackUser } from '../data/mockData.js'
import useAuthStore from '../../../store/authStore'

export default function Topbar({ onMenuClick, title }) {
  // Show the logged-in EasyReach user's name (same login as the rest of ISF Infra)
  const auth = useAuthStore()
  const name = auth.user?.name ?? auth.name ?? fallbackUser.name
  const adminUser = { name, photo: fallbackUser.photo }

  return (
    <header className="sticky top-0 z-20 h-20 flex items-center justify-between gap-4 px-6 md:px-8 bg-abyss-950/90 backdrop-blur border-b border-white/5">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-mist-200" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <h1 className="text-lg md:text-xl font-display font-semibold text-mist-100">{title}</h1>
      </div>

      <div className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-white/5 transition-colors cursor-pointer clip-facet-r">
        <img
          src={adminUser.photo}
          alt={adminUser.name}
          className="w-9 h-9 object-cover clip-shield border border-white/10"
        />
        <span className="hidden sm:block text-sm text-mist-200 font-medium">{adminUser.name}</span>
        <ChevronDown size={15} className="text-mist-400" />
      </div>
    </header>
  )
}
