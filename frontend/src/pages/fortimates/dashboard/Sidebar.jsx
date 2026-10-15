import { FM_DASH, FM_EXIT_PATH } from '../config.js'
import { useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  Home,
  Inbox,
  FileCheck2,
  MailSearch,
  Phone,
  UserCog,
  SlidersHorizontal,
  LogOut,
  ChevronDown
} from 'lucide-react'
import BrandLogo from '../assets/BrandLogo.jsx'

const navItems = [
  { to: FM_DASH, label: 'Home', icon: Home, end: true },
  {
    label: 'KYC',
    icon: FileCheck2,
    children: [
      { to: `${FM_DASH}/kyc-module`, label: 'KYC Module' },
      { to: `${FM_DASH}/kyc-list`, label: 'KYC List' }
    ]
  },
  { to: `${FM_DASH}/requests`, label: 'Requests', icon: Inbox },
  { to: `${FM_DASH}/mail-tracker`, label: 'Mail Tracker', icon: MailSearch },
  { to: `${FM_DASH}/call-tracker`, label: 'Call Tracker', icon: Phone },
  { to: `${FM_DASH}/admin`, label: 'Admin', icon: UserCog },
  { to: `${FM_DASH}/configurations`, label: 'Configurations', icon: SlidersHorizontal }
]

export default function Sidebar({ open, onClose }) {
  const location = useLocation()

  const [openGroup, setOpenGroup] = useState(() => {
    const match = navItems.find(
      (item) => item.children?.some((c) => location.pathname.startsWith(c.to))
    )
    return match?.label ?? null
  })

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-abyss-900 border-r border-white/5 z-40 transition-transform duration-300 flex flex-col
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <BrandLogo variant="full" className="h-8 w-auto" />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon

            if (!item.children) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.8 text-sm transition-colors clip-facet-r ${
                      isActive
                        ? 'bg-signal-500/10 text-signal-400 border-l-2 border-signal-400'
                        : 'text-mist-300 hover:bg-white/5 hover:text-mist-100 border-l-2 border-transparent'
                    }`
                  }
                  style={{ paddingTop: '0.7rem', paddingBottom: '0.7rem' }}
                >
                  <Icon size={17} />
                  {item.label}
                </NavLink>
              )
            }

            const isOpen = openGroup === item.label
            const isChildActive = item.children.some((c) =>
              location.pathname.startsWith(c.to)
            )

            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setOpenGroup(isOpen ? null : item.label)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.8 text-sm transition-colors clip-facet-r border-l-2 ${
                    isChildActive
                      ? 'bg-signal-500/10 text-signal-400 border-signal-400'
                      : 'text-mist-300 hover:bg-white/5 hover:text-mist-100 border-transparent'
                  }`}
                  style={{ paddingTop: '0.7rem', paddingBottom: '0.7rem' }}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={17} />
                    {item.label}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-40 mt-1' : 'max-h-0'
                  }`}
                >
                  <div className="pl-11 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `block px-3 py-2 text-sm transition-colors clip-facet-r ${
                            isActive
                              ? 'text-signal-400 bg-signal-500/5'
                              : 'text-mist-400 hover:text-mist-100 hover:bg-white/5'
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          {/* Integrated into EasyReach: go back to the ISF Infra home instead of the marketing site */}
          <Link
            to={FM_EXIT_PATH}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-mist-400 hover:text-amber-400 transition-colors"
          >
            <LogOut size={17} />
            Back to ISF Infra
          </Link>
        </div>
      </aside>
    </>
  )
}
