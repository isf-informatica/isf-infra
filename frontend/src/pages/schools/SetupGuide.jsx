import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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
  server: '#7C5CFC',
  serverBg: '#F5F2FF',
  serverBorder: '#E4DCFF',
  warning: '#D9720A',
  warningBg: '#FFF7EB',
  warningBorder: '#FDDDA8',
  navy: '#0E1526',
}

const steps = [
  {
    id: 1,
    title: 'Extract the ZIP file',
    icon: 'ti-file-zip',
    color: C.brandFrom, bg: C.systemBg, border: C.systemBorder,
    desc: 'Extract the downloaded ZIP on the school/college server PC.',
    commands: [],
    notes: ['Right click ZIP → Extract All', 'You will get: nginx.conf, sync_aws.bat, backup.bat, install_agent.ps1, README.txt'],
  },
  {
    id: 2,
    title: 'Copy Nginx config',
    icon: 'ti-file-settings',
    color: C.success, bg: C.successBg, border: C.successBorder,
    desc: 'Copy nginx.conf to the Nginx installation folder.',
    commands: ['copy nginx.conf D:\\nginx\\conf\\nginx.conf'],
    notes: ['If D:\\nginx does not exist, install Nginx first (nginx-1.26.2)', 'Backup old nginx.conf before replacing'],
  },
  {
    id: 3,
    title: 'Copy sync & backup scripts',
    icon: 'ti-refresh',
    color: C.server, bg: C.serverBg, border: C.serverBorder,
    desc: 'Copy the sync and backup batch files to their locations.',
    commands: [
      'copy sync_aws.bat D:\\MediaStorage\\sync_aws.bat',
      'copy backup.bat D:\\MinIO\\backup.bat',
    ],
    notes: ['Create D:\\MediaStorage if it does not exist: mkdir D:\\MediaStorage', 'rclone must already be configured with AWS credentials'],
  },
  {
    id: 4,
    title: 'Run install_agent.ps1',
    icon: 'ti-terminal-2',
    color: C.warning, bg: C.warningBg, border: C.warningBorder,
    desc: 'Run the installer as Administrator — this sets up the EasyReach agent.',
    commands: ['PowerShell -ExecutionPolicy Bypass -File install_agent.ps1'],
    notes: ['Right click PowerShell → Run as Administrator', 'Agent installs to D:\\EasyReachAgent\\', 'Saves school token + central API URL automatically'],
  },
  {
    id: 5,
    title: 'Start Nginx',
    icon: 'ti-player-play',
    color: C.success, bg: C.successBg, border: C.successBorder,
    desc: 'Start Nginx to begin serving media files.',
    commands: ['D:\\nginx\\nginx.exe -p D:\\nginx -t', 'D:\\nginx\\nginx.exe -p D:\\nginx'],
    notes: ['First command tests config — must say "syntax is ok"', 'Second command starts Nginx in background', 'Verify: netstat -ano | findstr ":9006"'],
  },
  {
    id: 6,
    title: 'Setup IIS HTTPS proxy',
    icon: 'ti-lock',
    color: C.brandFrom, bg: C.systemBg, border: C.systemBorder,
    desc: 'Configure IIS to proxy HTTPS requests to Nginx.',
    commands: [
      'iisreset /stop',
      'iisreset /start',
    ],
    notes: ['IIS site must be configured on port 9000 (HTTPS)', 'web.config should proxy to http://127.0.0.1:9006', 'SSL cert thumbprint must match the one entered in EasyReach'],
  },
  {
    id: 7,
    title: 'Run first AWS sync',
    icon: 'ti-cloud-download',
    color: C.server, bg: C.serverBg, border: C.serverBorder,
    desc: 'Download all media content from AWS S3 to local storage.',
    commands: ['D:\\MediaStorage\\sync_aws.bat'],
    notes: ['First sync may take 30–90 minutes depending on content size', 'Check log: type D:\\MediaStorage\\sync_log.txt', 'Look for "Sync Complete" at the end'],
  },
  {
    id: 8,
    title: 'Setup Task Scheduler',
    icon: 'ti-clock',
    color: C.warning, bg: C.warningBg, border: C.warningBorder,
    desc: 'Schedule auto-sync, auto-backup, and auto-start tasks.',
    commands: [],
    notes: [
      'Nginx auto-start: Task → AtStartup → D:\\nginx\\start_nginx.bat',
      'AWS Sync: Task → Every 15 min → D:\\MediaStorage\\sync_aws.bat',
      'Backup AM: Task → Daily 2AM → D:\\MinIO\\backup.bat',
      'Backup PM: Task → Daily 2PM → D:\\MinIO\\backup.bat',
    ],
  },
  {
    id: 9,
    title: 'Verify setup',
    icon: 'ti-circle-check',
    color: C.success, bg: C.successBg, border: C.successBorder,
    desc: 'Test that everything is working correctly.',
    commands: [],
    notes: [
      'Open in browser: https://[storage-domain]:9000/[folder]/[filename].pdf',
      'Check EasyReach dashboard — institution should show "active"',
      'Agent status should show "Online"',
      'Test a video: open .mp4 URL in browser — should stream smoothly',
    ],
  },
]

export default function SetupGuide() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [completed, setCompleted] = useState([])
  const [expanded, setExpanded] = useState(1)

  const toggle = (stepId) => {
    setCompleted(prev =>
      prev.includes(stepId) ? prev.filter(s => s !== stepId) : [...prev, stepId]
    )
  }

  const progress = Math.round((completed.length / steps.length) * 100)

  return (
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      {/* Topbar */}
      <div className="flex items-center justify-between px-7 py-4" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/schools/${id}`)}
            className="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer bg-transparent border-none" style={{ color: C.textSecondary }}>
            <i className="ti ti-arrow-left text-sm" aria-hidden="true"></i> Back
          </button>
          <div className="w-px h-5" style={{ background: C.border }} />
          <div>
            <div className="text-[14.5px] font-semibold" style={{ color: C.textPrimary }}>Setup guide</div>
            <div className="text-[12px]" style={{ color: C.textSecondary }}>Step-by-step on-premise deployment</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[12px] font-medium" style={{ color: C.textSecondary }}>{completed.length}/{steps.length} steps done</div>
          <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${C.brandFrom}, ${C.brandTo})` }} />
          </div>
          <div className="text-[12px] font-semibold" style={{ color: C.brandFrom }}>{progress}%</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto py-9 px-6">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 rounded-2xl mb-7"
          style={{ background: `linear-gradient(120deg, ${C.systemBg}, ${C.successBg})`, border: `1px solid ${C.systemBorder}` }}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
              <i className="ti ti-file-download text-white text-lg" aria-hidden="true"></i>
            </div>
            <div>
              <div className="text-[14px] font-semibold" style={{ color: C.textPrimary }}>Config ZIP downloaded</div>
              <div className="text-[12px] mt-0.5" style={{ color: C.textSecondary }}>Follow these steps on the institution's Windows server</div>
            </div>
          </div>
          <span className="text-[11.5px] font-semibold px-3.5 py-1.5 rounded-full" style={{ color: C.brandFrom, background: C.surface, border: `1px solid ${C.systemBorder}` }}>
            {steps.length} steps total
          </span>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => {
            const isDone = completed.includes(step.id)
            const isOpen = expanded === step.id

            return (
              <div key={step.id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{ background: C.surface, border: `1px solid ${isDone ? C.successBorder : C.border}`, boxShadow: isOpen ? '0 8px 24px -10px rgba(16,24,40,0.12)' : 'none' }}>

                {/* Step header */}
                <div className="flex items-center gap-3.5 px-5 py-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : step.id)}>

                  {/* Number/check */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-all"
                    style={{
                      background: isDone ? C.success : step.bg,
                      border: `1px solid ${isDone ? C.successBorder : step.border}`,
                      color: isDone ? '#fff' : step.color
                    }}>
                    {isDone ? <i className="ti ti-check text-[13px]" aria-hidden="true"></i> : step.id}
                  </div>

                  {/* Icon + title */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <i className={`ti ${step.icon} text-[15px] shrink-0`} style={{ color: step.color }} aria-hidden="true"></i>
                    <span className="text-[13.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{step.title}</span>
                  </div>

                  {/* Status + toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isDone && (
                      <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full" style={{ background: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` }}>Done</span>
                    )}
                    <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} text-[13px]`} style={{ color: C.textMuted }} aria-hidden="true"></i>
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-5 pb-5" style={{ borderTop: `1px solid ${C.border}` }}>
                    <div className="pt-4">
                      <p className="text-[12.5px] mb-4" style={{ color: C.textSecondary }}>{step.desc}</p>

                      {/* Commands */}
                      {step.commands.length > 0 && (
                        <div className="mb-4">
                          <div className="text-[11.5px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: C.textSecondary }}>
                            <i className="ti ti-terminal text-[12px]" aria-hidden="true"></i>Commands (Admin CMD/PowerShell)
                          </div>
                          <div className="space-y-2">
                            {step.commands.map((cmd, i) => (
                              <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl" style={{ background: C.navy }}>
                                <span className="text-[12px] font-mono select-none" style={{ color: C.success }}>$</span>
                                <code className="text-[12px] font-mono flex-1 select-all" style={{ color: '#CBD5E1' }}>{cmd}</code>
                                <button
                                  onClick={() => navigator.clipboard.writeText(cmd)}
                                  className="bg-transparent border-none cursor-pointer p-1 rounded-md hover:bg-white/10"
                                  style={{ color: '#7C8AA8' }}
                                  title="Copy">
                                  <i className="ti ti-copy text-[13px]" aria-hidden="true"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      <div className="space-y-2 mb-5">
                        {step.notes.map((note, i) => (
                          <div key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.textSecondary }}>
                            <i className="ti ti-point-filled text-[10px] mt-1 shrink-0" style={{ color: step.color }} aria-hidden="true"></i>
                            {note}
                          </div>
                        ))}
                      </div>

                      {/* Mark done button */}
                      <button onClick={() => { toggle(step.id); if (!isDone) setExpanded(step.id + 1) }}
                        className="w-full py-2.5 rounded-xl text-[13px] font-semibold border-none cursor-pointer transition-all"
                        style={isDone
                          ? { background: C.surfaceAlt, color: C.textSecondary, border: `1px solid ${C.border}` }
                          : { background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})`, color: '#fff' }}>
                        {isDone ? '↩ Mark as pending' : 'Mark as done — next step →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* All done */}
        {completed.length === steps.length && (
          <div className="mt-7 px-6 py-6 rounded-2xl text-center" style={{ background: `linear-gradient(135deg, ${C.successBg}, ${C.systemBg})`, border: `1px solid ${C.successBorder}` }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${C.success}, ${C.brandFrom})` }}>
              <i className="ti ti-circle-check text-white text-2xl" aria-hidden="true"></i>
            </div>
            <div className="text-[14.5px] font-semibold mb-1" style={{ color: C.textPrimary }}>Setup complete!</div>
            <div className="text-[12.5px] mb-5" style={{ color: C.textSecondary }}>Institution is now live on EasyReach</div>
            <button onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-xl text-[13.5px] font-semibold text-white border-none cursor-pointer shadow-sm"
              style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
              Back to dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}