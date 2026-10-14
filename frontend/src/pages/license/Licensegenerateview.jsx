import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLicense, getLicenses, getSchoolsList } from '../../api/license'

const INK = '#1A1A18'
const SUB = '#5C5C57'
const BG = '#E8E8E3'

const inputStyle = { borderColor: INK + '33', color: INK }

export default function LicenseGenerateView() {
  const navigate = useNavigate()
  const [schools, setSchools] = useState([])
  const [licensedSchoolIds, setLicensedSchoolIds] = useState(new Set())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  const [form, setForm] = useState({
    organization_type: 'School',
    organization_id: '',
    max_students: 1000,
    max_mentors: 100,
    max_classrooms: 50,
    subscription_type: 'yearly',
    subscription_months: 12,
    start_date: new Date().toISOString().slice(0, 10),
    grace_period_days: 7,
    notes: '',
  })

  useEffect(() => {
    Promise.all([getSchoolsList(), getLicenses()])
      .then(([schoolList, licenseList]) => {
        setSchools(schoolList)
        setLicensedSchoolIds(new Set(
          licenseList.filter(l => l.status === 'active' && l.organization_id).map(l => l.organization_id)
        ))
      })
      .catch(e => setError(e.message))
  }, [])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setResult(null)
    try {
      const payload = {
        ...form,
        organization_id: form.organization_id ? Number(form.organization_id) : null,
        max_students: Number(form.max_students),
        max_mentors: form.max_mentors ? Number(form.max_mentors) : null,
        max_classrooms: form.max_classrooms ? Number(form.max_classrooms) : null,
        subscription_months: Number(form.subscription_months),
        grace_period_days: Number(form.grace_period_days),
      }
      const res = await createLicense(payload)
      setResult(res)
    } catch (e2) {
      setError(e2.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8" style={{ background: BG, minHeight: '100%' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight" style={{ color: INK }}>
          <i className="ti ti-plus mr-2" aria-hidden="true"></i>Generate License
        </h2>
        <p className="text-sm mt-1.5" style={{ color: SUB }}>Create a new license key and assign it to an organization</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white border p-6" style={{ borderColor: INK + '1A' }}>
          {error && (
            <div className="mb-4 px-4 py-3 text-[13px] border" style={{ background: '#FDECEC', borderColor: '#E8A5A5', color: '#8A2A2A' }}>
              {error}
            </div>
          )}

          {result ? (
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: INK }}>License Generated</p>
              <p className="text-sm mb-1" style={{ color: SUB }}>License Key</p>
              <p className="font-mono text-lg px-3 py-2 mb-4" style={{ background: BG, color: INK }}>{result.license_key}</p>
              <div className="flex gap-3">
                <button onClick={() => navigate('/license/manage')} className="px-4 py-2.5 text-[13px] font-semibold text-white" style={{ background: INK }}>
                  View All Licenses
                </button>
                <button onClick={() => { setResult(null) }} className="px-4 py-2.5 text-[13px] font-semibold border" style={{ borderColor: INK + '33', color: INK }}>
                  Generate Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Organization Type *</label>
                  <select className="w-full px-3.5 py-2.5 text-sm border outline-none" style={inputStyle} value={form.organization_type} onChange={set('organization_type')} required>
                    <option value="School">School</option>
                    <option value="College">College</option>
                    <option value="University">University</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Assign to Organization (Optional)</label>
                  <select className="w-full px-3.5 py-2.5 text-sm border outline-none" style={inputStyle} value={form.organization_id} onChange={set('organization_id')}>
                    <option value="">-- Select Later --</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id} disabled={licensedSchoolIds.has(s.id)}>
                        {s.name} {licensedSchoolIds.has(s.id) ? '(Already Licensed)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Max Students *</label>
                  <input type="number" min="1" required className="w-full px-3.5 py-2.5 text-sm border outline-none" style={inputStyle} value={form.max_students} onChange={set('max_students')} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Max Mentors</label>
                  <input type="number" min="1" className="w-full px-3.5 py-2.5 text-sm border outline-none" style={inputStyle} value={form.max_mentors} onChange={set('max_mentors')} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Max Classrooms</label>
                  <input type="number" min="1" className="w-full px-3.5 py-2.5 text-sm border outline-none" style={inputStyle} value={form.max_classrooms} onChange={set('max_classrooms')} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Subscription Type *</label>
                  <select className="w-full px-3.5 py-2.5 text-sm border outline-none" style={inputStyle} value={form.subscription_type} onChange={set('subscription_type')} required>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Duration (Months) *</label>
                  <input type="number" min="1" required className="w-full px-3.5 py-2.5 text-sm border outline-none" style={inputStyle} value={form.subscription_months} onChange={set('subscription_months')} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Start Date *</label>
                  <input type="date" required className="w-full px-3.5 py-2.5 text-sm border outline-none" style={inputStyle} value={form.start_date} onChange={set('start_date')} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Grace Period (Days)</label>
                  <input type="number" min="0" className="w-full px-3.5 py-2.5 text-sm border outline-none" style={inputStyle} value={form.grace_period_days} onChange={set('grace_period_days')} />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>Notes</label>
                <textarea rows="3" className="w-full px-3.5 py-2.5 text-sm border outline-none" style={inputStyle} value={form.notes} onChange={set('notes')} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60" style={{ background: INK }}>
                  {saving ? 'Generating…' : 'Generate License'}
                </button>
                <button type="button" onClick={() => navigate('/license')} className="px-5 py-2.5 text-[13px] font-semibold border" style={{ borderColor: INK + '33', color: INK }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white border p-6" style={{ borderColor: INK + '1A' }}>
          <h3 className="text-[13px] font-bold uppercase tracking-wider mb-4" style={{ color: INK }}>License Preview</h3>
          <p className="text-[12.5px] font-semibold" style={{ color: SUB }}>Capacity</p>
          <ul className="text-sm mt-1 mb-4" style={{ color: INK }}>
            <li>Students: {form.max_students || 0}</li>
            <li>Mentors: {form.max_mentors || 0}</li>
            <li>Classrooms: {form.max_classrooms || 0}</li>
          </ul>
          <p className="text-[12.5px] font-semibold" style={{ color: SUB }}>Subscription</p>
          <p className="text-sm mt-1" style={{ color: INK }}>{form.subscription_type} ({form.subscription_months} months)</p>
        </div>
      </div>
    </div>
  )
}