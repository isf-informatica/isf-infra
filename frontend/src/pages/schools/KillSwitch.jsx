import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { killSchool, restoreSchool } from '../../api/kill'

const INK = '#1A1A18'
const SUB = '#5C5C57'
const MUTED = '#8A8A85'

const C = {
  bgApp: '#E8E8E3',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F2EE',
  border: INK + '1F',
  textPrimary: INK,
  textSecondary: SUB,
  textMuted: MUTED,
  brandFrom: INK,
  brandTo: '#3A3A36',
  success: '#17B26A',
  successBg: '#ECFDF5',
  successBorder: '#A7E9C8',
  danger: '#8A2A2A',
  dangerBg: '#FBEAE9',
  dangerBorder: '#EFC4C1',
  warning: '#8A6816',
  warningBg: '#FBF3E0',
  warningBorder: '#E7D39C',
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
      impact: 'Students can still view existing content',
      actions: ['Disable AWS sync task', 'Disable MediaStorage sync task'],
    },
    {
      level: 2, name: 'Data lock', icon: 'ti-lock', color: '#B25A00', bg: '#FFF3E8', border: '#FBD9AE',
      description: 'Backup media, then delete all local files. Content becomes inaccessible.',
      impact: 'All media gone — ERP site stays up',
      actions: ['Backup MediaStorage → AWS S3', 'Delete all local files', 'Nginx returns 503'],
    },
    {
      level: 3, name: 'Nuclear', icon: 'ti-alert-octagon', color: C.danger, bg: C.dangerBg, border: C.dangerBorder,
      description: 'Full wipe. Database dropped, all files deleted, server offline.',
      impact: 'ERP and media completely offline',
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
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <style>{`
        @keyframes killswitch-expand { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .ks-panel { animation: killswitch-expand 180ms ease-out; }
        .ks-card { transition: box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease; }
        .ks-card:hover { transform: translateY(-1px); }
        .ks-btn { transition: filter 120ms ease, transform 120ms ease; }
        .ks-btn:active:not(:disabled) { transform: scale(0.98); }
        .ks-btn:hover:not(:disabled) { filter: brightness(1.06); }
        .ks-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(26,26,24,0.08); }
        .ks-seg { transition: background 160ms ease; }
      `}</style>

      {/* Topbar */}
      <div className="flex items-center gap-4 px-7 py-4" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer bg-transparent border-none"
          style={{ color: C.textSecondary }}>
          <i className="ti ti-arrow-left text-sm" aria-hidden="true"></i> Back
        </button>
        <div className="w-px h-5" style={{ background: C.border }} />
        <div>
          <div className="text-[14.5px] font-extrabold tracking-tight" style={{ color: C.textPrimary }}>Kill switch</div>
          <div className="text-[12px]" style={{ color: C.textSecondary }}>Institution ID: {id} — every action is logged and attributed</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-9 px-6 md:px-10 lg:px-14">
        {/* Warning */}
        <div className="flex items-start gap-3.5 px-5 md:px-6 py-4 rounded-2xl mb-6" style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.surface }}>
            <i className="ti ti-alert-triangle text-base" style={{ color: C.danger }} aria-hidden="true"></i>
          </div>
          <div>
            <div className="text-[13.5px] font-semibold" style={{ color: C.danger }}>Danger zone</div>
            <div className="text-[12px] mt-1" style={{ color: '#B94842' }}>These commands execute on the live server. There is no undo button — restore runs a separate, manual recovery.</div>
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
              <div key={level} className="ks-card rounded-2xl overflow-hidden"
                style={{
                  background: C.surface,
                  border: `1px solid ${isActive ? color : C.border}`,
                  borderLeft: `4px solid ${color}`,
                  boxShadow: isActive ? '0 10px 28px -10px rgba(16,24,40,0.18)' : '0 1px 2px rgba(16,24,40,0.04)',
                }}>
                <button
                  onClick={() => setActiveLevel(isActive ? null : level)}
                  className="w-full text-left px-5 md:px-6 py-4 flex items-center justify-between gap-3 cursor-pointer bg-transparent border-none"
                  aria-expanded={isActive}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg, border: `1px solid ${border}` }}>
                      <i className={`ti ${icon} text-lg`} style={{ color }} aria-hidden="true"></i>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>{name}</span>
                        {/* severity meter — reads escalation at a glance */}
                        <div className="flex items-center gap-0.5" role="img" aria-label={`Severity ${level} of 3`}>
                          {[1, 2, 3].map(seg => (
                            <span key={seg} className="ks-seg block rounded-full"
                              style={{ width: 12, height: 4, background: seg <= level ? color : C.border }} />
                          ))}
                        </div>
                      </div>
                      <div className="text-[12px] mt-1" style={{ color: C.textSecondary }}>{description}</div>
                    </div>
                  </div>
                  <i className="ti ti-chevron-down text-base shrink-0" aria-hidden="true"
                    style={{ color: C.textMuted, transform: isActive ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}></i>
                </button>

                {/* Impact + action pills */}
                <div className="px-5 md:px-6 pb-4 flex flex-wrap gap-2">
                  <span className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ background: bg, border: `1px solid ${border}`, color }}>{impact}</span>
                  {actions.map(a => (
                    <span key={a} className="text-[11px] font-mono px-3 py-1 rounded-full" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textSecondary }}>{a}</span>
                  ))}
                </div>

                {/* Expanded form */}
                {isActive && (
                  <div className="ks-panel px-5 md:px-6 pb-5 pt-4" style={{ background: bg, borderTop: `1px solid ${border}` }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[12px] font-medium mb-1.5" style={{ color: C.textSecondary }}>Reason *</label>
                        <input value={reason} onChange={e => setReason(e.target.value)}
                          placeholder="e.g. Contract expired — payment overdue"
                          className="ks-input w-full rounded-xl px-4 py-2.5 text-[13px]"
                          style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                      </div>

                      {level === 3 && (
                        <div>
                          <label className="block text-[12px] font-medium mb-1.5" style={{ color: C.danger }}>
                            Type <code className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: C.surface, color: C.danger }}>CONFIRM WIPE {id}</code> to unlock
                          </label>
                          <input value={confirmCode} onChange={e => setConfirmCode(e.target.value)}
                            placeholder={`CONFIRM WIPE ${id}`}
                            className="ks-input w-full rounded-xl px-4 py-2.5 text-[13px] font-mono"
                            style={{ border: `1px solid ${C.dangerBorder}`, background: C.surface, color: C.danger }} />
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleKill(level)}
                          disabled={loading || !reason || (level === 3 && confirmCode !== `CONFIRM WIPE ${id}`)}
                          className="ks-btn flex-[1.4] py-2.5 rounded-xl text-[13px] font-semibold border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm"
                          style={{ background: color }}>
                          <i className="ti ti-bolt text-[13px] mr-1" aria-hidden="true"></i>
                          {loading ? 'Executing…' : `Activate Level ${level}`}
                        </button>
                        <button onClick={() => handleRestore(level)}
                          disabled={loading}
                          className="ks-btn flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: C.surface, border: `1px solid ${C.success}`, color: C.success }}>
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