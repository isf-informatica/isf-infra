import { useEffect, useState } from 'react'
import { getLicenses, getSchoolsList, assignLicense, unassignLicenseCompat } from '../../api/license'

const INK = '#1A1A18'
const SUB = '#5C5C57'
const BG = '#E8E8E3'

export default function LicenseAssignView() {
  const [schools, setSchools] = useState([])
  const [licenses, setLicenses] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [picker, setPicker] = useState(null) // school id currently choosing a license for

  const load = () => {
    Promise.all([getSchoolsList(), getLicenses()])
      .then(([s, l]) => { setSchools(s); setLicenses(l) })
      .catch(e => setError(e.message))
  }

  useEffect(load, [])

  const licenseFor = (schoolId) => licenses.find(l => l.organization_id === schoolId && l.status === 'active')
  const availableLicenses = licenses.filter(l => !l.organization_id)

  const handleAssign = async (schoolId, licenseId) => {
    setBusyId(schoolId)
    try {
      await assignLicense(licenseId, schoolId)
      setPicker(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (licenseId, schoolId) => {
    if (!window.confirm('Remove this license from the school?')) return
    setBusyId(schoolId)
    try {
      await unassignLicenseCompat(licenseId)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-8" style={{ background: BG, minHeight: '100%' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight" style={{ color: INK }}>
          <i className="ti ti-building-community mr-2" aria-hidden="true"></i>Assign to Schools
        </h2>
        <p className="text-sm mt-1.5" style={{ color: SUB }}>Distribute available licenses to institutions</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 text-[13px] border" style={{ background: '#FDECEC', borderColor: '#E8A5A5', color: '#8A2A2A' }}>
          {error}
        </div>
      )}

      <div className="bg-white border overflow-x-auto" style={{ borderColor: INK + '1A' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: INK + '1A' }}>
              {['School', 'License Key', 'Status', 'Expires', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 font-semibold uppercase tracking-wide text-[11px]" style={{ color: SUB }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schools.map(s => {
              const lic = licenseFor(s.id)
              return (
                <tr key={s.id} className="border-b" style={{ borderColor: INK + '0D' }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: INK }}>{s.name}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: INK }}>{lic ? lic.license_key : <em style={{ color: SUB }}>Not Licensed</em>}</td>
                  <td className="px-4 py-3" style={{ color: SUB }}>{lic ? lic.status : '—'}</td>
                  <td className="px-4 py-3" style={{ color: SUB }}>{lic ? lic.subscription_end_date : '—'}</td>
                  <td className="px-4 py-3">
                    {lic ? (
                      <button disabled={busyId === s.id} onClick={() => handleRemove(lic.id, s.id)}
                        className="text-[12.5px] font-semibold" style={{ color: '#8A2A2A' }}>
                        Remove
                      </button>
                    ) : (
                      <div className="relative inline-block">
                        <button onClick={() => setPicker(picker === s.id ? null : s.id)}
                          className="px-3 py-1.5 text-[12.5px] font-semibold text-white" style={{ background: INK }}>
                          Assign License
                        </button>
                        {picker === s.id && (
                          <div className="absolute z-10 mt-1 bg-white border shadow-lg min-w-[220px]" style={{ borderColor: INK + '1A' }}>
                            {availableLicenses.length === 0 && (
                              <p className="px-3 py-2 text-[12.5px]" style={{ color: SUB }}>No unassigned licenses. Generate one first.</p>
                            )}
                            {availableLicenses.map(l => (
                              <button key={l.id} onClick={() => handleAssign(s.id, l.id)}
                                className="block w-full text-left px-3 py-2 text-[12.5px] font-mono hover:bg-gray-50" style={{ color: INK }}>
                                {l.license_key}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}