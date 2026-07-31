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
}

const inputCls = "w-full rounded-xl px-4 py-2.5 text-[13.5px] outline-none transition-colors"
const labelCls = "block text-[12px] font-medium mb-1.5"

export default function DefaultTemplate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    institution_name: '',
    institution_code: '',
    institution_type: 'school',
    public_ip: '',
    lan_ip: '',
    storage_domain: '',
    storage_path: 'D:\\MediaStorage',
    nginx_port: 9006,
    https_port: 9000,
    ssl_thumbprint: '',
    sync_interval_min: 15,
    aws_folders: 'easylearn-ncert,NCERT Course video,SAAR',
    godaddy_ftp_host: '184.168.118.87',
    godaddy_ftp_user: '',
    db_name: '',
    erp_domain: '',
    contact_name: '',
    contact_email: '',
  })

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const generateFiles = () => {
    const folders = form.aws_folders.split(',').map(f => f.trim())
    const storagePath = form.storage_path

    // nginx.conf
    const nginxConf = `worker_processes  1;
events { worker_connections 1024; }
http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;
    server {
        listen ${form.nginx_port};
        root ${storagePath.replace(/\\/g, '/')};
        autoindex off;
        location / {
            limit_except GET HEAD OPTIONS { deny all; }
            add_header Accept-Ranges bytes;
            add_header Cache-Control "public, max-age=3600";
            add_header Access-Control-Allow-Origin "*";
            try_files $uri $uri/ =404;
        }
        location ~* \\.(mp4|webm|avi|mov|mkv)$ {
            limit_except GET HEAD OPTIONS { deny all; }
            add_header Accept-Ranges bytes;
            add_header Access-Control-Allow-Origin "*";
            mp4;
            mp4_buffer_size 1m;
            mp4_max_buffer_size 5m;
        }
        location ~* \\.pdf$ {
            limit_except GET HEAD OPTIONS { deny all; }
            add_header Content-Type application/pdf;
            add_header Accept-Ranges bytes;
            add_header Access-Control-Allow-Origin "*";
            add_header Content-Disposition inline;
        }
    }
}`

    // sync_aws.bat
    const syncBat = `@echo off
echo ======================================== >> ${storagePath}\\sync_log.txt
echo Sync Started: %date% %time% >> ${storagePath}\\sync_log.txt
${folders.map(f => `
REM ${f} sync
D:\\MinIO\\rclone.exe --config "C:\\Users\\admin\\AppData\\Roaming\\rclone\\rclone.conf" sync "aws-s3:easylearn1/${f}" "${storagePath}\\${f}" --log-file=${storagePath}\\sync_log.txt --log-level INFO --transfers 5 --retries 3`).join('\n')}
echo Sync Complete: %date% %time% >> ${storagePath}\\sync_log.txt`

    // backup.bat
    const backupBat = `@echo off
echo ======================================== >> ${storagePath}\\backup_log.txt
echo Backup Started: %date% %time% >> ${storagePath}\\backup_log.txt
D:\\MinIO\\rclone.exe --config "C:\\Users\\admin\\AppData\\Roaming\\rclone\\rclone.conf" copy "${storagePath}" "godaddy-backup:/" ^
  --log-file=${storagePath}\\backup_log.txt ^
  --log-level INFO ^
  --transfers 3 ^
  --tpslimit 2 ^
  --checkers 4 ^
  --retries 10 ^
  --retries-sleep 30s
echo Backup Complete: %date% %time% >> ${storagePath}\\backup_log.txt`

    // start_nginx.bat
    const startNginx = `@echo off
timeout /t 30 /nobreak
taskkill /F /IM nginx.exe 2>nul
timeout /t 2 /nobreak
D:\\nginx\\nginx.exe -p D:\\nginx`

    // web.config
    const webConfig = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <proxy enabled="true" />
    <rewrite>
      <rules>
        <rule name="Nginx Proxy" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:${form.nginx_port}/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`

    // setup_tasks.ps1
    const taskScript = `# EasyReach Task Scheduler Setup
# Institution: ${form.institution_name} (${form.institution_code})
# Run as Administrator

Write-Host "Setting up scheduled tasks..."

# Nginx Auto Start
$action1 = New-ScheduledTaskAction -Execute "D:\\nginx\\start_nginx.bat" -WorkingDirectory "D:\\nginx"
$trigger1 = New-ScheduledTaskTrigger -AtStartup
$principal1 = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
$settings1 = New-ScheduledTaskSettingsSet -ExecutionTimeLimit 0 -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 2)
Register-ScheduledTask -TaskName "Nginx-MediaStart" -Action $action1 -Trigger $trigger1 -Principal $principal1 -Settings $settings1 -Force
$task1 = Get-ScheduledTask -TaskName "Nginx-MediaStart"
$task1.Triggers[0].Delay = "PT2M"
Set-ScheduledTask -InputObject $task1

# AWS Sync Every ${form.sync_interval_min} Minutes
$action2 = New-ScheduledTaskAction -Execute "${storagePath}\\sync_aws.bat"
$trigger2 = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes ${form.sync_interval_min}) -Once -At (Get-Date)
$principal2 = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
$settings2 = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes ${form.sync_interval_min - 1})
Register-ScheduledTask -TaskName "MediaStorage-AWS-Sync" -Action $action2 -Trigger $trigger2 -Principal $principal2 -Settings $settings2 -Force

# Backup AM 2:00
$action3 = New-ScheduledTaskAction -Execute "D:\\MinIO\\backup.bat"
$trigger3 = New-ScheduledTaskTrigger -Daily -At "2:00AM"
Register-ScheduledTask -TaskName "MediaBackup-AM" -Action $action3 -Trigger $trigger3 -Principal $principal2 -Force

# Backup PM 2:00
$trigger4 = New-ScheduledTaskTrigger -Daily -At "2:00PM"
Register-ScheduledTask -TaskName "MediaBackup-PM" -Action $action3 -Trigger $trigger4 -Principal $principal2 -Force

Write-Host "All tasks created successfully!"`

    // README.txt
    const readme = `EasyReach Setup Guide
Institution: ${form.institution_name} (${form.institution_code})
Type: ${form.institution_type}
Generated: ${new Date().toLocaleDateString()}
ISF Analytica & Informatica Pvt. Ltd.

============================================================
SERVER DETAILS
============================================================
Public IP:      ${form.public_ip || 'YOUR_PUBLIC_IP'}
LAN IP:         ${form.lan_ip || 'YOUR_LAN_IP'}
Storage Domain: ${form.storage_domain || 'YOUR_STORAGE_DOMAIN'}
Storage Path:   ${storagePath}
Nginx Port:     ${form.nginx_port} (internal)
HTTPS Port:     ${form.https_port} (public)
Sync Interval:  Every ${form.sync_interval_min} minutes
ERP Domain:     ${form.erp_domain || 'YOUR_ERP_DOMAIN'}
DB Name:        ${form.db_name || 'YOUR_DB_NAME'}

============================================================
STEP 1 - FOLDER SETUP
============================================================
Run in Admin CMD:
  mkdir ${storagePath}
${folders.map(f => `  mkdir "${storagePath}\\${f}"`).join('\n')}

============================================================
STEP 2 - COPY CONFIG FILES
============================================================
  copy nginx.conf D:\\nginx\\conf\\nginx.conf
  copy sync_aws.bat ${storagePath}\\sync_aws.bat
  copy backup.bat D:\\MinIO\\backup.bat
  copy start_nginx.bat D:\\nginx\\start_nginx.bat

============================================================
STEP 3 - IIS SETUP
============================================================
  Copy web.config to: C:\\inetpub\\nginx-proxy\\web.config
  SSL Thumbprint: ${form.ssl_thumbprint || 'YOUR_SSL_THUMBPRINT'}

============================================================
STEP 4 - TASK SCHEDULER
============================================================
  Run in Admin PowerShell:
  PowerShell -ExecutionPolicy Bypass -File setup_tasks.ps1

============================================================
STEP 5 - FIRST SYNC
============================================================
  Run in Admin CMD:
  ${storagePath}\\sync_aws.bat
  (Wait for "Sync Complete")

============================================================
STEP 6 - START NGINX
============================================================
  D:\\nginx\\nginx.exe -p D:\\nginx -t
  D:\\nginx\\nginx.exe -p D:\\nginx

============================================================
STEP 7 - VERIFY
============================================================
  Test URL: https://${form.storage_domain || 'YOUR_DOMAIN'}:${form.https_port}/[folder]/[file].pdf
  Dashboard: Check institution shows "active" in EasyReach

Support: support@easylearn.org.in
============================================================`

    return { nginxConf, syncBat, backupBat, startNginx, webConfig, taskScript, readme }
  }

  const handleDownload = async () => {
    setLoading(true)
    try {
      const files = generateFiles()

      // Create ZIP using JSZip
      const JSZip = (await import('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js')).default
      const zip = new JSZip()
      zip.file('nginx.conf', files.nginxConf)
      zip.file('sync_aws.bat', files.syncBat)
      zip.file('backup.bat', files.backupBat)
      zip.file('start_nginx.bat', files.startNginx)
      zip.file('web.config', files.webConfig)
      zip.file('setup_tasks.ps1', files.taskScript)
      zip.file('README.txt', files.readme)

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `easyreach_${form.institution_code || 'template'}_config.zip`
      a.click()
      URL.revokeObjectURL(url)
      setDone(true)
    } catch (err) {
      // Fallback: download README only
      const files = generateFiles()
      const blob = new Blob([files.readme], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `easyreach_${form.institution_code || 'template'}_README.txt`
      a.click()
      URL.revokeObjectURL(url)
      setDone(true)
    } finally { setLoading(false) }
  }

  const typeOptions = [
    { value: 'school', label: 'School', icon: 'ti-school' },
    { value: 'college', label: 'College', icon: 'ti-certificate' },
    { value: 'institute', label: 'Institute', icon: 'ti-building-bank' },
  ]

  const Section = ({ title }) => (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[12px] font-semibold" style={{ color: C.brandFrom }}>{title}</span>
      <div className="flex-1 h-px" style={{ background: C.border }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: C.bgApp }}>
      {/* Topbar */}
      <div className="flex items-center gap-4 px-7 py-4" style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-[13px] font-medium cursor-pointer bg-transparent border-none" style={{ color: C.textSecondary }}>
          <i className="ti ti-arrow-left text-sm" aria-hidden="true"></i> Back
        </button>
        <div className="w-px h-5" style={{ background: C.border }} />
        <div>
          <div className="text-[14.5px] font-semibold" style={{ color: C.textPrimary }}>General config template</div>
          <div className="text-[12px]" style={{ color: C.textSecondary }}>Generate setup files for any institution</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto py-9 px-6">
        {/* Info banner */}
        <div className="flex items-start gap-3.5 px-5 py-4 rounded-2xl mb-7"
          style={{ background: `linear-gradient(120deg, ${C.systemBg}, ${C.successBg})`, border: `1px solid ${C.systemBorder}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.surface }}>
            <i className="ti ti-info-circle text-base" style={{ color: C.brandFrom }} aria-hidden="true"></i>
          </div>
          <div>
            <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>Fill details → download ZIP</div>
            <div className="text-[12px] mt-1" style={{ color: C.textSecondary }}>ZIP will contain: nginx.conf, sync_aws.bat, backup.bat, start_nginx.bat, web.config, setup_tasks.ps1, README.txt</div>
          </div>
        </div>

        <div className="rounded-2xl p-7" style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '0 4px 24px -8px rgba(16,24,40,0.08)' }}>
          {/* Institution type */}
          <div className="mb-6">
            <label className={labelCls} style={{ color: C.textSecondary }}>Institution type</label>
            <div className="flex gap-2">
              {typeOptions.map(({ value, label, icon }) => (
                <button key={value} onClick={() => update('institution_type', value)}
                  className="flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  style={form.institution_type === value
                    ? { background: C.systemBg, color: C.brandFrom, border: `1.5px solid ${C.brandFrom}` }
                    : { background: C.surfaceAlt, color: C.textMuted, border: `1px solid ${C.border}` }}>
                  <i className={`ti ${icon} text-sm`} aria-hidden="true"></i>{label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Basic info */}
          <Section title="Basic info" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              ['Institution name', 'institution_name', 'MBSE School'],
              ['Short code', 'institution_code', 'mbse'],
              ['ERP domain', 'erp_domain', 'mbse.easylearn.org.in'],
              ['DB name', 'db_name', 'mbsc_easylearn'],
              ['Contact name', 'contact_name', 'IT Admin'],
              ['Contact email', 'contact_email', 'admin@school.edu.in'],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className={labelCls} style={{ color: C.textSecondary }}>{label}</label>
                <input value={form[key]} onChange={e => update(key, e.target.value)}
                  placeholder={placeholder} className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
              </div>
            ))}
          </div>

          {/* Section: Server */}
          <Section title="Server config" />
          <div className="grid grid-cols-2 gap-4 mb-6">
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
                  placeholder={placeholder} className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
              </div>
            ))}
            <div>
              <label className={labelCls} style={{ color: C.textSecondary }}>Sync interval (min)</label>
              <select value={form.sync_interval_min}
                onChange={e => update('sync_interval_min', parseInt(e.target.value))} className={inputCls}
                style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }}>
                <option value={5}>Every 5 min</option>
                <option value={15}>Every 15 min</option>
                <option value={30}>Every 30 min</option>
                <option value={60}>Every hour</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: C.textSecondary }}>Nginx port</label>
              <input type="number" value={form.nginx_port}
                onChange={e => update('nginx_port', parseInt(e.target.value))} className={inputCls}
                style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
            </div>
            <div>
              <label className={labelCls} style={{ color: C.textSecondary }}>HTTPS port</label>
              <input type="number" value={form.https_port}
                onChange={e => update('https_port', parseInt(e.target.value))} className={inputCls}
                style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
            </div>
          </div>

          {/* Section: AWS Folders */}
          <Section title="AWS folders to sync" />
          <div className="mb-6">
            <label className={labelCls} style={{ color: C.textSecondary }}>Folder names (comma separated)</label>
            <input value={form.aws_folders} onChange={e => update('aws_folders', e.target.value)}
              placeholder="easylearn-ncert,NCERT Course video,SAAR" className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
            <p className="text-[11.5px] mt-1.5" style={{ color: C.textMuted }}>These folders will be synced from easylearn1 S3 bucket</p>
          </div>

          {/* Section: Backup */}
          <Section title="Backup config" />
          <div className="grid grid-cols-2 gap-4 mb-7">
            {[
              ['GoDaddy FTP host', 'godaddy_ftp_host', '184.168.118.87'],
              ['GoDaddy FTP user', 'godaddy_ftp_user', 'backup@fortimates.com'],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className={labelCls} style={{ color: C.textSecondary }}>{label}</label>
                <input value={form[key]} onChange={e => update(key, e.target.value)}
                  placeholder={placeholder} className={inputCls} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.textPrimary }} />
              </div>
            ))}
          </div>

          {done && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-[13px] font-medium" style={{ background: C.successBg, border: `1px solid ${C.successBorder}`, color: C.success }}>
              <i className="ti ti-circle-check" aria-hidden="true"></i>
              Config files downloaded! Now follow the setup guide.
            </div>
          )}

          <button onClick={handleDownload} disabled={loading}
            className="w-full py-3.5 rounded-xl text-[13.5px] font-semibold text-white border-none cursor-pointer disabled:opacity-60 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2"><i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Generating…</span>
            ) : (
              <span className="flex items-center justify-center gap-2"><i className="ti ti-download" aria-hidden="true"></i> Download config ZIP</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}