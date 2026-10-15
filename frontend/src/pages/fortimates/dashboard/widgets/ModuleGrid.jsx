import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { motion } from 'framer-motion'
import { dashboardModules } from '../../data/mockData.js'

const toneClasses = {
  signal: 'from-signal-500/20 to-signal-600/5 text-signal-400 group-hover:border-signal-400/40',
  amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 group-hover:border-amber-400/40'
}

export default function ModuleGrid() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-mist-100 mb-4">Modules</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {dashboardModules.map((mod, i) => {
          const Icon = Icons[mod.icon] ?? Icons.LayoutGrid
          return (
            <motion.div
              key={mod.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link
                to={mod.to}
                className={`group flex flex-col items-center justify-center gap-3 p-5 h-32 text-center bg-gradient-to-b ${toneClasses[mod.tone]} border border-white/5 clip-facet-r transition-colors`}
              >
                <Icon size={22} />
                <span className="text-xs font-medium text-mist-200">{mod.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
