import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDevices, addDevice, deleteDevice, getCommandResult } from '../../api/devices'
import { sendCommand } from '../../api/commands'
import useAuthStore from '../../store/authStore'

/* ────────────────────────────────────────────────────────────
   DESIGN TOKENS
   Single source of truth for the palette used across the page.
──────────────────────────────────────────────────────────── */
const C = {
  bgApp: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E4E9F2',
  borderStrong: '#D8E0EC',
  textPrimary: '#101828',
  textSecondary: '#667085',
  textMuted: '#98A2B3',

  brandFrom: '#3B6FE0',
  brandTo: '#16B8A6',

  server: '#7C5CFC',
  serverBg: '#F5F2FF',
  serverBorder: '#E4DCFF',

  system: '#3B6FE0',
  systemBg: '#EDF3FF',
  systemBorder: '#D8E6FF',

  success: '#17B26A',
  successBg: '#ECFDF5',
  danger: '#E4483C',
  dangerBg: '#FEF1F0',
  dangerBorder: '#FBD5D2',
  warning: '#F79420',

  // dark operations console
  opsBg: '#0E1526',
  opsSurface: '#141C30',
  opsSurfaceAlt: '#0B111F',
  opsBorder: '#232E48',
  opsBorderSoft: '#1E2A44',
  opsText: '#E7ECF5',
  opsTextMuted: '#8B98B8',
  opsTextFaint: '#5C6B8C',
  opsAccent: '#5C8DFF',
}

const serverActions = [
  { icon: 'ti-network', label: 'Network Info', cmd: 'NETWORK_INFO', color: '#5C8DFF', group: 'info' },
  { icon: 'ti-device-floppy', label: 'Disk Info', cmd: 'DISK_INFO', color: '#17B26A', group: 'info' },
  { icon: 'ti-apps', label: 'Processes', cmd: 'PROCESS_LIST', color: '#9B87F5', group: 'info' },
  { icon: 'ti-info-circle', label: 'System Info', cmd: 'SYSTEM_INFO', color: '#F79420', group: 'info' },
  { icon: 'ti-player-play', label: 'Nginx Start', cmd: 'NGINX_START', color: '#17B26A', group: 'nginx' },
  { icon: 'ti-player-stop', label: 'Nginx Stop', cmd: 'NGINX_STOP', color: '#F79420', group: 'nginx' },
  { icon: 'ti-reload', label: 'Nginx Restart', cmd: 'NGINX_RESTART', color: '#5C8DFF', group: 'nginx' },
  { icon: 'ti-cloud-download', label: 'Sync Now', cmd: 'SYNC_NOW', color: '#9B87F5', group: 'nginx' },
  { icon: 'ti-lock', label: 'Lock PC', cmd: 'LOCK', color: '#8B9AB8', group: 'power', confirm: true },
  { icon: 'ti-refresh', label: 'Restart', cmd: 'RESTART', color: '#F79420', group: 'power', confirm: true },
  { icon: 'ti-power', label: 'Shutdown', cmd: 'SHUTDOWN', color: '#F04438', group: 'power', confirm: true },
  { icon: 'ti-terminal-2', label: 'Run Script', cmd: 'RUN_SCRIPT', color: '#16B8A6', group: 'power', hasInput: true },
]

const systemActions = [
  { icon: 'ti-network', label: 'Network Info', cmd: 'NETWORK_INFO', color: '#5C8DFF', group: 'info' },
  { icon: 'ti-device-floppy', label: 'Disk Info', cmd: 'DISK_INFO', color: '#17B26A', group: 'info' },
  { icon: 'ti-apps', label: 'Processes', cmd: 'PROCESS_LIST', color: '#9B87F5', group: 'info' },
  { icon: 'ti-info-circle', label: 'System Info', cmd: 'SYSTEM_INFO', color: '#F79420', group: 'info' },
  { icon: 'ti-lock', label: 'Lock PC', cmd: 'LOCK', color: '#8B9AB8', group: 'power', confirm: true },
  { icon: 'ti-refresh', label: 'Restart', cmd: 'RESTART', color: '#F79420', group: 'power', confirm: true },
  { icon: 'ti-power', label: 'Shutdown', cmd: 'SHUTDOWN', color: '#F04438', group: 'power', confirm: true },
  { icon: 'ti-terminal-2', label: 'Run Script', cmd: 'RUN_SCRIPT', color: '#16B8A6', group: 'power', hasInput: true },
]

/* ────────────────────────────────────────────────────────────
   PARSING HELPERS  (unchanged data logic, just extended a bit
   so the disk cards can render a real usage bar)
──────────────────────────────────────────────────────────── */
function parseSizeToBytes(str) {
  if (!str) return null
  const m = String(str).match(/([\d.,]+)\s*(TB|GB|MB|KB|B)?/i)
  if (!m) return null
  const num = parseFloat(m[1].replace(/,/g, ''))
  if (isNaN(num)) return null
  const unit = (m[2] || 'B').toUpperCase()
  const mult = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 }[unit] || 1
  return num * mult
}

function sysInfoIcon(key) {
  const k = key.toLowerCase()
  if (k.includes('os')) return 'ti-brand-windows'
  if (k.includes('manufacturer') || k.includes('vendor')) return 'ti-building-factory-2'
  if (k.includes('model')) return 'ti-device-desktop'
  if (k.includes('processor') || k.includes('cpu')) return 'ti-cpu'
  if (k.includes('memory') || k.includes('ram')) return 'ti-transform'
  if (k.includes('serial')) return 'ti-barcode'
  if (k.includes('bios')) return 'ti-chip'
  if (k.includes('domain') || k.includes('workgroup')) return 'ti-affiliate'
  if (k.includes('user')) return 'ti-user'
  if (k.includes('boot') || k.includes('time') || k.includes('uptime')) return 'ti-clock'
  return 'ti-info-square-rounded'
}

function parseResult(cmd, raw) {
  if (!raw) return null
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const cleanLabel = (s) => s.replace(/[.\s]+$/, '').trim()

  if (cmd === 'NETWORK_INFO') {
    const adapters = []
    let current = null
    lines.forEach(line => {
      if (line.match(/adapter|Ethernet|Wi-Fi|Wireless/i) && line.endsWith(':')) {
        if (current) adapters.push(current)
        current = { name: line.replace(':', '').trim(), items: [] }
      } else if (current && line.includes(':')) {
        const idx = line.indexOf(':')
        const key = cleanLabel(line.slice(0, idx))
        const val = line.slice(idx + 1).trim()
        if (key && val) current.items.push({ key, val })
      }
    })
    if (current) adapters.push(current)
    return { type: 'network', adapters }
  }

  if (cmd === 'DISK_INFO') {
    const drives = []
    let current = null
    lines.forEach(line => {
      if (line.match(/^[A-Z]:$/)) { current = { drive: line, items: [] }; drives.push(current) }
      else if (current && line.includes(':')) {
        const [k, ...v] = line.split(':')
        current.items.push({ key: cleanLabel(k), val: v.join(':').trim() })
      }
    })
    drives.forEach(d => {
      const sizeItem = d.items.find(i => /^(size|total\s*size|capacity)$/i.test(i.key))
      const freeItem = d.items.find(i => /^(free\s*space|freespace|available)$/i.test(i.key))
      if (sizeItem && freeItem) {
        const total = parseSizeToBytes(sizeItem.val)
        const free = parseSizeToBytes(freeItem.val)
        if (total && free !== null && total > 0) {
          d.usedPct = Math.max(0, Math.min(100, Math.round(((total - free) / total) * 100)))
        }
      }
    })
    return { type: 'disk', drives }
  }

  if (cmd === 'PROCESS_LIST') {
    const procs = []
    let started = false
    lines.forEach(line => {
      if (line.startsWith('===')) { started = true; return }
      if (!started) return
      const parts = line.split(/\s{2,}/)
      if (parts.length >= 3) {
        procs.push({ name: parts[0], pid: parts[1], session: parts[2], mem: parts[4] || '' })
      }
    })
    return { type: 'processes', procs }
  }

  if (cmd === 'SYSTEM_INFO') {
    const items = []
    lines.forEach(line => {
      if (line.includes(':')) {
        const idx = line.indexOf(':')
        const key = cleanLabel(line.slice(0, idx))
        const val = line.slice(idx + 1).trim()
        if (key && val && !val.startsWith('N/A')) items.push({ key, val })
      }
    })
    return { type: 'sysinfo', items }
  }

  return { type: 'raw', text: raw }
}

/* ────────────────────────────────────────────────────────────
   SMALL SHARED UI PRIMITIVES
──────────────────────────────────────────────────────────── */
function CopyableValue({ value, mono = true, dark = false, style = {}, className = '' }) {
  const [copied, setCopied] = useState(false)
  if (!value || value === '—') return <span style={style} className={className}>{value || '—'}</span>

  const doCopy = (e) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <span className={`group/copy inline-flex items-center gap-1 min-w-0 ${className}`}>
      <span className={`${mono ? 'font-mono' : ''} truncate`} style={style}>{value}</span>
      <button
        onClick={doCopy}
        title="Copy value"
        tabIndex={-1}
        className={`opacity-0 group-hover/copy:opacity-100 focus:opacity-100 shrink-0 p-1 rounded-md transition-opacity cursor-pointer border-none ${
          dark ? 'bg-white/5 hover:bg-white/10' : 'bg-transparent hover:bg-slate-100'
        }`}
      >
        <i
          className={`ti ${copied ? 'ti-check' : 'ti-copy'} text-[11px] leading-none`}
          style={{ color: copied ? C.success : dark ? C.opsTextFaint : C.textMuted }}
          aria-hidden="true"
        ></i>
      </button>
    </span>
  )
}

function EmptyResult({ icon, text, span = 2 }) {
  return (
    <div className={`col-span-${span} flex flex-col items-center justify-center py-12 text-center`}>
      <i className={`ti ${icon} text-3xl mb-2`} style={{ color: '#2D3A54' }} aria-hidden="true"></i>
      <span className="text-[12px]" style={{ color: C.opsTextFaint }}>{text}</span>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   RESULT RENDERERS
──────────────────────────────────────────────────────────── */
function ResultUI({ cmd, raw }) {
  if (!raw) return null
  const parsed = parseResult(cmd, raw)
  if (!parsed) return null

  if (parsed.type === 'network') return (
    <div className="h-full overflow-y-auto pr-1 space-y-4">
      {parsed.adapters.length === 0
        ? <EmptyResult icon="ti-plug-connected-x" text="No adapter information returned" />
        : parsed.adapters.map((a, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: C.opsSurface, border: `1px solid ${C.opsBorder}` }}>
            <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.opsBorderSoft}` }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(92,141,255,0.14)' }}>
                <i className="ti ti-network text-[13px]" style={{ color: '#5C8DFF' }} aria-hidden="true"></i>
              </div>
              <span className="text-[13.5px] font-semibold truncate" style={{ color: C.opsText }}>{a.name}</span>
              <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full ml-auto shrink-0" style={{ color: C.opsTextFaint, background: C.opsSurfaceAlt }}>
                {a.items.length} fields
              </span>
            </div>
            <div>
              {a.items.map((item, j) => (
                <div key={j} className="grid gap-3 px-5 py-2.5 items-center" style={{ gridTemplateColumns: 'minmax(160px,260px) 1fr', borderBottom: j < a.items.length - 1 ? `1px solid ${C.opsBorderSoft}` : 'none' }}>
                  <span className="text-[11.5px] truncate" style={{ color: C.opsTextFaint }}>{item.key}</span>
                  <CopyableValue value={item.val} dark style={{ color: '#DCE3F2' }} className="text-[12.5px]" />
                </div>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  )

  if (parsed.type === 'disk') return (
    <div className="h-full overflow-y-auto pr-1 grid gap-3.5 content-start" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
      {parsed.drives.length === 0
        ? <EmptyResult icon="ti-device-floppy" text="No drive information returned" span={3} />
        : parsed.drives.map((d, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: C.opsSurface, border: `1px solid ${C.opsBorder}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(23,178,106,0.14)' }}>
                  <i className="ti ti-device-floppy text-[13px]" style={{ color: C.success }} aria-hidden="true"></i>
                </div>
                <span className="text-[13px] font-semibold" style={{ color: C.opsText }}>Drive {d.drive}</span>
              </div>
              {typeof d.usedPct === 'number' && (
                <span className="text-[11px] font-mono font-semibold" style={{ color: d.usedPct >= 90 ? '#F87171' : d.usedPct >= 70 ? C.warning : C.opsTextMuted }}>
                  {d.usedPct}%
                </span>
              )}
            </div>
            {typeof d.usedPct === 'number' && (
              <div className="h-1.5 rounded-full overflow-hidden mb-3.5" style={{ background: C.opsBorderSoft }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${d.usedPct}%`,
                  background: d.usedPct >= 90 ? '#F87171' : d.usedPct >= 70 ? C.warning : C.success
                }}></div>
              </div>
            )}
            <div className="space-y-2">
              {d.items.map((item, j) => (
                <div key={j} className="flex items-center justify-between gap-2">
                  <span className="text-[10.5px] shrink-0" style={{ color: C.opsTextFaint }}>{item.key}</span>
                  <span className="text-[11px] font-mono truncate" style={{ color: '#A8B4CC' }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  )

  if (parsed.type === 'processes') return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col" style={{ background: C.opsSurface, border: `1px solid ${C.opsBorder}` }}>
      <div className="grid grid-cols-[1fr_72px_100px_84px] gap-2 px-4 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${C.opsBorderSoft}` }}>
        {['Process', 'PID', 'Session', 'Memory'].map(h => (
          <span key={h} className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: C.opsTextFaint }}>{h}</span>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {parsed.procs.length === 0
          ? <EmptyResult icon="ti-apps-off" text="No process data returned" span={4} />
          : parsed.procs.map((p, i) => (
            <div key={i} title={p.name}
              className="grid grid-cols-[1fr_72px_100px_84px] gap-2 px-4 py-2 items-center"
              style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
              <span className="text-[12px] truncate" style={{ color: C.opsText }}>{p.name}</span>
              <span className="text-[11px] font-mono tabular-nums" style={{ color: C.opsTextMuted }}>{p.pid}</span>
              <span className="text-[11px] truncate" style={{ color: C.opsTextMuted }}>{p.session}</span>
              <span className="text-[11px] font-mono tabular-nums text-right" style={{ color: C.opsTextMuted }}>{p.mem}</span>
            </div>
          ))
        }
      </div>
      <div className="px-4 py-2 shrink-0" style={{ borderTop: `1px solid ${C.opsBorderSoft}` }}>
        <span className="text-[11px]" style={{ color: C.opsTextFaint }}>{parsed.procs.length} processes</span>
      </div>
    </div>
  )

  if (parsed.type === 'sysinfo') return (
    <div className="rounded-2xl overflow-hidden h-full flex flex-col" style={{ background: C.opsSurface, border: `1px solid ${C.opsBorder}` }}>
      <div className="flex-1 overflow-y-auto">
        {parsed.items.length === 0
          ? <EmptyResult icon="ti-info-circle" text="No system information returned" />
          : parsed.items.map((item, i) => (
            <div key={i} className="grid gap-3 items-center px-5 py-2.5" style={{ gridTemplateColumns: '28px minmax(160px,260px) 1fr', borderBottom: i < parsed.items.length - 1 ? `1px solid ${C.opsBorderSoft}` : 'none' }}>
              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: 'rgba(155,135,245,0.14)' }}>
                <i className={`ti ${sysInfoIcon(item.key)} text-[11px]`} style={{ color: '#9B87F5' }} aria-hidden="true"></i>
              </div>
              <span className="text-[11.5px] truncate" style={{ color: C.opsTextFaint }}>{item.key}</span>
              <CopyableValue value={item.val} mono={false} dark style={{ color: '#DCE3F2' }} className="text-[12.5px]" />
            </div>
          ))
        }
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl h-full flex flex-col overflow-hidden" style={{ background: C.opsSurfaceAlt, border: `1px solid ${C.opsBorder}` }}>
      <div className="flex items-center gap-1.5 px-4 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${C.opsBorderSoft}` }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#F04438' }}></span>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#F79420' }}></span>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#17B26A' }}></span>
        <span className="text-[11px] ml-2" style={{ color: C.opsTextFaint }}>Script output</span>
      </div>
      <pre className="flex-1 overflow-auto px-4 py-3 text-[12px] leading-relaxed font-mono whitespace-pre-wrap break-all" style={{ color: '#CBD5E1' }}>
        {parsed.text}
      </pre>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────────── */
export default function Devices() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = useAuthStore(state => state.token)
  const [data, setData] = useState({ server: [], systems: [] })
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [cmdLoading, setCmdLoading] = useState(null)
  const [cmdResult, setCmdResult] = useState(null)
  const [lastCmd, setLastCmd] = useState(null)
  const [scriptInput, setScriptInput] = useState('')
  const [showScript, setShowScript] = useState(false)
  const [treeOpen, setTreeOpen] = useState(false)
  const [form, setForm] = useState({
    name: '', device_type: 'system',
    ip_address: '', mac_address: '', os: '', notes: ''
  })

  useEffect(() => { fetchDevices() }, [id])

  const fetchDevices = async () => {
    try {
      const res = await getDevices(id)
      setData(res)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleAdd = async () => {
    try {
      await addDevice(id, form)
      setShowAdd(false)
      setForm({ name: '', device_type: 'system', ip_address: '', mac_address: '', os: '', notes: '' })
      fetchDevices()
    } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const handleDelete = async (deviceId) => {
    if (!confirm('Delete this device?')) return
    try {
      await deleteDevice(id, deviceId)
      if (selectedDevice?.id === deviceId) setSelectedDevice(null)
      fetchDevices()
    } catch { alert('Failed to delete') }
  }

  const downloadAgent = async (deviceId, deviceName) => {
    try {
      const res = await fetch(
        `https://dolphin-app-33jp4.ondigitalocean.app/easyreach/schools/${id}/devices/${deviceId}/generate-agent`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `easyreach_agent_${deviceName}.zip`; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Failed to download agent ZIP') }
  }

  const downloadServerAgent = async () => {
    try {
      const res = await fetch(
        `https://dolphin-app-33jp4.ondigitalocean.app/easyreach/schools/${id}/generate-server-agent`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `easyreach_server_agent.zip`; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Failed to download server agent ZIP') }
  }

  const handleAction = async (action) => {
    if (action.confirm && !confirm(`Are you sure you want to ${action.label}?`)) return
    if (action.hasInput) { setShowScript(true); return }
    runCmd(action)
  }

  const runCmd = async (action, scriptPayload = {}) => {
    setCmdLoading(action.cmd)
    setCmdResult(null)
    setLastCmd(action.cmd)
    try {
      const isSystem = selectedDevice?.device_type === 'system'
      const deviceId = isSystem ? selectedDevice.id : null
      const res = await sendCommand(id, action.cmd, scriptPayload, deviceId)
      setCmdResult({ type: 'loading' })
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        try {
          const result = await getCommandResult(res.id)
          if (result.status === 'done') {
            clearInterval(poll)
            setCmdLoading(null)
            setCmdResult({ type: 'success', raw: result.result })
          }
        } catch {}
        if (attempts >= 12) {
          clearInterval(poll)
          setCmdLoading(null)
          setCmdResult({ type: 'error', message: 'Timeout — agent did not respond in 60s' })
        }
      }, 5000)
    } catch (err) {
      setCmdResult({ type: 'error', message: err.response?.data?.detail || 'Failed to send command' })
      setCmdLoading(null)
    }
  }

  const handleRunScript = async () => {
    if (!scriptInput.trim()) return
    setShowScript(false)
    await runCmd({ cmd: 'RUN_SCRIPT', label: 'Script' }, { script: scriptInput })
    setScriptInput('')
  }

  const currentActions = selectedDevice?.device_type === 'server' ? serverActions : systemActions
  const inputCls = "w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none placeholder-slate-400 transition-colors"
  const labelCls = "block text-[12px] font-medium mb-1.5"

  const ActionGroup = ({ title, groupKey }) => {
    const items = currentActions.filter(a => a.group === groupKey)
    if (items.length === 0) return null
    return (
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md shrink-0"
          style={{ color: C.opsTextFaint, background: 'rgba(255,255,255,0.03)' }}>
          {title}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {items.map(action => (
            <button key={action.cmd}
              onClick={() => !cmdLoading && handleAction(action)}
              disabled={!!cmdLoading}
              title={action.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{
                background: C.opsSurface,
                border: `1px solid ${cmdLoading === action.cmd ? action.color : C.opsBorder}`,
                color: C.opsText,
              }}>
              {cmdLoading === action.cmd
                ? <i className="ti ti-loader-2 animate-spin text-xs" style={{ color: action.color }} aria-hidden="true"></i>
                : <i className={`ti ${action.icon} text-xs`} style={{ color: action.color }} aria-hidden="true"></i>
              }
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:h-screen flex flex-col" style={{ background: C.bgApp }}>
      <style>{`
        @keyframes opsPanelSlideIn {
          from { opacity: 0; transform: translateX(28px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes infoPanelFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* ═══ TOPBAR ═══ */}
      <div className="flex items-center justify-between px-6 py-3.5 shrink-0" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/schools/${id}`)}
            className="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer bg-transparent border-none transition-colors"
            style={{ color: C.textSecondary }}
            onMouseEnter={e => e.currentTarget.style.color = C.textPrimary}
            onMouseLeave={e => e.currentTarget.style.color = C.textSecondary}>
            <i className="ti ti-arrow-left text-sm" aria-hidden="true"></i> Back
          </button>
          <div className="w-px h-5" style={{ background: C.border }} />
          <div>
            <div className="text-[14.5px] font-semibold" style={{ color: C.textPrimary }}>Device Manager</div>
            <div className="text-[12px]" style={{ color: C.textSecondary }}>
              {(data.server || []).length} server · {(data.systems || []).length} systems
            </div>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white border-none cursor-pointer shadow-sm transition-transform hover:scale-[1.02]"
          style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
          <i className="ti ti-plus text-sm" aria-hidden="true"></i> Add system
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <i className="ti ti-loader-2 animate-spin text-2xl" style={{ color: C.brandFrom }} aria-hidden="true"></i>
          <span className="text-[13px]" style={{ color: C.textSecondary }}>Loading devices…</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">

          {/* ═══ LEFT — Network Tree ═══ */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col lg:overflow-y-auto" style={{ background: C.surface, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>Network Tree</span>
              <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                {(data.server?.length || 0) + (data.systems?.length || 0)} devices
              </span>
            </div>

            {(data.server || []).length === 0 ? (
              <div className="mx-4 mb-2 p-4 rounded-xl text-center" style={{ border: `1.5px dashed ${C.serverBorder}` }}>
                <div className="text-[12px] mb-2" style={{ color: C.textMuted }}>No server</div>
                <button onClick={() => { setForm(f => ({ ...f, device_type: 'server' })); setShowAdd(true) }}
                  className="text-[11.5px] font-medium px-3 py-1.5 rounded-lg cursor-pointer border-none"
                  style={{ color: C.server, background: C.serverBg }}>
                  + Add server
                </button>
              </div>
            ) : (
              <div className="px-4 mb-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide mb-1.5 pl-1" style={{ color: C.textMuted }}>Server</div>
                <div className="flex items-stretch gap-0 rounded-xl transition-all overflow-hidden"
                  style={{
                    background: selectedDevice?.id === data.server[0].id ? C.serverBg : C.surface,
                    border: `1px solid ${selectedDevice?.id === data.server[0].id ? C.serverBorder : C.border}`,
                  }}>
                  <button onClick={() => setTreeOpen(o => !o)}
                    title={treeOpen ? 'Collapse systems' : 'Expand systems'}
                    className="flex items-center justify-center w-8 shrink-0 cursor-pointer border-none bg-transparent">
                    <i className={`ti ti-chevron-right text-[14px] transition-transform ${treeOpen ? 'rotate-90' : ''}`}
                      style={{ color: C.textMuted }} aria-hidden="true"></i>
                  </button>
                  <div onClick={() => { setSelectedDevice(data.server[0]); setCmdResult(null) }}
                    className="flex-1 flex items-center gap-3 pr-3.5 py-3 cursor-pointer min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg,#7C5CFC,#A78BFA)' }}>
                      <i className="ti ti-server-2 text-white text-[14px]" aria-hidden="true"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate" style={{ color: C.textPrimary }}>{data.server[0].name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold px-1.5 py-[1px] rounded" style={{ color: C.server, background: C.serverBg }}>SERVER</span>
                        <span className="text-[10.5px] font-mono truncate" style={{ color: C.textMuted }}>{data.server[0].ip_address || 'IP not set'}</span>
                      </div>
                    </div>
                    <span className="relative flex w-2 h-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: C.success }}></span>
                      <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: C.success }}></span>
                    </span>
                  </div>
                </div>
                {(data.systems || []).length > 0 && (
                  <button onClick={() => setTreeOpen(o => !o)}
                    className="w-full text-left text-[10.5px] pl-2 pt-1.5 pb-0.5 cursor-pointer border-none bg-transparent flex items-center gap-1"
                    style={{ color: C.textMuted }}>
                    <i className={`ti ti-corner-down-right text-[11px]`} aria-hidden="true"></i>
                    {treeOpen ? `${data.systems.length} systems connected` : `${data.systems.length} systems · click to expand`}
                  </button>
                )}
              </div>
            )}

            {treeOpen && (data.systems || []).length > 0 && (
              <div className="px-4 mb-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide mb-1.5 pl-1" style={{ color: C.textMuted }}>Systems ({data.systems.length})</div>
                <div className="relative space-y-1.5">
                  <div className="absolute left-[15px] top-0 bottom-[26px] w-px" style={{ background: C.border }}></div>
                  {(data.systems || []).map((device) => (
                    <div key={device.id} className="relative pl-7">
                      <div className="absolute left-[15px] top-[23px] w-3 h-px" style={{ background: C.border }}></div>
                      <div onClick={() => { setSelectedDevice(device); setCmdResult(null) }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: selectedDevice?.id === device.id ? C.systemBg : C.surface,
                          border: `1px solid ${selectedDevice?.id === device.id ? C.systemBorder : C.border}`,
                        }}>
                        <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: C.systemBg }}>
                          <i className="ti ti-device-desktop text-[13px]" style={{ color: C.system }} aria-hidden="true"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-medium truncate" style={{ color: C.textPrimary }}>{device.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9.5px] font-semibold px-1.5 py-[1px] rounded" style={{ color: C.system, background: C.systemBg }}>PC</span>
                            <span className="text-[10.5px] font-mono truncate" style={{ color: C.textMuted }}>{device.ip_address || '—'}</span>
                          </div>
                        </div>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: device.agent_online ? C.success : '#CBD5E1' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 mt-1 mb-4">
              <button onClick={() => setShowAdd(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] font-medium cursor-pointer transition-colors"
                style={{ color: C.textMuted, border: `1.5px dashed ${C.border}` }}
                onMouseEnter={e => { e.currentTarget.style.color = C.system; e.currentTarget.style.background = C.systemBg; e.currentTarget.style.borderColor = C.systemBorder }}
                onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border }}>
                <i className="ti ti-plus text-sm" aria-hidden="true"></i> Add system
              </button>
            </div>
          </div>

          {/* ═══ MIDDLE — Device Info ═══ */}
          <div className={`w-full ${selectedDevice ? 'lg:w-[440px] shrink-0' : 'lg:flex-1'} flex flex-col lg:overflow-y-auto`}
            style={{ background: C.surfaceAlt, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            {!selectedDevice ? (
              <div className="flex flex-col items-center justify-center text-center p-10 lg:flex-1">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
                  <i className="ti ti-device-desktop text-[26px]" style={{ color: C.brandFrom }} aria-hidden="true"></i>
                </div>
                <div className="text-[14px] font-semibold mb-1" style={{ color: C.textPrimary }}>Select a device</div>
                <div className="text-[12.5px] max-w-xs" style={{ color: C.textMuted }}>Choose a server or system from the network tree to view its details and open the control panel</div>
              </div>
            ) : (
              <div key={selectedDevice.id} style={{ animation: 'infoPanelFadeIn 0.25s ease-out' }}>
                <div className="p-6" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{
                      background: selectedDevice.device_type === 'server'
                        ? 'linear-gradient(135deg,#7C5CFC,#A78BFA)'
                        : 'linear-gradient(135deg,#3B6FE0,#16B8A6)'
                    }}>
                      <i className={`ti ${selectedDevice.device_type === 'server' ? 'ti-server-2' : 'ti-device-desktop'} text-white text-[19px]`} aria-hidden="true"></i>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[16px] font-semibold truncate" style={{ color: C.textPrimary }}>{selectedDevice.name}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="relative flex w-1.5 h-1.5">
                          {(selectedDevice.device_type === 'server' || selectedDevice.agent_online) && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: C.success }}></span>
                          )}
                          <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ background: (selectedDevice.device_type === 'server' || selectedDevice.agent_online) ? C.success : '#CBD5E1' }}></span>
                        </span>
                        <span className="text-[12px]" style={{ color: C.textSecondary }}>
                          {selectedDevice.device_type === 'server' ? 'Always online' : selectedDevice.agent_online ? 'Agent online' : 'Agent offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      color: selectedDevice.device_type === 'server' ? C.server : C.system,
                      background: selectedDevice.device_type === 'server' ? C.serverBg : C.systemBg,
                      border: `1px solid ${selectedDevice.device_type === 'server' ? C.serverBorder : C.systemBorder}`,
                    }}>
                    <i className={`ti ${selectedDevice.device_type === 'server' ? 'ti-server-2' : 'ti-device-desktop'} text-[12px]`} aria-hidden="true"></i>
                    {selectedDevice.device_type === 'server' ? 'Server' : 'System'}
                  </span>
                </div>

                <div className="p-5 space-y-3 flex-1">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>Device information</div>
                  {[
                    { icon: 'ti-network', label: 'IP Address', val: selectedDevice.ip_address, mono: true },
                    { icon: 'ti-fingerprint', label: 'MAC Address', val: selectedDevice.mac_address, mono: true },
                    { icon: 'ti-brand-windows', label: 'Operating System', val: selectedDevice.os, mono: false },
                    { icon: 'ti-notes', label: 'Notes', val: selectedDevice.notes, mono: false },
                  ].map(({ icon, label, val, mono }) => (
                    <div key={label} className="rounded-xl px-4 py-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: C.surfaceAlt }}>
                          <i className={`ti ${icon} text-[11px]`} style={{ color: C.textMuted }} aria-hidden="true"></i>
                        </div>
                        <span className="text-[10.5px] uppercase font-semibold tracking-wide" style={{ color: C.textMuted }}>{label}</span>
                      </div>
                      <CopyableValue value={val} mono={mono} style={{ color: C.textPrimary }} className="text-[13.5px]" />
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-5 space-y-2.5">
                  {selectedDevice.device_type === 'server' ? (
                    <button onClick={downloadServerAgent}
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-[13px] font-semibold cursor-pointer border"
                      style={{ color: C.server, background: C.serverBg, borderColor: C.serverBorder }}>
                      <i className="ti ti-download" aria-hidden="true"></i> Server Agent ZIP
                    </button>
                  ) : (
                    <button onClick={() => downloadAgent(selectedDevice.id, selectedDevice.name)}
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-[13px] font-semibold cursor-pointer border"
                      style={{ color: C.system, background: C.systemBg, borderColor: C.systemBorder }}>
                      <i className="ti ti-download" aria-hidden="true"></i> PC Agent ZIP
                    </button>
                  )}
                  <button onClick={() => handleDelete(selectedDevice.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-[13px] font-semibold cursor-pointer border"
                    style={{ color: C.danger, background: C.dangerBg, borderColor: C.dangerBorder }}>
                    <i className="ti ti-trash" aria-hidden="true"></i> Remove Device
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT — Operations Console ═══ */}
          {selectedDevice && (
            <div className="w-full lg:flex-1 flex flex-col lg:overflow-hidden" style={{ background: C.opsBg, animation: 'opsPanelSlideIn 0.35s ease-out' }} key={`ops-${selectedDevice.id}`}>
              {/* Toolbar */}
              <div className="px-6 py-5 shrink-0" style={{ borderBottom: `1px solid ${C.opsBorderSoft}` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.opsSurface, border: `1px solid ${C.opsBorder}` }}>
                      <i className="ti ti-adjustments-horizontal text-[14px]" style={{ color: C.opsAccent }} aria-hidden="true"></i>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[14px] font-semibold truncate block" style={{ color: C.opsText }}>{selectedDevice.name}</span>
                      <span className="text-[11.5px]" style={{ color: C.opsTextFaint }}>
                        {selectedDevice.device_type === 'server' ? 'Server agent · remote control panel' : `PC · ${selectedDevice.ip_address || 'IP not set'}`}
                      </span>
                    </div>
                  </div>
                  {cmdResult && (
                    <button onClick={() => setCmdResult(null)}
                      className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-lg cursor-pointer border-none shrink-0"
                      style={{ background: C.opsSurface, color: C.opsTextMuted, border: `1px solid ${C.opsBorder}` }}>
                      <i className="ti ti-x text-[10px]" aria-hidden="true"></i> Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  <ActionGroup title="Info" groupKey="info" />
                  <ActionGroup title="Server" groupKey="nginx" />
                  <ActionGroup title="Power" groupKey="power" />
                </div>
              </div>

              {/* Results */}
              <div className="lg:flex-1 p-6 flex flex-col lg:overflow-hidden">
                {!cmdResult ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 lg:flex-1 lg:py-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5" style={{ background: C.opsSurface, border: `1px solid ${C.opsBorder}` }}>
                      <i className="ti ti-cursor-text text-2xl" style={{ color: C.opsBorder }} aria-hidden="true"></i>
                    </div>
                    <div className="text-[13.5px] font-medium" style={{ color: '#3D4A6B' }}>Run a command to see results</div>
                    <div className="text-[11.5px] mt-1" style={{ color: C.opsBorder }}>Choose an action above to inspect this device</div>
                  </div>
                ) : cmdResult.type === 'loading' ? (
                  <div className="flex flex-col items-center justify-center py-10 lg:flex-1 lg:py-0">
                    <div className="rounded-2xl p-6 flex flex-col items-center gap-3" style={{ background: C.opsSurface, border: `1px solid ${C.opsBorder}` }}>
                      <i className="ti ti-loader-2 animate-spin text-2xl" style={{ color: C.opsAccent }} aria-hidden="true"></i>
                      <div className="text-[12.5px] font-medium" style={{ color: C.opsAccent }}>Command sent to agent</div>
                      <div className="text-[11.5px]" style={{ color: C.opsTextFaint }}>Waiting for response…</div>
                    </div>
                  </div>
                ) : cmdResult.type === 'error' ? (
                  <div className="flex flex-col items-center justify-center py-10 lg:flex-1 lg:py-0">
                    <div className="rounded-2xl p-6 flex flex-col items-center gap-3 max-w-sm text-center" style={{ background: '#1F1315', border: '1px solid #4A2326' }}>
                      <i className="ti ti-alert-triangle text-2xl" style={{ color: '#F87171' }} aria-hidden="true"></i>
                      <div className="text-[12.5px]" style={{ color: '#FCA5A5' }}>{cmdResult.message}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-1 lg:overflow-hidden">
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                      <i className="ti ti-circle-check-filled text-[13px]" style={{ color: C.success }} aria-hidden="true"></i>
                      <span className="text-[12px] font-medium" style={{ color: C.success }}>Response received</span>
                    </div>
                    <div className="min-h-[320px] lg:min-h-0 lg:flex-1 lg:overflow-hidden">
                      <ResultUI cmd={lastCmd} raw={cmdResult.raw} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ SCRIPT MODAL ═══ */}
      {showScript && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(14,21,38,0.55)', backdropFilter: 'blur(2px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 20px 50px -12px rgba(16,24,40,0.25)' }}>
            <div className="flex items-center gap-2 mb-1">
              <i className="ti ti-terminal-2 text-[15px]" style={{ color: C.brandFrom }} aria-hidden="true"></i>
              <div className="text-[14.5px] font-semibold" style={{ color: C.textPrimary }}>Run PowerShell script</div>
            </div>
            <div className="text-[12px] mb-3.5" style={{ color: C.textSecondary }}>on <span className="font-medium">{selectedDevice?.name}</span></div>
            <textarea value={scriptInput} onChange={e => setScriptInput(e.target.value)}
              placeholder="Get-Process | Sort-Object CPU -Descending | Select-Object -First 5"
              className="w-full h-36 rounded-xl px-3.5 py-3 text-[12.5px] font-mono outline-none resize-none"
              style={{ border: `1px solid ${C.border}`, background: C.opsSurfaceAlt, color: '#CBD5E1' }} />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowScript(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                style={{ color: C.textSecondary, border: `1px solid ${C.border}`, background: C.surface }}>Cancel</button>
              <button onClick={handleRunScript} disabled={!scriptInput.trim()}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white border-none cursor-pointer disabled:opacity-40 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
                <i className="ti ti-player-play-filled text-[11px] mr-1" aria-hidden="true"></i>Run Script
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD DEVICE MODAL ═══ */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(14,21,38,0.55)', backdropFilter: 'blur(2px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 20px 50px -12px rgba(16,24,40,0.25)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="text-[14.5px] font-semibold" style={{ color: C.textPrimary }}>Add new device</div>
              <button onClick={() => setShowAdd(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer transition-colors"
                style={{ color: C.textMuted }}>
                <i className="ti ti-x text-base" aria-hidden="true"></i>
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              {['server', 'system'].map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, device_type: t }))}
                  className="flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold cursor-pointer capitalize transition-all border"
                  style={form.device_type === t
                    ? (t === 'server'
                      ? { background: C.serverBg, color: C.server, borderColor: C.serverBorder }
                      : { background: C.systemBg, color: C.system, borderColor: C.systemBorder })
                    : { background: C.surfaceAlt, color: C.textMuted, borderColor: C.border }
                  }>
                  <i className={`ti ${t === 'server' ? 'ti-server-2' : 'ti-device-desktop'} mr-1`} aria-hidden="true"></i>{t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls} style={{ color: C.textSecondary }}>Device name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={form.device_type === 'server' ? 'EasyLearningERP-SRV' : 'PC-Lab-01'}
                  className={inputCls} style={{ borderColor: C.border, color: C.textPrimary }} />
              </div>
              <div>
                <label className={labelCls} style={{ color: C.textSecondary }}>IP address</label>
                <input value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))}
                  placeholder="192.168.12.21" className={`${inputCls} font-mono`} style={{ borderColor: C.border, color: C.textPrimary }} />
              </div>
              <div>
                <label className={labelCls} style={{ color: C.textSecondary }}>MAC address</label>
                <input value={form.mac_address} onChange={e => setForm(f => ({ ...f, mac_address: e.target.value }))}
                  placeholder="AA:BB:CC:DD:EE:FF" className={`${inputCls} font-mono`} style={{ borderColor: C.border, color: C.textPrimary }} />
              </div>
              <div>
                <label className={labelCls} style={{ color: C.textSecondary }}>OS</label>
                <input value={form.os} onChange={e => setForm(f => ({ ...f, os: e.target.value }))}
                  placeholder="Windows 11 Pro" className={inputCls} style={{ borderColor: C.border, color: C.textPrimary }} />
              </div>
              <div>
                <label className={labelCls} style={{ color: C.textSecondary }}>Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional" className={inputCls} style={{ borderColor: C.border, color: C.textPrimary }} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                style={{ color: C.textSecondary, border: `1px solid ${C.border}`, background: C.surface }}>Cancel</button>
              <button onClick={handleAdd} disabled={!form.name}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white border-none cursor-pointer disabled:opacity-40 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
                <i className="ti ti-check text-[12px] mr-1" aria-hidden="true"></i>Add device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}