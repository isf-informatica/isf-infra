import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { killSchool, restoreSchool } from '../../api/kill'

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
  success: '#17B26A',
  successBg: '#ECFDF5',
  successBorder: '#A7E9C8',
  danger: '#E4483C',
  dangerBg: '#FEF1F0',
  dangerBorder: '#FBD5D2',
  warning: '#F79420',
  warningBg: '#FFF7EB',
  warningBorder: '#FDDDA8',
}

export default function KillSwitch() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeLevel, setActiveLevel] = useState(null)
  const [reason, setReason] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const levels = [
    {
      level: 1, name: 'Soft lock', icon: 'ti-alert-triangle', color: C.warning, bg: C.warningBg, border: C.warningBorder,
      description: 'Stop AWS sync. No new content arrives. Existing content still accessible.',
      impact: 'Low impact — students can still view existing content',
      actions: ['Disable AWS sync task', 'Disable MediaStorage sync task'],
    },
    {
      level: 2, name: 'Data lock', icon: 'ti-lock', color: '#D9720A', bg: '#FFF3E8', border: '#FBD9AE',
      description: 'Backup media, then delete all local files. Content becomes inaccessible.',
      impact: 'High impact — all media gone, ERP site still up',
      actions: ['Backup MediaStorage → AWS S3', 'Delete all local files', 'Nginx returns 503'],
    },
    {
      level: 3, name: 'Nuclear', icon: 'ti-alert-octagon', color: C.danger, bg: C.dangerBg, border: C.dangerBorder,
      description: 'Full wipe. Database dropped, all files deleted, server offline.',
      impact: 'Critical — ERP + media completely offline',
      actions: ['Full DB dump → AWS S3', 'Drop all EasyLearn tables', 'Delete all media', 'Stop Nginx'],
    },
  ]

  const handleKill = async (level) => {
    setLoading(true); setError(''); setSuccess('')
    try {
      await killSchool(id, level, reason, level === 3 ? confirmCode : null)
      setSuccess(`Level ${level} kill activated. Command queued for school agent.`)
      setActiveLevel(null); setReason(''); setConfirmCode('')
    } catch (err) { setError(err.response?.data?.detail || 'Command failed') }
    finally { setLoading(false) }
  }

  const handleRestore = async (level) => {
    setLoading(true); setError(''); setSuccess('')
    try {
      await restoreSchool(id, level)
      setSuccess(`Level ${level} restore initiated.`)
    } catch (err) { setError(err.response?.data?.detail || 'Restore failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      {/* Topbar */}
      <div className="flex items-center gap-4 px-7 py-4" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate(`/schools/${id}`)}
          className="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer bg-transparent border-none"
          style={{ color: C.textSecondary }}>
          <i className="ti ti-arrow-left text-sm" aria-hidden="true"></i> Back
        </button>
        <div className="w-px h-5" style={{ background: C.border }} />
        <div>
          <div className="text-[14.5px] font-semibold" style={{ color: C.textPrimary }}>Kill switch</div>
          <div className="text-[12px]" style={{ color: C.textSecondary }}>Institution ID: {id} — all actions are logged</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto py-9 px-6">
        {/* Warning */}
        <div className="flex items-start gap-3.5 px-5 py-4 rounded-2xl mb-6" style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.surface }}>
            <i className="ti ti-alert-triangle text-base" style={{ color: C.danger }} aria-hidden="true"></i>
          </div>
          <div>
            <div className="text-[13.5px] font-semibold" style={{ color: C.danger }}>Danger zone</div>
            <div className="text-[12px] mt-1" style={{ color: '#B94842' }}>These commands execute on the live server. Every action is timestamped and attributed to your account.</div>
          </div>
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-[13px] font-medium" style={{ background: C.successBg, border: `1px solid ${C.successBorder}`, color: C.success }}>
            <i className="ti ti-circle-check" aria-hidden="true"></i> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-[13px] font-medium" style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.danger }}>
            <i className="ti ti-x" aria-hidden="true"></i> {error}
          </div>
        )}

        <div className="space-y-4">
          {levels.map(({ level, name, icon, color, bg, border, description, impact, actions }) => {
            const isActive = activeLevel === level
            return (
              <div key={level} className="rounded-2xl overflow-hidden transition-all"
                style={{ background: bg, border: `1px solid ${border}`, boxShadow: isActive ? '0 8px 24px -8px rgba(16,24,40,0.14)' : 'none' }}>
                <div className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.surface, border: `1px solid ${border}` }}>
                      <i className={`ti ${icon} text-lg`} style={{ color }} aria-hidden="true"></i>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>Level {level}</span>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: C.surface, border: `1px solid ${border}`, color }}>{name}</span>
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: C.textSecondary }}>{description}</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveLevel(isActive ? null : level)}
                    className="text-[12px] font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all shrink-0"
                    style={{ background: C.surface, border: `1px solid ${border}`, color }}>
                    {isActive ? 'Collapse' : 'Expand'}
                  </button>
                </div>

                {/* Impact + action pills */}
                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  <span className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ background: C.surface, border: `1px solid ${border}`, color }}>{impact}</span>
                  {actions.map(a => (
                    <span key={a} className="text-[11px] font-mono px-3 py-1 rounded-full" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textSecondary }}>{a}</span>
                  ))}
                </div>

                {/* Expanded form */}
                {isActive && (
                  <div className="px-5 pb-5 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.6)' }}>
                    <div className="pt-4 space-y-4">
                      <div>
                        <label className="block text-[12px] font-medium mb-1.5" style={{ color: C.textSecondary }}>Reason *</label>
                        <input value={reason} onChange={e => setReason(e.target.value)}
                          placeholder="e.g. Contract expired — payment overdue"
                          className="w-full rounded-xl px-4 py-2.5 text-[13px] outline-none"
                          style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                      </div>

                      {level === 3 && (
                        <div>
                          <label className="block text-[12px] font-medium mb-1.5" style={{ color: C.danger }}>
                            Type <code className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: C.dangerBg, color: C.danger }}>CONFIRM WIPE {id}</code> to unlock
                          </label>
                          <input value={confirmCode} onChange={e => setConfirmCode(e.target.value)}
                            placeholder={`CONFIRM WIPE ${id}`}
                            className="w-full rounded-xl px-4 py-2.5 text-[13px] outline-none font-mono"
                            style={{ border: `1px solid ${C.dangerBorder}`, background: C.surface, color: C.danger }} />
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleKill(level)}
                          disabled={loading || !reason || (level === 3 && confirmCode !== `CONFIRM WIPE ${id}`)}
                          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border-none cursor-pointer disabled:opacity-40 text-white shadow-sm"
                          style={{ background: color }}>
                          <i className="ti ti-bolt text-[13px] mr-1" aria-hidden="true"></i>
                          {loading ? 'Executing…' : `Activate Level ${level}`}
                        </button>
                        <button onClick={() => handleRestore(level)}
                          disabled={loading}
                          className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white border-none cursor-pointer disabled:opacity-40 shadow-sm"
                          style={{ background: C.success }}>
                          <i className="ti ti-rotate text-[13px] mr-1" aria-hidden="true"></i>
                          {loading ? 'Processing…' : `Restore Level ${level}`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}