import Reveal from '../../components/common/Reveal.jsx'
import RequestsTable from '../widgets/RequestsTable.jsx'

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <p className="text-sm text-mist-400 max-w-2xl">
          Every incoming registration lands here first. Filter by verification type
          to triage passport, non-passport and corporate requests separately.
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <RequestsTable />
      </Reveal>
    </div>
  )
}
