import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import useOverview from '../../lib/useOverview.js'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-abyss-950 border border-white/10 px-4 py-3 text-xs clip-facet-r">
      <p className="text-mist-300 mb-1">{label}</p>
      <p className="text-signal-400">This week: {payload[0]?.value}</p>
      <p className="text-mist-400">Last week: {payload[1]?.value}</p>
    </div>
  )
}

export default function RegistrationsChart() {
  // Last 7 days vs same weekdays last week — GET /fortimates/overview
  const { data } = useOverview()
  const registrationSeries = data?.registrations ?? []

  return (
    <div className="p-6 bg-facet-card border border-white/5 clip-facet h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-mist-100">Registrations</h3>
        <span className="text-xs text-mist-400">This week vs. last week</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={registrationSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4FD6E8" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#4FD6E8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="flagGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C8CAF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#7C8CAF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" stroke="#7C8CAF" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#7C8CAF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="today"
              stroke="#4FD6E8"
              strokeWidth={2}
              fill="url(#regGradient)"
              animationDuration={1200}
            />
            <Area
              type="monotone"
              dataKey="yesterday"
              stroke="#7C8CAF"
              strokeWidth={2}
              fill="url(#flagGradient)"
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
