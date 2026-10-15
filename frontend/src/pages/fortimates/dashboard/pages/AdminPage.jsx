import Reveal from '../../components/common/Reveal.jsx'
import AdminUsersTable from '../widgets/AdminUsersTable.jsx'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <p className="text-sm text-mist-400 max-w-2xl">
          Manage who can sign in to this dashboard and what they're allowed to do.
          This is separate from your own account settings in Configurations.
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <AdminUsersTable />
      </Reveal>
    </div>
  )
}
