import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDevices, addDevice, deleteDevice } from '../../api/devices'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import Sidebar from '../../components/common/Sidebar'
import Topbar from '../../components/common/Topbar'
import SchoolCards from '../../components/mdm/SchoolCards'

/* Same tokens as Dashboard.jsx — kept identical so every page in the app matches. */
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
  danger: '#E4483C',
  dangerBg: '#FEF1F0',
  dangerBorder: '#FBD5D2',
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
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      <Topbar C={C} />
      <div className="flex" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <Sidebar C={C} activeKey="mdm" />

        <div className="flex-1 px-7 py-7 max-w-4xl">
          <button onClick={() => schoolId ? setSchoolId(null) : navigate('/mdm')}
            className="flex items-center gap-1.5 text-[12.5px] font-medium mb-4"
            style={{ color: C.textSecondary }}>
            <i className="ti ti-arrow-left text-[13px]" aria-hidden="true"></i>
            {schoolId ? 'Back to schools' : 'Back to MDM'}
          </button>

          {!schoolId ? (
            // STEP 1 — pick (or create) a school/college first.
            <SchoolCards C={C} onSelect={selectSchool}
              title="Device Enrollment & Provisioning"
              subtitle="Choose a school or college to manage its devices" />
          ) : (
            // STEP 2 — devices that belong to the selected school.
            <>
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
                style={{ background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
                <i className="ti ti-building-community text-[13px]" style={{ color: C.brandFrom }} aria-hidden="true"></i>
                <span className="text-[12px] font-semibold" style={{ color: C.brandFrom }}>{schoolName}</span>
              </div>

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-[20px] font-semibold" style={{ color: C.textPrimary }}>Server & Devices</h1>
                  <p className="text-[13px] mt-1" style={{ color: C.textSecondary }}>Add, list, and remove devices under {schoolName}</p>
                </div>
                <button onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
                  <i className="ti ti-plus text-[14px]" aria-hidden="true"></i> Add device
                </button>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-10" style={{ color: C.textSecondary }}>
                  <i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Loading…
                </div>
              ) : devices.length === 0 ? (
                <div className="rounded-2xl p-10 text-center" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <p className="text-[13px]" style={{ color: C.textSecondary }}>No devices yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {devices.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-2xl px-5 py-4"
                      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>{d.name}</div>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                            {d.device_type}
                          </span>
                        </div>
                        <div className="text-[11.5px] font-mono mt-0.5" style={{ color: C.textMuted }}>{d.ip_address || 'no IP set'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => downloadAgentZip(d.id, d.name)}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                          style={{ color: C.brandFrom, background: C.systemBg, border: `1px solid ${C.systemBorder}` }}>
                          <i className="ti ti-download mr-1" aria-hidden="true"></i>Agent ZIP
                        </button>
                        <button onClick={() => handleDelete(d.id)}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg"
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
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(16,24,40,0.45)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md mx-4" style={{ background: C.surface }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-semibold" style={{ color: C.textPrimary }}>Add new device</h2>
              <button onClick={() => setShowAdd(false)} style={{ color: C.textMuted }}>
                <i className="ti ti-x text-[18px]" aria-hidden="true"></i>
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {['server', 'system'].map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, device_type: t }))}
                  className="flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold capitalize"
                  style={form.device_type === t
                    ? { background: C.systemBg, color: C.brandFrom, border: `1px solid ${C.systemBorder}` }
                    : { background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}` }}>
                  <i className={`ti ${t === 'server' ? 'ti-server-2' : 'ti-device-desktop'} mr-1`} aria-hidden="true"></i>{t}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <input placeholder="Device name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="text-[13px] px-3 py-2.5 rounded-xl outline-none" style={{ border: `1px solid ${C.border}` }} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="IP address" value={form.ip_address}
                  onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))}
                  className="text-[13px] px-3 py-2.5 rounded-xl outline-none" style={{ border: `1px solid ${C.border}` }} />
                <input placeholder="MAC address" value={form.mac_address}
                  onChange={e => setForm(f => ({ ...f, mac_address: e.target.value }))}
                  className="text-[13px] px-3 py-2.5 rounded-xl outline-none" style={{ border: `1px solid ${C.border}` }} />
              </div>
              <input placeholder="OS (optional)" value={form.os}
                onChange={e => setForm(f => ({ ...f, os: e.target.value }))}
                className="text-[13px] px-3 py-2.5 rounded-xl outline-none" style={{ border: `1px solid ${C.border}` }} />
              <input placeholder="Notes (optional)" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="text-[13px] px-3 py-2.5 rounded-xl outline-none" style={{ border: `1px solid ${C.border}` }} />
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ color: C.textSecondary, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white"
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