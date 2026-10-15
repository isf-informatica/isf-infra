import { FM_DASH } from '../config.js'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

const titles = {
  [FM_DASH]: 'Home',
  [`${FM_DASH}/kyc-module`]: 'KYC Module',
  [`${FM_DASH}/kyc-list`]: 'KYC List',
  [`${FM_DASH}/requests`]: 'Requests',
  [`${FM_DASH}/mail-tracker`]: 'Mail Tracker',
  [`${FM_DASH}/call-tracker`]: 'Call Tracker',
  [`${FM_DASH}/admin`]: 'Admin',
  [`${FM_DASH}/configurations`]: 'Configurations'
}

export default function DashboardLayout({ children }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const title = titles[location.pathname] ?? 'Dashboard'

  return (
    <div className="min-h-screen bg-abyss-950 flex">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar onMenuClick={() => setOpen(true)} title={title} />
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
