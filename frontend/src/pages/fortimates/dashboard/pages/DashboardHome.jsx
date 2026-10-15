import Reveal from '../../components/common/Reveal.jsx'
import ModuleGrid from '../widgets/ModuleGrid.jsx'
import UsersPanel from '../widgets/UsersPanel.jsx'
import MailsTable from '../widgets/MailsTable.jsx'
import RegistrationsChart from '../widgets/RegistrationsChart.jsx'
import UsersDonut from '../widgets/UsersDonut.jsx'

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <Reveal>
        <ModuleGrid />
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid lg:grid-cols-2 gap-5 items-stretch">
          <UsersPanel />
          <MailsTable />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="grid lg:grid-cols-2 gap-5">
          <RegistrationsChart />
          <UsersDonut />
        </div>
      </Reveal>
    </div>
  )
}
