import { useEffect, useState } from 'react'
import { getMdmReports } from '../../api/mdmOps'
import Topbar from '../../components/common/Topbar'

/* Same tokens as Login.jsx / MdmHub.jsx — kept identical so every page in the app matches. */
const INK = '#1A1A18'
const SUB = '#5C5C57'

const C = {
  bgApp: '#E8E8E3',
  surface: '#FFFFFF',
  border: INK + '1F',
  textPrimary: INK,
  textSecondary: SUB,
  brandFrom: INK,
  brandTo: '#3A3A36',
  systemBg: '#F2F2EE',
  success: '#17B26A',
  successBg: '#ECFDF5',
  danger: '#8A2A2A',
  dangerBg: '#FBEAE9',
  warning: '#8A6816',
  warningBg: '#FBF3E0',
}

export default function ReportsView() {
  const [rep, setRep] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMdmReports()
      .then(setRep)
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const t = rep?.totals || {}
  const stats = [
    { label: 'Institutions', icon: 'ti-building-community', value: t.institutions ?? 0, color: C.brandFrom, bg: C.systemBg, note: 'managed accounts' },
    { label: 'Devices', icon: 'ti-devices', value: t.devices ?? 0, color: C.brandFrom, bg: C.systemBg, note: `${t.windowsPcs ?? 0} Windows · ${t.androidDevices ?? 0} other` },
    { label: 'Online now', icon: 'ti-circle-check', value: t.online ?? 0, color: C.success, bg: C.successBg, note: `${t.offline ?? 0} offline` },
    { label: 'Policy compliance', icon: 'ti-shield-check', value: `${t.compliancePct ?? 0}%`, color: C.success, bg: C.successBg, note: `${t.policies ?? 0} policies · ${t.activeRollouts ?? 0} rolling out` },
    { label: 'Open violations', icon: 'ti-alert-triangle', value: t.openViolations ?? 0, color: C.danger, bg: C.dangerBg, note: `${t.appViolations ?? 0} app · ${t.browserBlocks ?? 0} web blocks` },
    { label: 'Remote wipes', icon: 'ti-eraser', value: t.wipes ?? 0, color: C.danger, bg: C.dangerBg, note: `${t.commands30d ?? 0} commands / 30d` },
    { label: 'Content delivered', icon: 'ti-send', value: t.contentDelivered ?? 0, color: C.brandFrom, bg: C.systemBg, note: `${t.contentPublications ?? 0} publications · ${t.openRatePct ?? 0}% opened` },
    { label: 'Managed apps', icon: 'ti-apps', value: t.managedApps ?? 0, color: C.warning, bg: C.warningBg, note: `${t.blockedApps ?? 0} blocked` },
  ]

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <style>{`
        .rv-card { transition: box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease; }
        .rv-card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px -12px rgba(16,24,40,0.16); }
      `}</style>
      <Topbar C={C} />
      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>

        <div className="flex-1 px-7 py-7 max-w-5xl">
          <h1 className="text-[20px] font-extrabold tracking-tight mb-1" style={{ color: C.textPrimary }}>Real-time reports</h1>
          <p className="text-[13px] mb-6" style={{ color: C.textSecondary }}>Institution status counts, updated live</p>

          {loading ? (
            <div className="flex items-center gap-2 py-10" style={{ color: C.textSecondary }}>
              <i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Loading…
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(({ label, icon, value, color, bg, note }) => (
                <div key={label} className="rv-card rounded-2xl p-5"
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[12px] font-medium" style={{ color: C.textSecondary }}>{label}</span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg, border: `1px solid ${color}33` }}>
                      <i className={`ti ${icon} text-[15px]`} style={{ color }} aria-hidden="true"></i>
                    </div>
                  </div>
                  <div className="text-[32px] font-semibold leading-none tabular-nums" style={{ color: C.textPrimary }}>{value}</div>
                  <div className="text-[11.5px] mt-2.5" style={{ color }}>{note}</div>
                </div>
              ))}
            </div>

            {/* Per-institution breakdown */}
            <div className="mt-7 rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="px-5 py-3.5 text-[13px] font-bold" style={{ color: C.textPrimary, borderBottom: `1px solid ${C.border}` }}>By institution</div>
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ color: C.textSecondary, background: C.systemBg }}>
                    <th className="text-left font-medium px-5 py-2.5">Institution</th>
                    <th className="text-right font-medium px-3 py-2.5">Devices</th>
                    <th className="text-right font-medium px-3 py-2.5">Online</th>
                    <th className="text-right font-medium px-3 py-2.5">Offline</th>
                    <th className="text-right font-medium px-3 py-2.5">Compliance</th>
                    <th className="text-right font-medium px-5 py-2.5">Open violations</th>
                  </tr>
                </thead>
                <tbody>
                  {(rep?.institutions || []).map(i => (
                    <tr key={i.id} style={{ borderTop: `1px solid ${C.border}`, color: C.textPrimary }}>
                      <td className="px-5 py-2.5 font-medium">{i.name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{i.devices}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: C.success }}>{i.online}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: C.textSecondary }}>{i.offline}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{i.compliancePct}%</td>
                      <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: i.violations ? C.danger : C.textSecondary }}>{i.violations}</td>
                    </tr>
                  ))}
                  {!(rep?.institutions || []).length && (
                    <tr><td colSpan={6} className="px-5 py-6 text-center" style={{ color: C.textSecondary }}>No institutions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Recent violations */}
            {!!(rep?.recentViolations || []).length && (
              <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="px-5 py-3.5 text-[13px] font-bold" style={{ color: C.textPrimary, borderBottom: `1px solid ${C.border}` }}>Recent violations</div>
                <div className="divide-y" style={{ borderColor: C.border }}>
                  {rep.recentViolations.map((v, idx) => (
                    <div key={idx} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="text-[12.5px] font-medium" style={{ color: C.textPrimary }}>{v.reason}</div>
                        <div className="text-[11.5px]" style={{ color: C.textSecondary }}>{v.device} · {v.school}</div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: v.severity === 'high' ? C.dangerBg : C.warningBg, color: v.severity === 'high' ? C.danger : C.warning }}>
                        {v.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </>
          )}

          <p className="text-[11px] mt-6" style={{ color: C.textSecondary }}>
            {rep?.generatedAt ? `Generated ${new Date(rep.generatedAt).toLocaleString('en-IN')}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}