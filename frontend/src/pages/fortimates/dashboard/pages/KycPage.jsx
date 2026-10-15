import Reveal from '../../components/common/Reveal.jsx'
import KycList from '../widgets/KycList.jsx'

export default function KycPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <p className="text-sm text-mist-400 max-w-2xl">
          Identity documents and linked bank details for every user who has
          completed verification.
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <KycList />
      </Reveal>
    </div>
  )
}
