import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDevices, addDevice, deleteDevice } from '../../api/devices'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'
import SchoolCards from '../../components/mdm/SchoolCards'

/* Same tokens as Login.jsx / MdmHub.jsx — kept identical so every page in the app matches. */
const INK = '#1A1A18'
const SUB = '#5C5C57'
const MUTED = '#8A8A85'

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
    try {
      await deleteDevice(schoolId, deviceId)
      load(schoolId)
    } catch (err) {
      console.error(err)
    }
  }

  const downloadAgentZip = async (deviceId, deviceName) => {
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
    }
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      <style>{`
        .ev-row { transition: box-shadow 150ms ease, border-color 150ms ease; }
        .ev-row:hover { box-shadow: 0 6px 18px -10px rgba(16,24,40,0.14); border-color: ${INK}33; }
        .ev-btn { transition: filter 120ms ease, transform 120ms ease, opacity 150ms ease; }
        .ev-btn:active:not(:disabled) { transform: scale(0.98); }
        .ev-input:focus { outline: none; border-color: ${INK} !important; box-shadow: 0 0 0 3px rgba(26,26,24,0.08); }
      `}</style>
      <Topbar C={C} />
      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 px-7 py-7 max-w-5xl">
          <button onClick={() => schoolId ? setSchoolId(null) : navigate('/mdm')}
            className="flex items-center gap-1.5 text-[12.5px] font-medium mb-4 cursor-pointer bg-transparent border-none"
            style={{ color: C.textSecondary }}>
            <i className="ti ti-arrow-left text-[13px]" aria-hidden="true"></i>
            {schoolId ? 'Back to schools' : 'Back to MDM'}
          </button>

          {!schoolId ? (
            // STEP 1 — pick (or create) a school/college first.
            <SchoolCards C={C} onSelect={selectSchool}
              title="Device enrollment & provisioning"
              subtitle="Choose a school or college to manage its devices" />
          ) : (
            // STEP 2 — devices that belong to the selected school.
            <>
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
                style={{ background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
                <i className="ti ti-building-community text-[13px]" style={{ color: C.textPrimary }} aria-hidden="true"></i>
                <span className="text-[12px] font-semibold" style={{ color: C.textPrimary }}>{schoolName}</span>
              </div>

              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h1 className="text-[20px] font-extrabold tracking-tight" style={{ color: C.textPrimary }}>Server & devices</h1>
                  <p className="text-[13px] mt-1" style={{ color: C.textSecondary }}>Add, list, and remove devices under {schoolName}</p>
                </div>
                <button onClick={() => setShowAdd(true)}
                  className="ev-btn flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold uppercase tracking-wide text-white border-none cursor-pointer shrink-0"
                  style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <i className="ti ti-plus text-[14px]" aria-hidden="true"></i> Add device
                </button>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-10" style={{ color: C.textSecondary }}>
                  <i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Loading…
                </div>
              ) : devices.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: C.surface, border: `1px dashed ${C.borderStrong}` }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: C.surfaceAlt }}>
                    <i className="ti ti-server-2 text-[18px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
                  </div>
                  <p className="text-[13px]" style={{ color: C.textSecondary }}>No devices yet — add the first one for {schoolName}.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {devices.map((d) => (
                    <div key={d.id} className="ev-row flex items-center justify-between rounded-2xl px-5 py-4"
                      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.systemBg }}>
                          <i className={`ti ${d.device_type === 'server' ? 'ti-server-2' : 'ti-device-desktop'} text-[16px]`} style={{ color: C.textSecondary }} aria-hidden="true"></i>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-[13.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{d.name}</div>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                              style={{ color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                              {d.device_type}
                            </span>
                          </div>
                          <div className="text-[11.5px] font-mono mt-0.5" style={{ color: C.textMuted }}>{d.ip_address || 'no IP set'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => downloadAgentZip(d.id, d.name)}
                          className="ev-btn text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                          style={{ color: C.textPrimary, background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
                          <i className="ti ti-download mr-1" aria-hidden="true"></i>Agent ZIP
                        </button>
                        <button onClick={() => handleDelete(d.id)}
                          className="ev-btn text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                          style={{ color: C.danger, background: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
                          <i className="ti ti-trash mr-1" aria-hidden="true"></i>Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(26,26,24,0.55)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md mx-4" style={{ background: C.surface, border: `1px solid ${INK}1A`, boxShadow: '0 24px 48px -16px rgba(26,26,24,0.35)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-extrabold tracking-tight" style={{ color: C.textPrimary }}>Add new device</h2>
              <button onClick={() => setShowAdd(false)} className="cursor-pointer bg-transparent border-none" style={{ color: C.textMuted }}>
                <i className="ti ti-x text-[18px]" aria-hidden="true"></i>
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {['server', 'system'].map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, device_type: t }))}
                  className="ev-btn flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold capitalize cursor-pointer"
                  style={form.device_type === t
                    ? { background: C.textPrimary, color: '#fff', border: `1px solid ${C.textPrimary}` }
                    : { background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}` }}>
                  <i className={`ti ${t === 'server' ? 'ti-server-2' : 'ti-device-desktop'} mr-1`} aria-hidden="true"></i>{t}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <input placeholder="Device name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="ev-input text-[13px] px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.textPrimary }} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="IP address" value={form.ip_address}
                  onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))}
                  className="ev-input text-[13px] px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.textPrimary }} />
                <input placeholder="MAC address" value={form.mac_address}
                  onChange={e => setForm(f => ({ ...f, mac_address: e.target.value }))}
                  className="ev-input text-[13px] px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.textPrimary }} />
              </div>
              <input placeholder="OS (optional)" value={form.os}
                onChange={e => setForm(f => ({ ...f, os: e.target.value }))}
                className="ev-input text-[13px] px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.textPrimary }} />
              <input placeholder="Notes (optional)" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="ev-input text-[13px] px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.textPrimary }} />
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdd(false)}
                className="ev-btn flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer"
                style={{ color: C.textSecondary, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                className="ev-btn flex-1 py-2.5 rounded-xl text-[13px] font-bold uppercase tracking-wide text-white cursor-pointer disabled:cursor-not-allowed border-none"
                style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})`, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Adding…' : 'Add device'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}