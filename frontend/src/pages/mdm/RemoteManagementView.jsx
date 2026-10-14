import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDevices } from '../../api/devices'
import { sendCommand, pollCommandResult } from '../../api/commands'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'
import SchoolCards from '../../components/mdm/SchoolCards'

/* Light tokens for the outer app shell (Topbar/Sidebar/school picker) — matches
   Login.jsx / MdmHub.jsx / EnrollmentView.jsx (ink/grey/white). */
const INK = '#1A1A18'
const SUB = '#5C5C57'
const MUTED = '#8A8A85'
const C = {
  bgApp: '#E8E8E3', surface: '#FFFFFF', border: INK + '1F',
  textPrimary: INK, textSecondary: SUB, textMuted: MUTED,
  brandFrom: INK, brandTo: '#3A3A36',
}

/* VS Code Dark+ palette — used only inside the IDE workspace below. */
const V = {
  activityBg: '#333333',
  sidebarBg: '#252526',
  sidebarHeaderText: '#BBBBBB',
  editorBg: '#1E1E1E',
  panelBg: '#1E1E1E',
  panelHeaderBg: '#252526',
  border: '#2D2D2D',
  border2: '#3C3C3C',
  text: '#CCCCCC',
  textMuted: '#858585',
  accentBlue: '#3794FF',
  buttonBg: '#0E639C',
  buttonHoverBg: '#1177BB',
  listHoverBg: '#2A2D2E',
  listActiveBg: '#37373D',
  green: '#89D185',
  red: '#F48771',
  yellow: '#CCA700',
  purple: '#C586C0',
  cyan: '#4EC9B0',
  orange: '#D19A66',
}

const COMMON_COMMANDS = [
  { type: 'NETWORK_INFO', label: 'Network Info', icon: 'ti-network' },
  { type: 'DISK_INFO', label: 'Disk Info', icon: 'ti-database' },
  { type: 'PROCESS_LIST', label: 'Process List', icon: 'ti-list' },
  { type: 'SYSTEM_INFO', label: 'System Info', icon: 'ti-info-circle' },
  { type: 'RESTART', label: 'Restart', icon: 'ti-refresh', danger: true },
  { type: 'SHUTDOWN', label: 'Shutdown', icon: 'ti-power', danger: true },
  { type: 'LOCK', label: 'Lock Device', icon: 'ti-lock', danger: true },
]
const SERVER_ONLY_COMMANDS = [
  { type: 'NGINX_START', label: 'Nginx Start', icon: 'ti-player-play' },
  { type: 'NGINX_STOP', label: 'Nginx Stop', icon: 'ti-player-stop', danger: true },
  { type: 'NGINX_RESTART', label: 'Nginx Restart', icon: 'ti-refresh' },
  { type: 'SYNC_NOW', label: 'Sync Now', icon: 'ti-cloud-download' },
]
const ALL_TYPES = [...COMMON_COMMANDS, ...SERVER_ONLY_COMMANDS].map(c => c.type)

/* ── Plain-language parsers ──
   Raw Windows command output (systeminfo/ipconfig/tasklist/fsutil) is dense
   and technical. These turn it into simple label → value pairs a non-tech
   person can read. Any parser returning null falls back to the raw text view. */

const SYSTEM_INFO_LABELS = {
  'Host Name': 'Computer Name',
  'OS Name': 'Operating System',
  'System Manufacturer': 'Made By',
  'System Model': 'Model',
  'System Type': 'Processor Type',
  'Total Physical Memory': 'RAM (Total Memory)',
  'Available Physical Memory': 'RAM (Free Right Now)',
  'System Boot Time': 'Last Restarted',
  'Time Zone': 'Time Zone',
  'BIOS Version': 'BIOS Version',
}
function parseSystemInfo(text) {
  const items = []
  for (const [key, label] of Object.entries(SYSTEM_INFO_LABELS)) {
    const m = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    if (m && m[1].trim()) items.push({ label, value: m[1].trim() })
  }
  return items.length ? items : null
}

function parseNetworkInfo(text) {
  // Split on real adapter headers (e.g. "Ethernet adapter Ethernet:" / "Wireless LAN adapter Wi-Fi:")
  const headerRe = /^([A-Za-z].*? adapter [^:]+):\s*$/gm
  const headers = [...text.matchAll(headerRe)]
  if (!headers.length) return null

  const adapters = []
  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index + headers[i][0].length
    const end = i + 1 < headers.length ? headers[i + 1].index : text.length
    const block = text.slice(start, end)
    const name = headers[i][1].trim()

    const ip = block.match(/IPv4 Address[.\s]*:\s*([\d.]+)/i)
    const mask = block.match(/Subnet Mask[.\s]*:\s*([\d.]+)/i)
    const gateway = block.match(/Default Gateway[.\s]*:\s*([\d.]+)/i)
    const mac = block.match(/Physical Address[.\s]*:\s*([0-9A-Fa-f-]+)/i)
    const dns = [...block.matchAll(/DNS Servers[.\s]*:\s*([\d.]+)|^\s{10,}([\d.]+)\s*$/gim)]
      .map(m => m[1] || m[2]).filter(Boolean)
    const disconnected = /Media State[.\s]*:\s*Media disconnected/i.test(block)

    if (!ip && disconnected) {
      adapters.push({ label: name, value: 'Not connected' })
      continue
    }
    if (!ip) continue // skip adapters with nothing useful (e.g. inactive virtual adapters)

    const parts = [`IP: ${ip[1]}`]
    if (mask) parts.push(`Subnet: ${mask[1]}`)
    if (gateway) parts.push(`Gateway: ${gateway[1]}`)
    if (dns.length) parts.push(`DNS: ${dns.join(', ')}`)
    if (mac) parts.push(`MAC: ${mac[1]}`)
    adapters.push({ label: name, value: parts.join('  ·  ') })
  }
  return adapters.length ? adapters : null
}

function parseDiskInfo(text) {
  const drives = []
  const driveBlocks = text.split(/\\n(?=[A-Z]:)/)
  for (const block of driveBlocks) {
    const driveMatch = block.match(/^([A-Z]:)/)
    const totalMatch = block.match(/Total # of bytes\s*:\s*([\d,]+)/)
    const freeMatch = block.match(/Total # of free bytes\s*:\s*([\d,]+)/)
    if (driveMatch && totalMatch && freeMatch) {
      const totalGb = Math.round(parseInt(totalMatch[1].replace(/,/g, '')) / 1e9)
      const freeGb = Math.round(parseInt(freeMatch[1].replace(/,/g, '')) / 1e9)
      if (totalGb > 0) {
        drives.push({ label: `Drive ${driveMatch[1]}`, value: `${freeGb} GB free of ${totalGb} GB`, percentFree: Math.round((freeGb / totalGb) * 100) })
      }
    }
  }
  return drives.length ? drives : null
}

function parseProcessList(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  const dataLines = lines.filter(l => /^\S.*\s+\d+\s/.test(l) && !l.startsWith('Image Name') && !l.startsWith('='))
  const rows = dataLines.slice(0, 15).map(line => {
    const parts = line.trim().split(/\s{2,}/)
    return { name: parts[0] || '—', pid: parts[1] || '—', memory: parts[4] || parts[2] || '—' }
  }).filter(r => r.name !== '—')
  return rows.length ? rows : null
}

function parseResult(type, text) {
  if (typeof text !== 'string') return null
  try {
    if (type === 'SYSTEM_INFO') return { kind: 'kv', items: parseSystemInfo(text) }
    if (type === 'NETWORK_INFO') return { kind: 'kv', items: parseNetworkInfo(text) }
    if (type === 'DISK_INFO') return { kind: 'disk', items: parseDiskInfo(text) }
    if (type === 'PROCESS_LIST') return { kind: 'process', items: parseProcessList(text) }
  } catch { return null }
  return null
}

export default function RemoteManagementView() {
  const navigate = useNavigate()
  const [schoolId, setSchoolId] = useState(null)
  const [schoolName, setSchoolName] = useState('')
  const [devices, setDevices] = useState({ server: [], systems: [] })
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [treeExpanded, setTreeExpanded] = useState(true)
  const [running, setRunning] = useState(null)
  const [termInput, setTermInput] = useState('')
  const [log, setLog] = useState([])
  const [lastResult, setLastResult] = useState(null) // shown formatted in the center panel
  const [showRaw, setShowRaw] = useState(false)

  // ── Resizable panels ──
  const [leftWidth, setLeftWidth] = useState(260)
  const [termHeight, setTermHeight] = useState(260)
  const dragging = useRef(null)
  const shellRef = useRef(null)
  const scrollRef = useRef(null)
  const historyRef = useRef([])
  const historyIdx = useRef(-1)

  const onMouseDown = (which) => (e) => { e.preventDefault(); dragging.current = which }
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || !shellRef.current) return
      const rect = shellRef.current.getBoundingClientRect()
      if (dragging.current === 'left') {
        setLeftWidth(Math.min(Math.max(e.clientX - rect.left, 160), 480))
      } else if (dragging.current === 'term') {
        setTermHeight(Math.min(Math.max(rect.bottom - e.clientY, 120), rect.height - 120))
      }
    }
    const onUp = () => { dragging.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [log])

  const selectSchool = (id, name) => {
    setSchoolId(id); setSchoolName(name)
    getDevices(id)
      .then(data => {
        const server = data?.server || [], systems = data?.systems || []
        setDevices({ server, systems })
        setSelectedDevice(server[0] || systems[0] || null)
      })
      .catch(err => console.error(err))
  }

  const runCommand = useCallback((type, payload = {}) => {
    if (!selectedDevice) return
    setRunning(type)
    const entryId = Date.now()
    setLog(prev => [...prev, { id: entryId, cmd: type, status: 'running', output: '', time: new Date() }])
    const targetDeviceId = selectedDevice.device_type === 'system' ? selectedDevice.id : null

    sendCommand(schoolId, type, payload, targetDeviceId)
      .then(res => {
        const commandId = res.command_id || res.id
        pollCommandResult(commandId, (outcome) => {
          setRunning(null)
          const entry = { type, output: outcome.result, success: outcome.success !== false, time: new Date() }
          setLastResult(entry)
          setShowRaw(false)
          setLog(prev => prev.map(e => e.id === entryId
            ? { ...e, status: entry.success ? 'done' : 'error', output: entry.output } : e))
        })
      })
      .catch(() => {
        setRunning(null)
        setLog(prev => prev.map(e => e.id === entryId ? { ...e, status: 'error', output: 'Failed to send command' } : e))
      })
  }, [schoolId, selectedDevice])

  const submitTerminal = () => {
    const raw = termInput.trim()
    if (!raw || !selectedDevice) return
    historyRef.current.push(raw); historyIdx.current = historyRef.current.length
    const upper = raw.toUpperCase().replace(/\s+/g, '_')
    if (ALL_TYPES.includes(upper)) runCommand(upper)
    else runCommand('RUN_SCRIPT', { script: raw })
    setTermInput('')
  }

  const handleTermKeyDown = (e) => {
    if (e.key === 'Enter') submitTerminal()
    else if (e.key === 'ArrowUp') {
      if (historyIdx.current > 0) { historyIdx.current -= 1; setTermInput(historyRef.current[historyIdx.current] || '') }
      e.preventDefault()
    } else if (e.key === 'ArrowDown') {
      if (historyIdx.current < historyRef.current.length) { historyIdx.current += 1; setTermInput(historyRef.current[historyIdx.current] || '') }
      e.preventDefault()
    }
  }

  const allDevices = [...devices.server, ...devices.systems]
  const applicableCommands = selectedDevice?.device_type === 'server'
    ? [...COMMON_COMMANDS, ...SERVER_ONLY_COMMANDS] : COMMON_COMMANDS

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <Topbar C={C} />
      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        {!schoolId ? (
          <div className="flex-1 px-7 py-7 max-w-4xl">
            <button onClick={() => navigate('/mdm')}
              className="flex items-center gap-1.5 text-[12.5px] font-medium mb-4" style={{ color: C.textSecondary }}>
              <i className="ti ti-arrow-left text-[13px]" aria-hidden="true"></i> Back to MDM
            </button>
            <SchoolCards C={C} onSelect={selectSchool}
              title="Remote Device Management"
              subtitle="Choose a school or college to run commands on its devices" />
          </div>
        ) : (
          <div ref={shellRef} className="flex-1 flex flex-col select-none overflow-hidden" style={{ height: 'calc(100vh - 73px)', background: V.editorBg }}>
            {/* Breadcrumb / title bar */}
            <div className="flex items-center gap-2 px-4 shrink-0" style={{ height: 36, background: V.panelHeaderBg, borderBottom: `1px solid ${V.border2}` }}>
              <button onClick={() => setSchoolId(null)}
                className="flex items-center gap-1 text-[12px]" style={{ color: V.textMuted }}>
                <i className="ti ti-arrow-left text-[11px]" aria-hidden="true"></i> Schools
              </button>
              <span style={{ color: V.textMuted }}>/</span>
              <span className="text-[12px]" style={{ color: V.text }}>{schoolName}</span>
              <span style={{ color: V.textMuted }}>/</span>
              <span className="text-[12px] font-semibold flex items-center gap-1.5" style={{ color: V.accentBlue }}>
                <i className="ti ti-terminal-2 text-[12px]" aria-hidden="true"></i>Remote Device Management
              </span>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* ══ EXPLORER (left) ══ */}
              <div style={{ width: leftWidth, background: V.sidebarBg, borderRight: `1px solid ${V.border2}` }} className="shrink-0 flex flex-col overflow-hidden min-h-0">
                <div className="px-3 py-2 text-[10.5px] font-bold uppercase tracking-wider" style={{ color: V.sidebarHeaderText }}>
                  Explorer — {allDevices.length} devices
                </div>
                <div className="flex-1 overflow-y-auto">
                  {devices.server.map(d => (
                    <div key={d.id}>
                      <button onClick={() => { setSelectedDevice(d); setTreeExpanded(!treeExpanded) }}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left"
                        style={{ background: selectedDevice?.id === d.id ? V.listActiveBg : 'transparent' }}
                        onMouseEnter={e => { if (selectedDevice?.id !== d.id) e.currentTarget.style.background = V.listHoverBg }}
                        onMouseLeave={e => { if (selectedDevice?.id !== d.id) e.currentTarget.style.background = 'transparent' }}>
                        <i className={`ti ${treeExpanded ? 'ti-chevron-down' : 'ti-chevron-right'} text-[10px]`} style={{ color: V.textMuted }} aria-hidden="true"></i>
                        <i className="ti ti-server-2 text-[13px]" style={{ color: V.orange }} aria-hidden="true"></i>
                        <span className="text-[12.5px] truncate" style={{ color: V.text }}>{d.name}</span>
                        <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.agent_online ? V.green : V.textMuted }} />
                      </button>
                      {treeExpanded && devices.systems.map(sd => (
                        <button key={sd.id} onClick={() => setSelectedDevice(sd)}
                          className="w-full flex items-center gap-1.5 pl-7 pr-2 py-1.5 text-left"
                          style={{ background: selectedDevice?.id === sd.id ? V.listActiveBg : 'transparent' }}
                          onMouseEnter={e => { if (selectedDevice?.id !== sd.id) e.currentTarget.style.background = V.listHoverBg }}
                          onMouseLeave={e => { if (selectedDevice?.id !== sd.id) e.currentTarget.style.background = 'transparent' }}>
                          <i className="ti ti-device-desktop text-[12.5px]" style={{ color: V.accentBlue }} aria-hidden="true"></i>
                          <span className="text-[12px] truncate" style={{ color: V.text }}>{sd.name}</span>
                          <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sd.agent_online ? V.green : V.textMuted }} />
                        </button>
                      ))}
                    </div>
                  ))}
                  {devices.server.length === 0 && devices.systems.map(sd => (
                    <button key={sd.id} onClick={() => setSelectedDevice(sd)}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left"
                      style={{ background: selectedDevice?.id === sd.id ? V.listActiveBg : 'transparent' }}>
                      <i className="ti ti-device-desktop text-[12.5px]" style={{ color: V.accentBlue }} aria-hidden="true"></i>
                      <span className="text-[12px] truncate" style={{ color: V.text }}>{sd.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag handle: left panel width */}
              <div onMouseDown={onMouseDown('left')} className="w-1 shrink-0 cursor-col-resize" style={{ background: V.border2 }} />

              {/* ══ RIGHT SIDE: center content + terminal ══ */}
              <div className="flex-1 flex flex-col min-w-0 min-h-0">

                {/* ── Center content: device info + quick actions + formatted result ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
                  {!selectedDevice ? (
                    <div className="text-[13px]" style={{ color: V.textMuted }}>Select a device from the explorer.</div>
                  ) : (
                    <>
                      {/* Device header card */}
                      <div className="flex items-center gap-3 mb-5 pb-5" style={{ borderBottom: `1px solid ${V.border2}` }}>
                        <div className="w-11 h-11 rounded-lg flex items-center justify-center"
                          style={{ background: selectedDevice.device_type === 'server' ? '#4A3728' : '#1B2A4A' }}>
                          <i className={`ti ${selectedDevice.device_type === 'server' ? 'ti-server-2' : 'ti-device-desktop'} text-[18px]`}
                            style={{ color: selectedDevice.device_type === 'server' ? V.orange : V.accentBlue }} aria-hidden="true"></i>
                        </div>
                        <div>
                          <div className="text-[15px] font-semibold" style={{ color: V.text }}>{selectedDevice.name}</div>
                          <div className="text-[11.5px] font-mono" style={{ color: V.textMuted }}>
                            {selectedDevice.ip_address || 'no IP'} · {selectedDevice.device_type} · {selectedDevice.os || 'unknown OS'}
                          </div>
                        </div>
                        <span className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                          style={{ color: selectedDevice.agent_online ? V.green : V.textMuted, background: 'rgba(255,255,255,0.05)' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: selectedDevice.agent_online ? V.green : V.textMuted }} />
                          {selectedDevice.agent_online ? 'Agent Online' : 'Agent Offline'}
                        </span>
                      </div>

                      {/* Quick action buttons — click = run + show formatted result here */}
                      <div className="text-[10.5px] font-bold uppercase tracking-wider mb-2.5" style={{ color: V.textMuted }}>Quick Actions</div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {applicableCommands.map(cmd => (
                          <button key={cmd.type} onClick={() => runCommand(cmd.type)} disabled={running !== null}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium"
                            style={{
                              background: cmd.danger ? 'rgba(244,135,113,0.1)' : V.buttonBg,
                              color: cmd.danger ? V.red : '#fff',
                              border: cmd.danger ? `1px solid ${V.red}` : 'none',
                              opacity: running !== null ? 0.5 : 1, cursor: running !== null ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={e => { if (!cmd.danger && running === null) e.currentTarget.style.background = V.buttonHoverBg }}
                            onMouseLeave={e => { if (!cmd.danger) e.currentTarget.style.background = V.buttonBg }}>
                            <i className={`ti ${running === cmd.type ? 'ti-loader-2 animate-spin' : cmd.icon} text-[13px]`} aria-hidden="true"></i>
                            {cmd.label}
                          </button>
                        ))}
                      </div>

                      {/* Formatted result of the last command */}
                      <div className="text-[10.5px] font-bold uppercase tracking-wider mb-2.5" style={{ color: V.textMuted }}>Latest Result</div>
                      {lastResult ? (
                        <div className="rounded-lg p-5" style={{ background: V.panelHeaderBg, border: `1px solid ${V.border2}` }}>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-[12px] font-mono font-semibold px-2 py-0.5 rounded"
                              style={{ background: 'rgba(55,148,255,0.15)', color: V.accentBlue }}>{lastResult.type}</span>
                            <span className="text-[11px]" style={{ color: V.textMuted }}>{lastResult.time.toLocaleTimeString()}</span>
                            {lastResult.success && (
                              <button onClick={() => setShowRaw(v => !v)}
                                className="text-[11.5px] font-medium" style={{ color: V.accentBlue }}>
                                {showRaw ? 'Show simplified view' : 'Show full details'}
                              </button>
                            )}
                            <i className={`ti ${lastResult.success ? 'ti-circle-check' : 'ti-x'} text-[14px] ml-auto`}
                              style={{ color: lastResult.success ? V.green : V.red }} aria-hidden="true"></i>
                          </div>

                          {(() => {
                            if (!lastResult.success) {
                              return <div className="text-[14px]" style={{ color: V.red }}>Something went wrong — the device did not complete this command.</div>
                            }
                            if (showRaw) {
                              return (
                                <pre className="text-[13.5px] font-mono whitespace-pre-wrap leading-relaxed" style={{ color: V.text }}>
                                  {typeof lastResult.output === 'string' ? lastResult.output : JSON.stringify(lastResult.output, null, 2)}
                                </pre>
                              )
                            }
                            const parsed = parseResult(lastResult.type, lastResult.output)

                            if (parsed?.kind === 'kv' && parsed.items) {
                              return (
                                <div className="grid grid-cols-2 gap-x-8 gap-y-3.5">
                                  {parsed.items.map(({ label, value }) => (
                                    <div key={label}>
                                      <div className="text-[12px] mb-0.5" style={{ color: V.textMuted }}>{label}</div>
                                      <div className="text-[14px]" style={{ color: V.text }}>{value}</div>
                                    </div>
                                  ))}
                                </div>
                              )
                            }

                            if (parsed?.kind === 'disk' && parsed.items) {
                              return (
                                <div className="flex flex-col gap-3">
                                  {parsed.items.map(d => (
                                    <div key={d.label}>
                                      <div className="flex justify-between text-[14px] mb-1.5">
                                        <span style={{ color: V.text }}>{d.label}</span>
                                        <span style={{ color: V.textMuted }}>{d.value}</span>
                                      </div>
                                      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#3C3C3C' }}>
                                        <div className="h-full rounded-full" style={{ width: `${100 - d.percentFree}%`, background: d.percentFree < 15 ? V.red : V.accentBlue }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )
                            }

                            if (parsed?.kind === 'process' && parsed.items) {
                              return (
                                <div>
                                  <div className="grid grid-cols-[1fr_80px_100px] gap-2 pb-2 text-[11.5px] font-semibold uppercase" style={{ color: V.textMuted, borderBottom: `1px solid ${V.border2}` }}>
                                    <span>Program</span><span>ID</span><span>Memory</span>
                                  </div>
                                  {parsed.items.map((p, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_80px_100px] gap-2 py-1.5 text-[13.5px]" style={{ color: V.text, borderBottom: `1px solid ${V.border}` }}>
                                      <span className="truncate">{p.name}</span><span style={{ color: V.textMuted }}>{p.pid}</span><span style={{ color: V.textMuted }}>{p.memory}</span>
                                    </div>
                                  ))}
                                </div>
                              )
                            }

                            // Fallback: nothing we know how to parse — show raw text, still readable.
                            return (
                              <pre className="text-[13.5px] font-mono whitespace-pre-wrap leading-relaxed" style={{ color: V.text }}>
                                {typeof lastResult.output === 'string' ? lastResult.output : JSON.stringify(lastResult.output, null, 2)}
                              </pre>
                            )
                          })()}
                        </div>
                      ) : (
                        <div className="text-[13px]" style={{ color: V.textMuted }}>Run a command to see its output here.</div>
                      )}
                    </>
                  )}
                </div>

                {/* Drag handle: terminal height */}
                <div onMouseDown={onMouseDown('term')} className="h-1 shrink-0 cursor-row-resize" style={{ background: V.border2 }} />

                {/* ══ TERMINAL (bottom) ══ */}
                <div style={{ height: termHeight, background: V.panelBg }} className="shrink-0 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-4 px-4 shrink-0" style={{ height: 32, background: V.panelHeaderBg, borderBottom: `1px solid ${V.border2}` }}>
                    <span className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: V.text }}>
                      <i className="ti ti-terminal-2 text-[12px]" aria-hidden="true"></i>Terminal
                    </span>
                    {selectedDevice && (
                      <span className="text-[11px] font-mono" style={{ color: V.textMuted }}>{selectedDevice.name}</span>
                    )}
                    <button onClick={() => setLog([])} className="ml-auto text-[11px]" style={{ color: V.textMuted }}>
                      <i className="ti ti-trash text-[12px]" aria-hidden="true"></i>
                    </button>
                  </div>

                  <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2.5 font-mono text-[12.5px] min-h-0">
                    {log.length === 0 ? (
                      <div style={{ color: V.textMuted }}>Type a command (e.g. NETWORK_INFO) or any script line, press Enter.</div>
                    ) : (
                      log.map(entry => (
                        <div key={entry.id} className="flex items-center gap-2 py-0.5">
                          <span style={{ color: V.cyan }}>❯</span>
                          <span style={{ color: V.text }}>{entry.cmd}</span>
                          <span style={{ color: V.textMuted }}>{entry.time.toLocaleTimeString()}</span>
                          {entry.status === 'running' && (
                            <span className="flex items-center gap-1" style={{ color: V.textMuted }}>
                              <i className="ti ti-loader-2 animate-spin text-[11px]" aria-hidden="true"></i>Running…
                            </span>
                          )}
                          {entry.status === 'done' && (
                            <span className="flex items-center gap-1" style={{ color: V.green }}>
                              <i className="ti ti-circle-check text-[11px]" aria-hidden="true"></i>Executed
                            </span>
                          )}
                          {entry.status === 'error' && (
                            <span className="flex items-center gap-1" style={{ color: V.red }}>
                              <i className="ti ti-x text-[11px]" aria-hidden="true"></i>Failed
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-2 px-4 shrink-0" style={{ height: 34, borderTop: `1px solid ${V.border2}` }}>
                    <span className="font-mono text-[12.5px]" style={{ color: V.cyan }}>❯</span>
                    <input value={termInput} onChange={e => setTermInput(e.target.value)} onKeyDown={handleTermKeyDown}
                      disabled={!selectedDevice}
                      placeholder={selectedDevice ? 'Type a command or script and press Enter…' : 'Select a device first…'}
                      className="flex-1 bg-transparent outline-none font-mono text-[12.5px]" style={{ color: V.text }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}