import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

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
  warning: '#D9720A',
  warningBg: '#FFF7EB',
  warningBorder: '#FDDDA8',
  navy: '#0E1526',
}

const inputCls = "w-full rounded-xl px-4 py-2.5 text-[13.5px] outline-none transition-all"
const labelCls = "block text-[12px] font-medium mb-1.5"

const Section = ({ title, icon, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-4">
      <i className={`ti ${icon} text-[15px]`} style={{ color: C.brandFrom }} aria-hidden="true"></i>
      <span className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>{title}</span>
      <div className="flex-1 h-px" style={{ background: C.border }} />
    </div>
    {children}
  </div>
)

const Field = ({ label, children, hint }) => (
  <div>
    <label className={labelCls} style={{ color: C.textSecondary }}>{label}</label>
    {children}
    {hint && <p className="text-[11px] mt-1" style={{ color: C.textMuted }}>{hint}</p>}
  </div>
)

const steps = ['Institution', 'Server', 'AWS & Sync', 'Review & Download']

export default function SmartSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [schoolId, setSchoolId] = useState(null)

  const [form, setForm] = useState({
    // Institution
    name: '',
    code: '',
    institution_type: 'school',
    contact_name: '',
    contact_email: '',
    erp_domain: '',
    db_name: '',

    // Server
    public_ip: '',
    lan_ip: '',
    storage_domain: '',
    storage_path: 'D:\\MediaStorage',
    nginx_port: 9006,
    https_port: 9000,
    ssl_thumbprint: '',
    sync_interval_min: 15,

    // AWS
    aws_access_key: '',
    aws_secret_key: '',
    aws_bucket: 'easylearn1',
    aws_region: 'eu-north-1',
    aws_folders: 'easylearn-ncert,NCERT Course video,SAAR',

    // Backup
    ftp_host: '184.168.118.87',
    ftp_user: '',
    ftp_pass: '',

    easyreach_api: window.location.origin.includes('localhost')
      ? 'http://127.0.0.1:8000'
      : 'https://easylearn.org.in/mediasync/api',
  })

  const u = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const typeOptions = [
    { value: 'school', label: 'School', icon: 'ti-school' },
    { value: 'college', label: 'College', icon: 'ti-certificate' },
    { value: 'institute', label: 'Institute', icon: 'ti-building-bank' },
  ]

  const canNext = () => {
    if (step === 1) return form.name && form.code
    if (step === 2) return form.public_ip && form.lan_ip && form.storage_domain && form.ssl_thumbprint
    if (step === 3) return form.aws_access_key && form.aws_secret_key
    return true
  }

  const handleDownload = async () => {
    setLoading(true)
    try {
      const payload = {
        ...form,
        aws_folders: form.aws_folders.split(',').map(f => f.trim()).filter(Boolean),
      }
      const res = await api.post('/api/setup/generate-setup', payload, { responseType: 'blob' })

      const sid = res.headers['x-school-id']
      if (sid) setSchoolId(parseInt(sid))

      const url = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `easyreach_${form.code}_setup.zip`
      a.click()
      window.URL.revokeObjectURL(url)
      setDownloaded(true)
    } catch (err) {
      alert(err.response?.data?.detail || 'Download failed. Check backend.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      {/* Topbar */}
      <div className="flex items-center justify-between px-7 py-4" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer bg-transparent border-none" style={{ color: C.textSecondary }}>
            <i className="ti ti-arrow-left text-sm" aria-hidden="true"></i> Back
          </button>
          <div className="w-px h-5" style={{ background: C.border }} />
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
              <i className="ti ti-rocket text-white text-sm" aria-hidden="true"></i>
            </div>
            <div>
              <div className="text-[14.5px] font-semibold" style={{ color: C.textPrimary }}>One-click setup</div>
              <div className="text-[12px]" style={{ color: C.textSecondary }}>Fill form → Download ZIP → Run installer</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto py-9 px-6">
        {/* How it works banner */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-4 rounded-2xl mb-7"
          style={{ background: `linear-gradient(120deg, ${C.systemBg}, ${C.successBg})`, border: `1px solid ${C.systemBorder}` }}>
          {[
            { icon: 'ti-forms', label: 'Fill form' },
            { icon: 'ti-download', label: 'Download ZIP' },
            { icon: 'ti-player-play', label: 'Run install.ps1' },
            { icon: 'ti-circle-check', label: 'Auto setup done' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[12.5px] font-medium flex items-center gap-1.5" style={{ color: C.textPrimary }}>
                <i className={`ti ${s.icon} text-[13px]`} style={{ color: C.brandFrom }} aria-hidden="true"></i>{s.label}
              </span>
              {i < 3 && <i className="ti ti-arrow-right text-[12px]" style={{ color: C.textMuted }} aria-hidden="true"></i>}
            </div>
          ))}
        </div>

        {/* Steps indicator */}
        <div className="flex items-center mb-7">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11.5px] font-bold shrink-0"
                  style={
                    step > i + 1 ? { background: C.success, color: '#fff' } :
                    step === i + 1 ? { background: C.brandFrom, color: '#fff' } :
                    { background: C.surface, border: `1px solid ${C.border}`, color: C.textMuted }
                  }>
                  {step > i + 1 ? <i className="ti ti-check text-[12px]" aria-hidden="true"></i> : i + 1}
                </div>
                <span className="text-[12px] font-medium hidden sm:block"
                  style={{ color: step === i + 1 ? C.brandFrom : step > i + 1 ? C.success : C.textMuted }}>{label}</span>
              </div>
              {i < 3 && <div className="flex-1 h-px mx-2" style={{ background: step > i + 1 ? C.successBorder : C.border }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 4px 24px -8px rgba(16,24,40,0.08)' }}>

          {/* STEP 1: Institution */}
          {step === 1 && (
            <div>
              <Section title="Institution type" icon="ti-building-community">
                <div className="flex gap-2">
                  {typeOptions.map(({ value, label, icon }) => (
                    <button key={value} onClick={() => u('institution_type', value)}
                      className="flex-1 py-3 rounded-xl text-[12.5px] font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      style={form.institution_type === value
                        ? { background: C.systemBg, color: C.brandFrom, border: `1.5px solid ${C.brandFrom}` }
                        : { background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}` }}>
                      <i className={`ti ${icon} text-sm`} aria-hidden="true"></i>{label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Basic details" icon="ti-id-badge">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Institution name *">
                    <input value={form.name} onChange={e => u('name', e.target.value)}
                      placeholder="MBSE School" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="Short code *" hint="Lowercase, no spaces (used in filenames)">
                    <input value={form.code} onChange={e => u('code', e.target.value.toLowerCase())}
                      placeholder="mbse" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="Contact person">
                    <input value={form.contact_name} onChange={e => u('contact_name', e.target.value)}
                      placeholder="Tapan Das" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="Contact email">
                    <input type="email" value={form.contact_email} onChange={e => u('contact_email', e.target.value)}
                      placeholder="admin@school.edu.in" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="ERP domain">
                    <input value={form.erp_domain} onChange={e => u('erp_domain', e.target.value)}
                      placeholder="mbse.easylearn.org.in" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="Database name">
                    <input value={form.db_name} onChange={e => u('db_name', e.target.value)}
                      placeholder="mbsc_easylearn" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                </div>
              </Section>
            </div>
          )}

          {/* STEP 2: Server */}
          {step === 2 && (
            <div>
              <Section title="Network" icon="ti-network">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Public IP *" hint="Router/firewall public IP">
                    <input value={form.public_ip} onChange={e => u('public_ip', e.target.value)}
                      placeholder="118.185.90.46" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="LAN IP *" hint="Server's local network IP">
                    <input value={form.lan_ip} onChange={e => u('lan_ip', e.target.value)}
                      placeholder="192.168.12.21" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="Storage subdomain *" hint="DNS must point to public IP">
                    <input value={form.storage_domain} onChange={e => u('storage_domain', e.target.value)}
                      placeholder="mbse-storage.easylearn.org.in" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="Storage path" hint="Where files will be stored on server">
                    <input value={form.storage_path} onChange={e => u('storage_path', e.target.value)}
                      placeholder="D:\MediaStorage" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                </div>
              </Section>

              <Section title="Ports & SSL" icon="ti-lock">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nginx internal port" hint="Nginx listens on this (e.g. 9006)">
                    <input type="number" value={form.nginx_port} onChange={e => u('nginx_port', parseInt(e.target.value))}
                      className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="HTTPS public port" hint="IIS proxies HTTPS on this (e.g. 9000)">
                    <input type="number" value={form.https_port} onChange={e => u('https_port', parseInt(e.target.value))}
                      className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="SSL certificate thumbprint *" hint="Get from: certlm.msc → Personal → Certificates">
                      <input value={form.ssl_thumbprint} onChange={e => u('ssl_thumbprint', e.target.value)}
                        placeholder="3590B6261F221EC7903D4D81BB988F877A1644BA" className={`${inputCls} font-mono`} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                    </Field>
                  </div>
                </div>
              </Section>

              {/* Info box */}
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl" style={{ background: C.warningBg, border: `1px solid ${C.warningBorder}` }}>
                <i className="ti ti-info-circle mt-0.5" style={{ color: C.warning }} aria-hidden="true"></i>
                <div className="text-[12.5px]" style={{ color: '#9A5A0A' }}>
                  Make sure ports {form.nginx_port} and {form.https_port} are open in Windows Firewall and router port forwarding is set up before running the installer.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: AWS & Sync */}
          {step === 3 && (
            <div>
              <Section title="AWS S3 credentials" icon="ti-cloud">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="AWS Access Key *">
                    <input value={form.aws_access_key} onChange={e => u('aws_access_key', e.target.value)}
                      placeholder="AKIAZHYNS2LBCJ47RPHM" className={`${inputCls} font-mono`} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="AWS Secret Key *">
                    <input type="password" value={form.aws_secret_key} onChange={e => u('aws_secret_key', e.target.value)}
                      placeholder="••••••••••••••••" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="S3 Bucket">
                    <input value={form.aws_bucket} onChange={e => u('aws_bucket', e.target.value)}
                      placeholder="easylearn1" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="AWS Region">
                    <select value={form.aws_region} onChange={e => u('aws_region', e.target.value)} className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }}>
                      <option value="eu-north-1">eu-north-1</option>
                      <option value="ap-south-1">ap-south-1</option>
                      <option value="us-east-1">us-east-1</option>
                    </select>
                  </Field>
                </div>
              </Section>

              <Section title="Folders to sync" icon="ti-folder">
                <Field label="S3 folder names (comma separated)" hint="These folders will sync from S3 bucket to local storage">
                  <input value={form.aws_folders} onChange={e => u('aws_folders', e.target.value)}
                    placeholder="easylearn-ncert,NCERT Course video,SAAR" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                </Field>
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.aws_folders.split(',').map(f => f.trim()).filter(Boolean).map(f => (
                    <span key={f} className="text-[11.5px] font-medium px-3 py-1 rounded-full flex items-center gap-1"
                      style={{ background: C.systemBg, color: C.brandFrom, border: `1px solid ${C.systemBorder}` }}>
                      <i className="ti ti-folder text-[11px]" aria-hidden="true"></i>{f}
                    </span>
                  ))}
                </div>
              </Section>

              <Section title="Sync schedule" icon="ti-clock">
                <Field label="Auto-sync interval">
                  <select value={form.sync_interval_min} onChange={e => u('sync_interval_min', parseInt(e.target.value))} className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }}>
                    <option value={5}>Every 5 minutes</option>
                    <option value={15}>Every 15 minutes (recommended)</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every hour</option>
                  </select>
                </Field>
              </Section>

              <Section title="GoDaddy FTP backup" icon="ti-database">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="FTP host">
                    <input value={form.ftp_host} onChange={e => u('ftp_host', e.target.value)}
                      placeholder="184.168.118.87" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <Field label="FTP username">
                    <input value={form.ftp_user} onChange={e => u('ftp_user', e.target.value)}
                      placeholder="backup@fortimates.com" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="FTP password">
                      <input type="password" value={form.ftp_pass} onChange={e => u('ftp_pass', e.target.value)}
                        placeholder="••••••••" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
                    </Field>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* STEP 4: Review & Download */}
          {step === 4 && (
            <div>
              <Section title="Review configuration" icon="ti-list-check">
                <div className="rounded-xl p-4" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                  {[
                    ['Type', form.institution_type],
                    ['Name', form.name],
                    ['Code', form.code],
                    ['Contact', `${form.contact_name} · ${form.contact_email}`],
                    ['ERP', form.erp_domain],
                    ['DB', form.db_name],
                    ['Public IP', form.public_ip],
                    ['LAN IP', form.lan_ip],
                    ['Storage domain', form.storage_domain],
                    ['Storage path', form.storage_path],
                    ['Nginx port', form.nginx_port],
                    ['HTTPS port', form.https_port],
                    ['Sync interval', `Every ${form.sync_interval_min} min`],
                    ['AWS bucket', form.aws_bucket],
                    ['AWS folders', form.aws_folders],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
                      <span className="text-[12px]" style={{ color: C.textSecondary }}>{label}</span>
                      <span className="text-[12.5px] font-medium text-right max-w-xs truncate" style={{ color: C.textPrimary }}>{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </Section>

              {/* What's in the ZIP */}
              <Section title="ZIP will contain" icon="ti-file-zip">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['ti-terminal-2', 'install.ps1', 'Master auto-installer'],
                    ['ti-file-settings', 'nginx.conf', 'Nginx web server config'],
                    ['ti-cloud', 'rclone.conf', 'AWS S3 credentials'],
                    ['ti-refresh', 'sync_aws.bat', 'AWS sync script'],
                    ['ti-database', 'backup.bat', 'GoDaddy FTP backup'],
                    ['ti-world', 'web.config', 'IIS HTTPS proxy config'],
                    ['ti-settings', 'config.json', 'Institution config'],
                  ].map(([icon, name, desc]) => (
                    <div key={name} className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                      <i className={`ti ${icon} text-[15px]`} style={{ color: C.brandFrom }} aria-hidden="true"></i>
                      <div className="min-w-0">
                        <div className="text-[12px] font-mono font-semibold truncate" style={{ color: C.textPrimary }}>{name}</div>
                        <div className="text-[11px] truncate" style={{ color: C.textMuted }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* After download instructions */}
              <div className="rounded-xl p-4 mb-6" style={{ background: C.successBg, border: `1px solid ${C.successBorder}` }}>
                <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.success }}>After download — run on school server:</div>
                <div className="rounded-lg px-4 py-3" style={{ background: C.navy }}>
                  <code className="text-[12px] font-mono" style={{ color: '#5EEAD4' }}>PowerShell -ExecutionPolicy Bypass -File install.ps1</code>
                </div>
                <div className="text-[11.5px] mt-2" style={{ color: '#3D8564' }}>Run as Administrator. Installer auto-sets up everything and registers with EasyReach dashboard.</div>
              </div>

              {downloaded && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-[13px] font-medium" style={{ background: C.successBg, border: `1px solid ${C.successBorder}`, color: C.success }}>
                  <i className="ti ti-circle-check" aria-hidden="true"></i>
                  ZIP downloaded! Run install.ps1 on the school server.
                  {schoolId && (
                    <button onClick={() => navigate(`/schools/${schoolId}`)}
                      className="ml-auto text-[12px] font-semibold underline cursor-pointer bg-transparent border-none" style={{ color: C.success }}>
                      View in dashboard →
                    </button>
                  )}
                </div>
              )}

              <button onClick={handleDownload} disabled={loading}
                className="w-full py-3.5 rounded-xl text-[13.5px] font-semibold text-white border-none cursor-pointer disabled:opacity-60 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Generating ZIP…
                  </span>
                ) : downloaded ? (
                  <span className="flex items-center justify-center gap-2"><i className="ti ti-download" aria-hidden="true"></i> Download again</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><i className="ti ti-download" aria-hidden="true"></i> Generate & download setup ZIP</span>
                )}
              </button>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between items-center mt-6 pt-5" style={{ borderTop: `1px solid ${C.border}` }}>
            <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/dashboard')}
              className="text-[13px] font-medium cursor-pointer bg-transparent border-none" style={{ color: C.textSecondary }}>
              {step === 1 ? 'Cancel' : '← Back'}
            </button>
            {step < 4 && (
              <button onClick={() => setStep(step + 1)} disabled={!canNext()}
                className="px-6 py-2.5 rounded-xl text-[13.5px] font-semibold text-white border-none cursor-pointer disabled:opacity-40 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}