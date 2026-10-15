import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDevices, addDevice, deleteDevice } from '../../api/devices'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'
import SchoolCards from '../../components/mdm/SchoolCards'

/* Shell tokens are identical to Login.jsx / MdmHub.jsx so Topbar/Sidebar match.
   Page accent = blue, same as the Device Enrollment card on the MDM hub. */
const INK = '#1A1A18'
const SUB = '#5C5C57'
const MUTED = '#8A8A85'

const BLUE = '#2563EB'
const BLUE_DEEP = '#1D4ED8'
const BLUE_LIGHT = '#60A5FA'
const BLUE_BG = '#EFF6FF'
const BLUE_BORDER = '#BFDBFE'
const GRADIENT = `linear-gradient(135deg, ${BLUE}, ${BLUE_LIGHT})`

// Server rows get indigo so they stand apart from systems at a glance.
const TYPE_META = {
  server: { label: 'Server', icon: 'ti-server-2', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
  system: { label: 'System', icon: 'ti-device-desktop', color: BLUE, bg: BLUE_BG, border: BLUE_BORDER },
}

const C = {
  bgApp: '#E8E8E3',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F2EE',
  border: INK + '1F',
  borderStrong: INK + '3D',
  textPrimary: INK,
  textSecondary: SUB,
  textMuted: MUTED,
  brandFrom: INK,
  brandTo: '#3A3A36',
  systemBg: '#F2F2EE',
  systemBorder: INK + '3D',
  danger: '#8A2A2A',
  dangerBg: '#FBEAE9',
  dangerBorder: '#EFC4C1',
}

// SchoolCards uses brandFrom/brandTo for the school avatar — blue on this page only.
const SCHOOL_C = { ...C, brandFrom: BLUE, brandTo: BLUE_LIGHT }

const EMPTY_FORM = { name: '', device_type: 'system', ip_address: '', mac_address: '', os: '', notes: '' }

export default function EnrollmentView() {
  const navigate = useNavigate()
  const token = useAuthStore(state => state.token)
  const [schoolId, setSchoolId] = useState(null)
  const [schoolName, setSchoolName] = useState('')
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = (id) => {
    setLoading(true)
    getDevices(id)
      .then(data => {
        // Actual API shape: { server: [...], systems: [...] } — combine both
        // into a single flat list for this page.
        const list = [...(data?.server || []), ...(data?.systems || [])]
        setDevices(list)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const selectSchool = (id, name) => {
    setSchoolId(id)
    setSchoolName(name)
    load(id)
  }

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      // Field names confirmed against the existing Devices.jsx implementation.
      await addDevice(schoolId, form)
      setForm(EMPTY_FORM)
      setShowAdd(false)
      load(schoolId)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (deviceId) => {
    setBusyId('del-' + deviceId)
    try {
      await deleteDevice(schoolId, deviceId)
      load(schoolId)
    } catch (err) {
      console.error(err)
    } finally {
      setBusyId(null)
    }
  }

  const downloadAgentZip = async (deviceId, deviceName) => {
    setBusyId('zip-' + deviceId)
    try {
      const base = api.defaults?.baseURL || ''
      const res = await fetch(`${base}/schools/${schoolId}/devices/${deviceId}/generate-agent`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `easyreach_agent_${deviceName}.zip`; a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Failed to download agent ZIP')
    } finally {
      setBusyId(null)
    }
  }

  // Close modal on Escape
  useEffect(() => {
    if (!showAdd) return
    const onKey = (e) => e.key === 'Escape' && setShowAdd(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showAdd])

  const serverCount = devices.filter(d => d.device_type === 'server').length
  const systemCount = devices.length - serverCount

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <style>{`
        .ev-row { transition: box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease; }
        .ev-row:hover { box-shadow: 0 12px 24px -16px ${BLUE}66; border-color: ${BLUE}55; }
        .ev-btn { transition: filter 120ms ease, transform 120ms ease, opacity 150ms ease; }
        .ev-btn:hover:not(:disabled) { filter: brightness(0.97); transform: translateY(-1px); }
        .ev-btn:active:not(:disabled) { transform: scale(0.98); }
        .ev-input:focus { outline: none; border-color: ${BLUE} !important; box-shadow: 0 0 0 3px ${BLUE}22; }
        .ev-pop { animation: evPop 200ms cubic-bezier(.2,.9,.3,1.2) both; }
        @keyframes evPop { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: none } }
      `}</style>
      <Topbar C={C} />
      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 px-7 py-7 max-w-6xl">
          <button onClick={() => schoolId ? setSchoolId(null) : navigate('/mdm')}
            className="flex items-center gap-1.5 text-[12.5px] font-medium mb-4 cursor-pointer bg-transparent border-none"
            style={{ color: C.textSecondary }}>
            <i className="ti ti-arrow-left text-[13px]" aria-hidden="true"></i>
            {schoolId ? 'Back to schools' : 'Back to MDM'}
          </button>

          {/* Page header — same pattern as the other MDM module pages */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: GRADIENT, boxShadow: `0 10px 22px -10px ${BLUE}` }}>
                <i className="ti ti-plug-connected text-[22px] text-white" aria-hidden="true"></i>
              </div>
              <div>
                <h1 className="text-[20px] font-extrabold uppercase tracking-tight" style={{ color: C.textPrimary }}>
                  {schoolId ? 'Server & devices' : 'Device enrollment & provisioning'}
                </h1>
                <p className="text-[13px] mt-0.5" style={{ color: C.textSecondary }}>
                  {schoolId ? `Add, list and remove devices under ${schoolName}` : 'Choose a school or college to manage its devices'}
                </p>
              </div>
            </div>
            {schoolId && (
              <button onClick={() => setShowAdd(true)}
                className="ev-btn flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold uppercase tracking-wide text-white border-none cursor-pointer shrink-0"
                style={{ background: GRADIENT, boxShadow: `0 10px 20px -10px ${BLUE}` }}>
                <i className="ti ti-plus text-[14px]" aria-hidden="true"></i> Add device
              </button>
            )}
          </div>

          {!schoolId ? (
            // STEP 1 — pick (or create) a school/college first.
            <SchoolCards C={SCHOOL_C} accent={BLUE} onSelect={selectSchool} hideHeader
              title="Device enrollment & provisioning"
              subtitle="Choose a school or college to manage its devices" />
          ) : (
            // STEP 2 — devices that belong to the selected school.
            <>
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
                style={{ background: BLUE_BG, border: `1px solid ${BLUE_BORDER}` }}>
                <i className="ti ti-building-community text-[13px]" style={{ color: BLUE_DEEP }} aria-hidden="true"></i>
                <span className="text-[12px] font-semibold" style={{ color: BLUE_DEEP }}>{schoolName}</span>
              </div>

              {/* Counts from the real device list */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Total devices', value: devices.length, icon: 'ti-devices', color: BLUE, bg: BLUE_BG },
                  { label: 'Servers', value: serverCount, icon: TYPE_META.server.icon, color: TYPE_META.server.color, bg: TYPE_META.server.bg },
                  { label: 'Systems', value: systemCount, icon: TYPE_META.system.icon, color: '#0891B2', bg: '#ECFEFF' },
                ].map(k => (
                  <div key={k.label} className="rounded-2xl p-5 flex items-center justify-between" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>{k.label}</div>
                      <div className="text-[26px] font-extrabold leading-none mt-2" style={{ color: C.textPrimary }}>{loading ? '—' : k.value}</div>
                    </div>
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                      <i className={`ti ${k.icon} text-[18px]`} style={{ color: k.color }} aria-hidden="true"></i>
                    </span>
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-10" style={{ color: C.textSecondary }}>
                  <i className="ti ti-loader-2 animate-spin" style={{ color: BLUE }} aria-hidden="true"></i> Loading devices…
                </div>
              ) : devices.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: C.surface, border: `1px dashed ${BLUE}66` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: BLUE_BG }}>
                    <i className="ti ti-server-2 text-[20px]" style={{ color: BLUE }} aria-hidden="true"></i>
                  </div>
                  <p className="text-[13px] mb-4" style={{ color: C.textSecondary }}>No devices yet — add the first one for {schoolName}.</p>
                  <button onClick={() => setShowAdd(true)}
                    className="ev-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold text-white border-none cursor-pointer"
                    style={{ background: GRADIENT }}>
                    <i className="ti ti-plus text-[13px]" aria-hidden="true"></i> Add device
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>Enrolled devices</span>
                    <span className="text-[11px] font-semibold" style={{ color: C.textMuted }}>{devices.length} total</span>
                  </div>
                  {devices.map((d) => {
                    const t = TYPE_META[d.device_type] || TYPE_META.system
                    return (
                      <div key={d.id} className="ev-row flex items-center justify-between gap-4 px-5 py-4"
                        style={{ borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${t.color}` }}>
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
                            <i className={`ti ${t.icon} text-[18px]`} style={{ color: t.color }} aria-hidden="true"></i>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-[13.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{d.name}</div>
                              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
                                style={{ color: t.color, background: t.bg, border: `1px solid ${t.border}` }}>
                                {t.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11.5px] flex-wrap" style={{ color: C.textMuted }}>
                              <span className="flex items-center gap-1 font-mono"><i className="ti ti-network text-[12px]" aria-hidden="true"></i>{d.ip_address || 'no IP set'}</span>
                              {d.mac_address && <span className="flex items-center gap-1 font-mono"><i className="ti ti-fingerprint text-[12px]" aria-hidden="true"></i>{d.mac_address}</span>}
                              {d.os && <span className="flex items-center gap-1"><i className="ti ti-brand-windows text-[12px]" aria-hidden="true"></i>{d.os}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => downloadAgentZip(d.id, d.name)} disabled={busyId === 'zip-' + d.id}
                            className="ev-btn text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                            style={{ color: BLUE_DEEP, background: BLUE_BG, border: `1px solid ${BLUE_BORDER}` }}>
                            <i className={`ti ${busyId === 'zip-' + d.id ? 'ti-loader-2 animate-spin' : 'ti-download'} mr-1`} aria-hidden="true"></i>Agent ZIP
                          </button>
                          <button onClick={() => handleDelete(d.id)} disabled={busyId === 'del-' + d.id}
                            className="ev-btn text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                            style={{ color: C.danger, background: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
                            <i className={`ti ${busyId === 'del-' + d.id ? 'ti-loader-2 animate-spin' : 'ti-trash'} mr-1`} aria-hidden="true"></i>Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(26,26,24,0.5)', backdropFilter: 'blur(3px)' }}
          onMouseDown={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="ev-pop rounded-2xl w-full max-w-md overflow-hidden" style={{ background: C.surface, boxShadow: '0 30px 60px -20px rgba(26,26,24,0.45)' }}>
            <div className="h-1.5" style={{ background: GRADIENT }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BLUE_BG }}>
                    <i className="ti ti-plus text-[16px]" style={{ color: BLUE }} aria-hidden="true"></i>
                  </span>
                  <div>
                    <h2 className="text-[16px] font-extrabold tracking-tight" style={{ color: C.textPrimary }}>Add new device</h2>
                    <p className="text-[11.5px]" style={{ color: C.textMuted }}>{schoolName}</p>
                  </div>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-none" style={{ background: C.surfaceAlt, color: C.textSecondary }}>
                  <i className="ti ti-x text-[15px]" aria-hidden="true"></i>
                </button>
              </div>

              <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.textPrimary }}>Device type</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['server', 'system'].map(t => {
                  const m = TYPE_META[t]
                  const on = form.device_type === t
                  return (
                    <button key={t} onClick={() => setForm(f => ({ ...f, device_type: t }))}
                      className="ev-btn flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-semibold cursor-pointer"
                      style={on
                        ? { background: m.bg, color: m.color, border: `1.5px solid ${m.color}` }
                        : { background: C.surface, color: C.textMuted, border: `1px solid ${C.border}` }}>
                      <i className={`ti ${m.icon} text-[14px]`} aria-hidden="true"></i>{m.label}
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-col gap-3">
                <label className="block">
                  <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.textPrimary }}>Device name <span style={{ color: C.danger }}>*</span></div>
                  <input autoFocus placeholder="e.g. IOE-TNPLAB" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="ev-input w-full text-[13px] px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.borderStrong}`, color: C.textPrimary }} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.textPrimary }}>IP address</div>
                    <input placeholder="192.168.12.222" value={form.ip_address}
                      onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))}
                      className="ev-input w-full font-mono text-[12.5px] px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.borderStrong}`, color: C.textPrimary }} />
                  </label>
                  <label className="block">
                    <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.textPrimary }}>MAC address</div>
                    <input placeholder="AA:BB:CC:DD:EE:FF" value={form.mac_address}
                      onChange={e => setForm(f => ({ ...f, mac_address: e.target.value }))}
                      className="ev-input w-full font-mono text-[12.5px] px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.borderStrong}`, color: C.textPrimary }} />
                  </label>
                </div>
                <label className="block">
                  <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.textPrimary }}>OS <span className="font-normal" style={{ color: C.textMuted }}>(optional)</span></div>
                  <input placeholder="Windows 11 / Android 13" value={form.os}
                    onChange={e => setForm(f => ({ ...f, os: e.target.value }))}
                    className="ev-input w-full text-[13px] px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.borderStrong}`, color: C.textPrimary }} />
                </label>
                <label className="block">
                  <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.textPrimary }}>Notes <span className="font-normal" style={{ color: C.textMuted }}>(optional)</span></div>
                  <input placeholder="Location, lab, room…" value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="ev-input w-full text-[13px] px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.borderStrong}`, color: C.textPrimary }} />
                </label>
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowAdd(false)}
                  className="ev-btn flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer"
                  style={{ color: C.textSecondary, background: C.surface, border: `1px solid ${C.border}` }}>
                  Cancel
                </button>
                <button onClick={handleAdd} disabled={saving || !form.name.trim()}
                  className="ev-btn flex-1 py-2.5 rounded-xl text-[13px] font-bold uppercase tracking-wide text-white cursor-pointer disabled:cursor-not-allowed border-none flex items-center justify-center gap-1.5"
                  style={{ background: GRADIENT, opacity: saving || !form.name.trim() ? 0.6 : 1, boxShadow: `0 10px 20px -10px ${BLUE}` }}>
                  {saving ? <><i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Adding…</> : <><i className="ti ti-plus" aria-hidden="true"></i> Add device</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
