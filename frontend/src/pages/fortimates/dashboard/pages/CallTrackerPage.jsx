import Reveal from '../../components/common/Reveal.jsx'
import CallTrackerTable from '../widgets/CallTrackerTable.jsx'

export default function CallTrackerPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <p className="text-sm text-mist-400 max-w-2xl">
          Every verification call, with outcome and recording where available.
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <CallTrackerTable />
      </Reveal>
    </div>
  )
}
