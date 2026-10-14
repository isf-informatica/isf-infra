import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSchool } from '../../api/schools'

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
  systemBg: '#F2F2EE',
  systemBorder: INK + '3D',
  success: '#17B26A',
  successBg: '#ECFDF5',
  successBorder: '#A7E9C8',
  danger: '#8A2A2A',
  dangerBg: '#FBEAE9',
  dangerBorder: '#EFC4C1',
}

const inputCls = "w-full rounded-xl px-4 py-2.5 text-[13.5px] outline-none transition-colors"
const labelCls = "block text-[12px] font-medium mb-1.5"

export default function NewSchool() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', code: '', institution_type: 'school',
    contact_name: '', contact_email: '',
    erp_domain: '', storage_domain: '', public_ip: '', lan_ip: '',
    storage_path: 'D:\\MediaStorage', nginx_port: 9006, https_port: 9000,
    ssl_thumbprint: '', sync_interval_min: 15, db_name: '',
  })

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      await createSchool(form)
      navigate(-1)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally { setLoading(false) }
  }

  const steps = ['Institution details', 'Server config', 'Review']
  const typeOptions = [
    { value: 'school', label: 'School', icon: 'ti-school' },
    { value: 'college', label: 'College', icon: 'ti-certificate' },
    { value: 'institute', label: 'Institute', icon: 'ti-building-bank' },
  ]

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bgApp }}>
      {/* Topbar */}
      <div className="flex items-center gap-4 px-7 py-4" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer bg-transparent border-none" style={{ color: C.textSecondary }}>
          <i className="ti ti-arrow-left text-sm" aria-hidden="true"></i> Back
        </button>
        <div className="w-px h-5" style={{ background: C.border }} />
        <div className="text-[14.5px] font-extrabold uppercase tracking-tight" style={{ color: C.textPrimary }}>New institution deployment</div>
      </div>

      <div className="max-w-xl mx-auto py-9 px-6">
        {/* Steps */}
        <div className="flex items-center mb-8">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                  style={
                    step > i + 1 ? { background: C.success, color: '#fff' } :
                    step === i + 1 ? { background: C.brandFrom, color: '#fff' } :
                    { background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted }
                  }>
                  {step > i + 1 ? <i className="ti ti-check text-[13px]" aria-hidden="true"></i> : i + 1}
                </div>
                <span className="text-[12.5px] font-medium hidden sm:inline"
                  style={{ color: step === i + 1 ? C.brandFrom : step > i + 1 ? C.success : C.textMuted }}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className="flex-1 h-px mx-3" style={{ background: step > i + 1 ? C.successBorder : C.border }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 4px 24px -8px rgba(16,24,40,0.08)' }}>

          {step === 1 && (
            <div>
              <div className="text-[14.5px] font-semibold mb-5" style={{ color: C.textPrimary }}>Institution details</div>
              <div className="mb-5">
                <label className={labelCls} style={{ color: C.textSecondary }}>Institution type</label>
                <div className="flex gap-2">
                  {typeOptions.map(({ value, label, icon }) => (
                    <button key={value} onClick={() => update('institution_type', value)}
                      className="flex-1 py-3 rounded-xl text-[12.5px] font-semibold transition-all flex items-center justify-center gap-1.5"
                      style={form.institution_type === value
                        ? { background: C.systemBg, color: C.brandFrom, border: `1.5px solid ${C.brandFrom}` }
                        : { background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}` }}>
                      <i className={`ti ${icon} text-sm`} aria-hidden="true"></i>{label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Institution name', 'name', 'MBSE School'],
                  ['Short code', 'code', 'mbse'],
                  ['Contact name', 'contact_name', 'IT Admin'],
                  ['Contact email', 'contact_email', 'admin@school.edu.in'],
                  ['ERP domain', 'erp_domain', 'mbse.easylearn.org.in'],
                  ['DB name', 'db_name', 'mbsc_easylearn'],
                ].map(([label, key, placeholder]) => (
                  <div key={key}>
                    <label className={labelCls} style={{ color: C.textSecondary }}>{label}</label>
                    <input value={form[key]} onChange={e => update(key, e.target.value)}
                      placeholder={placeholder} className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }}
                      onFocus={e => e.target.style.borderColor = INK} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-[14.5px] font-semibold mb-5" style={{ color: C.textPrimary }}>Server configuration</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Public IP', 'public_ip', '118.185.90.46'],
                  ['LAN IP', 'lan_ip', '192.168.12.21'],
                  ['Storage domain', 'storage_domain', 'mbse-storage.easylearn.org.in'],
                  ['Storage path', 'storage_path', 'D:\\MediaStorage'],
                  ['SSL thumbprint', 'ssl_thumbprint', '3590B6261F...'],
                ].map(([label, key, placeholder]) => (
                  <div key={key}>
                    <label className={labelCls} style={{ color: C.textSecondary }}>{label}</label>
                    <input value={form[key]} onChange={e => update(key, e.target.value)}
                      placeholder={placeholder} className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }}
                      onFocus={e => e.target.style.borderColor = INK} onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                ))}
                <div>
                  <label className={labelCls} style={{ color: C.textSecondary }}>Nginx port</label>
                  <input type="number" value={form.nginx_port}
                    onChange={e => update('nginx_port', parseInt(e.target.value))} className={inputCls}
                    style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }}
                    onFocus={e => e.target.style.borderColor = INK} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
                <div>
                  <label className={labelCls} style={{ color: C.textSecondary }}>HTTPS port</label>
                  <input type="number" value={form.https_port}
                    onChange={e => update('https_port', parseInt(e.target.value))} className={inputCls}
                    style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }}
                    onFocus={e => e.target.style.borderColor = INK} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls} style={{ color: C.textSecondary }}>Sync interval</label>
                  <select value={form.sync_interval_min}
                    onChange={e => update('sync_interval_min', parseInt(e.target.value))} className={inputCls}
                    style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }}>
                    <option value={5}>Every 5 minutes</option>
                    <option value={15}>Every 15 minutes</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every hour</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-[14.5px] font-semibold mb-5" style={{ color: C.textPrimary }}>Review & confirm</div>
              <div className="rounded-xl p-4" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                {[
                  ['Type', form.institution_type],
                  ['Name', form.name],
                  ['Code', form.code],
                  ['Contact', `${form.contact_name} · ${form.contact_email}`],
                  ['ERP', form.erp_domain],
                  ['DB', form.db_name],
                  ['Server', `${form.public_ip} · ${form.lan_ip}`],
                  ['Storage', form.storage_domain],
                  ['Path', form.storage_path],
                  ['Ports', `Nginx :${form.nginx_port} · HTTPS :${form.https_port}`],
                  ['Sync', `Every ${form.sync_interval_min} min`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <span className="text-[12px]" style={{ color: C.textSecondary }}>{label}</span>
                    <span className="text-[12.5px] font-medium" style={{ color: C.textPrimary }}>{value || '—'}</span>
                  </div>
                ))}
              </div>
              {error && (
                <div className="mt-4 rounded-xl px-4 py-3 text-[12.5px] font-medium" style={{ background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.danger }}>
                  <i className="ti ti-x mr-1" aria-hidden="true"></i>{error}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-6 pt-5" style={{ borderTop: `1px solid ${C.border}` }}>
            <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
              className="text-[13px] font-medium cursor-pointer bg-transparent border-none" style={{ color: C.textSecondary }}>
              {step === 1 ? 'Cancel' : '← Back'}
            </button>
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!form.name || !form.code)}
                className="px-6 py-2.5 rounded-xl text-[13.5px] font-semibold text-white border-none cursor-pointer disabled:opacity-40 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
                Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="px-6 py-2.5 rounded-xl text-[13.5px] font-semibold text-white border-none cursor-pointer disabled:opacity-40 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${C.success}, ${C.brandFrom})` }}>
                {loading ? 'Deploying…' : 'Deploy institution ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}