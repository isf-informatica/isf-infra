import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSchool, getSchoolLogs, generateConfig } from '../../api/schools'

const C = {
  bgApp: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E4E9F2',
  textPrimary: '#101828',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  brandFrom: '#3B6FE0',
  brandTo: '#16B8A6',
  systemBg: '#EDF3FF',
  systemBorder: '#D8E6FF',
  success: '#17B26A',
  successBg: '#ECFDF5',
  successBorder: '#A7E9C8',
  danger: '#E4483C',
  dangerBg: '#FEF1F0',
  dangerBorder: '#FBD5D2',
  warning: '#D9720A',
  warningBg: '#FFF7EB',
  warningBorder: '#FDDDA8',
}

const logMeta = (type) => {
  const map = {
    kill: { color: C.danger, bg: C.dangerBg },
    restore: { color: C.success, bg: C.successBg },
    error: { color: C.warning, bg: C.warningBg },
    command: { color: C.brandFrom, bg: C.systemBg },
    info: { color: C.textSecondary, bg: C.surfaceAlt },
  }
  return map[type] || map.info
}

export default function SchoolDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [school, setSchool] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    try {
      const [schoolData, logsData] = await Promise.all([getSchool(id), getSchoolLogs(id)])
      setSchool(schoolData); setLogs(logsData)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDownloadConfig = async () => {
    try {
      const blob = await generateConfig(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `easyreach_${school.code}_setup.zip`
      a.click(); window.URL.revokeObjectURL(url)
    } catch { alert('Failed to generate config') }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: C.bgApp }}>
      <i className="ti ti-loader-2 animate-spin text-2xl" style={{ color: C.brandFrom }} aria-hidden="true"></i>
      <div className="text-[13px]" style={{ color: C.textSecondary }}>Loading…</div>
    </div>
  )
  if (!school) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bgApp }}>
      <div className="text-[13px]" style={{ color: C.textSecondary }}>School not found</div>
    </div>
  )

  const status = typeof school.status === 'string' ? school.status : 'pending'
  const statusMeta = {
    active: { color: C.success, bg: C.successBg, border: C.successBorder },
    killed: { color: C.danger, bg: C.dangerBg, border: C.dangerBorder },
    pending: { color: C.warning, bg: C.warningBg, border: C.warningBorder },
  }
  const sm = statusMeta[status] || statusMeta.pending

  return (
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      {/* Topbar */}
      <div className="flex items-center justify-between px-7 py-4" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer bg-transparent border-none" style={{ color: C.textSecondary }}>
            <i className="ti ti-arrow-left text-sm" aria-hidden="true"></i> Back
          </button>
          <div className="w-px h-5" style={{ background: C.border }} />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-semibold text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
              {school.name?.[0]}
            </div>
            <div>
              <div className="text-[14.5px] font-semibold" style={{ color: C.textPrimary }}>{school.name}</div>
              <div className="text-[11.5px] font-mono" style={{ color: C.textMuted }}>{school.code}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/schools/${id}/devices`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold cursor-pointer"
            style={{ color: C.textSecondary, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
            <i className="ti ti-device-desktop text-sm" aria-hidden="true"></i> Devices
          </button>
          <button onClick={handleDownloadConfig}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold cursor-pointer"
            style={{ color: C.brandFrom, background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
            <i className="ti ti-download text-sm" aria-hidden="true"></i> Config ZIP
          </button>
          <button onClick={() => navigate(`/schools/${id}/kill`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold cursor-pointer"
            style={{ color: C.danger, background: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
            <i className="ti ti-bolt-off text-sm" aria-hidden="true"></i> Kill switch
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-7 px-6">
        {/* Status cards */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          {[
            { label: 'Status', content: <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.border}` }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: sm.color }}></span>{status}</span>, icon: 'ti-activity' },
            { label: 'Kill level', content: <span className="text-[16px] font-semibold" style={{ color: C.textPrimary }}>Level {school.kill_level || 0}</span>, icon: 'ti-bolt-off' },
            { label: 'Nginx port', content: <span className="text-[16px] font-semibold font-mono" style={{ color: C.brandFrom }}>:{school.nginx_port}</span>, icon: 'ti-plug' },
            { label: 'Sync interval', content: <span className="text-[16px] font-semibold" style={{ color: C.textPrimary }}>{school.sync_interval_min} min</span>, icon: 'ti-refresh' },
          ].map(({ label, content, icon }) => (
            <div key={label} className="rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <i className={`ti ${icon} text-[12px]`} style={{ color: C.textMuted }} aria-hidden="true"></i>
                <span className="text-[11.5px] font-medium" style={{ color: C.textSecondary }}>{label}</span>
              </div>
              {content}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          {['overview', 'logs'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="text-[13px] px-5 py-2 rounded-lg capitalize font-semibold transition-all border-none cursor-pointer"
              style={activeTab === tab
                ? { background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})`, color: '#fff' }
                : { color: C.textSecondary, background: 'transparent' }}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="rounded-2xl p-7" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 4px 24px -8px rgba(16,24,40,0.06)' }}>
            <div className="text-[14.5px] font-semibold mb-5" style={{ color: C.textPrimary }}>Deployment details</div>
            <div className="grid grid-cols-2 gap-x-10">
              {[
                ['Institution name', school.name],
                ['Code', school.code],
                ['Type', school.institution_type || 'school'],
                ['Contact', school.contact_name],
                ['Email', school.contact_email],
                ['ERP domain', school.erp_domain],
                ['Storage domain', school.storage_domain],
                ['Public IP', school.public_ip],
                ['LAN IP', school.lan_ip],
                ['Storage path', school.storage_path],
                ['DB name', school.db_name],
                ['HTTPS port', school.https_port],
                ['SSL thumbprint', school.ssl_thumbprint ? school.ssl_thumbprint.slice(0, 16) + '…' : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <span className="text-[12px]" style={{ color: C.textSecondary }}>{label}</span>
                  <span className="text-[12.5px] font-medium text-right max-w-xs truncate font-mono" style={{ color: C.textPrimary }}>{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="rounded-2xl p-7" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 4px 24px -8px rgba(16,24,40,0.06)' }}>
            <div className="text-[14.5px] font-semibold mb-5" style={{ color: C.textPrimary }}>Activity log</div>
            {logs.length === 0 ? (
              <div className="text-center py-14">
                <i className="ti ti-history text-2xl mb-2" style={{ color: C.textMuted }} aria-hidden="true"></i>
                <div className="text-[13px]" style={{ color: C.textMuted }}>No activity yet</div>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map(log => {
                  const lm = logMeta(log.log_type)
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-3.5 rounded-xl" style={{ background: lm.bg, border: `1px solid ${C.border}` }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: lm.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px]" style={{ color: C.textPrimary }}>{log.message}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>{new Date(log.created_at).toLocaleString()}</div>
                      </div>
                      <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-lg shrink-0" style={{ background: C.surface, border: `1px solid ${C.border}`, color: lm.color }}>
                        {log.log_type}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}