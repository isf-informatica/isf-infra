import { motion } from 'framer-motion'
import AnimatedCounter from '../../components/common/AnimatedCounter.jsx'
import useOverview from '../../lib/useOverview.js'

// Live numbers from GET /fortimates/overview
function buildBlocks(users) {
  const u = users ?? { with_passport: 0, without_passport: 0, corporate: 0, total: 0 }
  const totalK = u.total >= 1000
  return [
    { label: 'With Passport', value: u.with_passport, suffix: '%', tone: 'amber' },
    { label: 'Without Passport', value: u.without_passport, suffix: '%', tone: 'navy' },
    { label: 'Corporate', value: u.corporate, suffix: '%', tone: 'navy' },
    { label: 'Total Users', value: totalK ? u.total / 1000 : u.total, suffix: totalK ? 'K' : '', decimals: totalK ? 1 : 0, tone: 'amber' }
  ]
}

const toneClasses = {
  amber: 'bg-gradient-to-br from-amber-500 to-amber-600 text-abyss-950',
  navy: 'bg-gradient-to-br from-abyss-700 to-abyss-800 text-mist-100'
}

export default function UsersPanel() {
  const { data, error } = useOverview()
  const blocks = buildBlocks(data?.users)

  return (
    <div className="p-6 bg-facet-card border border-white/5 clip-facet h-full">
      <h3 className="text-sm font-semibold text-mist-100 mb-4">Users</h3>
      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        {blocks.map((b, i) => (
          <motion.div
            key={b.label}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.05 }}
            className={`px-4 py-6 text-center clip-facet-r ${toneClasses[b.tone]}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide opacity-80">{b.label}</p>
            <p className="mt-2 text-2xl font-display font-bold">
              <AnimatedCounter value={b.value} suffix={b.suffix} decimals={b.decimals ?? 0} />
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
