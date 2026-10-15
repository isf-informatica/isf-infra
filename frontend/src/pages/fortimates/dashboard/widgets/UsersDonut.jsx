import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useEffect, useState } from 'react'
import useOverview from '../../lib/useOverview.js'
import { apiGet } from '../../lib/api.js'

// one colour per mail type (Admin invite, …), in order
const PALETTE = ['#4FD6E8', '#F5AE0E', '#7BAAF7', '#EF476F', '#7C8CAF', '#3E4F73']

// fixed colours for inbox categories
const CATEGORY_COLORS = {
  Primary: '#4FD6E8',
  Social: '#7BAAF7',
  Promotional: '#7C8CAF',
  Updates: '#F5AE0E',
  Forums: '#3E4F73',
  Spams: '#EF476F'
}

export default function UsersDonut({ direction, refreshKey = 0 }) {
  // Home page (no direction): all mails from GET /fortimates/overview
  // Mail Tracker tab: GET /fortimates/mails/stats?direction=inbound|outbound
  const { data } = useOverview()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!direction) return
    apiGet(`/mails/stats?direction=${direction}`).then(setStats).catch(() => setStats(null))
  }, [direction, refreshKey])

  const source = direction ? stats?.split : data?.mail_split
  const mailSplit = (source ?? [])
    .filter((m) => m.value > 0)
    .map((m, i) => ({ ...m, color: CATEGORY_COLORS[m.name] ?? PALETTE[i % PALETTE.length] }))
  const total = direction ? stats?.total ?? 0 : data?.mail_total ?? 0
  const subtitle =
    direction === 'inbound' ? 'received in the mailbox' : direction === 'outbound' ? 'sent by FortiMates' : 'tracked'

  return (
    <div className="p-6 bg-facet-card border border-white/5 clip-facet-r h-full">
      <h3 className="text-sm font-semibold text-mist-100">Total Mails</h3>
      <p className="text-xs text-mist-400 mt-1 mb-4">{total} mail{total === 1 ? '' : 's'} {subtitle}
        {direction === 'inbound' && stats?.risk?.High ? (
          <span style={{ color: '#EF476F' }}> · {stats.risk.High} high risk</span>
        ) : null}
      </p>
      {total === 0 && (
        <p className="h-64 flex items-center justify-center text-sm text-mist-400">No mails yet.</p>
      )}
      <div className="h-64" style={{ display: total === 0 ? 'none' : undefined }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={mailSplit}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={3}
              animationDuration={1000}
            >
              {mailSplit.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} mail${value === 1 ? '' : 's'}`, name]}
              contentStyle={{
                background: '#0A1730',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 12
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, color: '#AAB8D6' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}