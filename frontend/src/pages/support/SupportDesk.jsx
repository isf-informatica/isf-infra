import Sidebar from '../../components/common/Sidebar'
import useAuthStore from '../../store/authStore'
import Topbar from '../../components/common/Topbar'
import { INK, SUB, LINE, BG, NotifyHost } from './supportShared'
import RequesterView from './RequesterView'
import AdminView from './AdminView'
import MasterView from './MasterView'
import StaffView from './StaffView'

/* Tokens the shared <Topbar /> and <Sidebar /> expect (same values as Home.jsx) */
const C = {
  surface: '#FFFFFF',
  border: LINE,
  textPrimary: INK,
  textSecondary: SUB,
  textMuted: '#8A8A85',
  systemBg: '#F2F2EE',
  brandFrom: INK,
  brandTo: '#3A3A36',
  server: '#4A4A46',
}

/* Picks the Service Desk screen from the logged-in role:
     requester    -> RequesterView (raise + my requests)
     service_desk -> StaffView     (assigned tasks, mark complete)
     admin        -> AdminView     (All Departments: assign, verify, manage staff)
     master       -> MasterView    (read-only overview of every department) */
function RoleContent({ role }) {
  if (role === 'requester') return <RequesterView />
  if (role === 'service_desk') return <StaffView />
  if (role === 'admin') return <AdminView />
  if (role === 'master') return <MasterView />
  return (
    <div className="max-w-4xl bg-white border py-12 text-center text-[13px]" style={{ borderColor: LINE, color: SUB }}>
      Aapko Service Desk ka access nahi hai.
    </div>
  )
}

export default function SupportDesk() {
  const auth = useAuthStore()
  const role = auth.user?.role ?? auth.role
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: BG }}>
      <NotifyHost />

      <Topbar C={C} />

      <div className="flex flex-1 items-stretch">
        <Sidebar C={C} activeKey="support" />
        <main className="flex-1 min-w-0 px-6 py-8 lg:px-10">
          <RoleContent role={role} />
        </main>
      </div>
    </div>
  )
}