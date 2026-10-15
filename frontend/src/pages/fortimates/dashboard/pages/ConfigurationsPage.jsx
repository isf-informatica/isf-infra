import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, KeyRound, User, Bell, Webhook } from 'lucide-react'
import Reveal from '../../components/common/Reveal.jsx'
import Button from '../../components/common/Button.jsx'
import { adminUser } from '../../data/mockData.js'
import { apiGet, apiPut, apiPost } from '../../lib/api.js'

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="p-6 bg-facet-card border border-white/5 clip-facet-r">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 flex items-center justify-center bg-signal-500/10 text-signal-400 clip-shield shrink-0">
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-mist-100">{title}</h3>
          {description && <p className="text-xs text-mist-400 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function SaveButton({ saved, onClick }) {
  return (
    <Button variant="primary" type="submit" onClick={onClick} className="!py-2.5 !px-5 !text-xs">
      {saved ? (
        <>
          <Check size={13} /> Saved
        </>
      ) : (
        'Save changes'
      )}
    </Button>
  )
}

// Runs a save action against the backend; shows "Saved" on success, the error otherwise
function useSavedFlash(action) {
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  async function flash(e) {
    e.preventDefault()
    setError('')
    try {
      if (action) await action()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message)
    }
  }
  return [saved, flash, error]
}

function ErrorLine({ message }) {
  return message ? <p className="text-xs text-red-400">{message}</p> : null
}

export default function ConfigurationsPage() {
  // Logged-in user's own settings — GET/PUT /fortimates/settings
  const [profile, setProfile] = useState({ display_name: '', alert_email: '', role: '' })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [loadError, setLoadError] = useState('')

  const [notifications, setNotifications] = useState({
    fraudAlerts: true,
    weeklyReport: true,
    kycApprovals: false,
    newAdminLogin: true
  })

  useEffect(() => {
    apiGet('/settings')
      .then((s) => {
        setProfile({ display_name: s.display_name, alert_email: s.alert_email, role: s.role })
        setNotifications(s.notifications)
      })
      .catch((err) => setLoadError(err.message))
  }, [])

  const [profileSaved, saveProfile, profileError] = useSavedFlash(async () => {
    const s = await apiPut('/settings', { display_name: profile.display_name, alert_email: profile.alert_email })
    setProfile((p) => ({ ...p, display_name: s.display_name, alert_email: s.alert_email }))
  })
  const [securitySaved, saveSecurity, securityError] = useSavedFlash(async () => {
    if (passwords.next !== passwords.confirm) throw new Error('New password and confirm do not match')
    // Changes the EasyReach login password (same account)
    await apiPost('/settings/password', { current_password: passwords.current, new_password: passwords.next })
    setPasswords({ current: '', next: '', confirm: '' })
  })
  const [notifSaved, saveNotif, notifError] = useSavedFlash(async () => {
    const s = await apiPut('/settings', { notifications })
    setNotifications(s.notifications)
  })

  function toggleNotif(key) {
    setNotifications((n) => ({ ...n, [key]: !n[key] }))
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Reveal>
        <div className="p-6 bg-facet-card border border-white/5 clip-facet flex items-center gap-4">
          <img
            src={adminUser.photo}
            alt={adminUser.name}
            className="w-16 h-16 object-cover clip-shield border border-white/10"
          />
          <div>
            <p className="text-mist-100 font-semibold">{profile.display_name || adminUser.name}</p>
            <p className="text-xs text-mist-400">{profile.role ? `${profile.role} · ` : ''}FortiMates HQ</p>
            {loadError && <p className="text-xs text-red-400 mt-1">{loadError}</p>}
          </div>
        </div>
      </Reveal>

      {/* Profile */}
      <Reveal delay={0.05}>
        <form onSubmit={saveProfile}>
          <SectionCard icon={User} title="Profile" description="Your name and how alerts reach you.">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-mist-400">Display name</label>
                <input
                  required
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  className="mt-1.5 w-full px-4 py-2.5 bg-abyss-950 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 clip-facet-r"
                />
              </div>
              <div>
                <label className="text-xs text-mist-400">Alert email</label>
                <input
                  required
                  type="email"
                  value={profile.alert_email}
                  onChange={(e) => setProfile({ ...profile, alert_email: e.target.value })}
                  className="mt-1.5 w-full px-4 py-2.5 bg-abyss-950 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 clip-facet-r"
                />
              </div>
              <ErrorLine message={profileError} />
              <div className="pt-1">
                <SaveButton saved={profileSaved} />
              </div>
            </div>
          </SectionCard>
        </form>
      </Reveal>

      {/* Security */}
      <Reveal delay={0.1}>
        <form onSubmit={saveSecurity}>
          <SectionCard icon={KeyRound} title="Security" description="Change the password used to sign in.">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-mist-400">Current password</label>
                <input
                  type="password"
                  required
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="••••••••"
                  className="mt-1.5 w-full px-4 py-2.5 bg-abyss-950 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 placeholder:text-mist-400 clip-facet-r"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-mist-400">New password</label>
                  <input
                    type="password"
                  required
                  value={passwords.next}
                  onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                    placeholder="••••••••"
                    className="mt-1.5 w-full px-4 py-2.5 bg-abyss-950 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 placeholder:text-mist-400 clip-facet-r"
                  />
                </div>
                <div>
                  <label className="text-xs text-mist-400">Confirm</label>
                  <input
                    type="password"
                  required
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="••••••••"
                    className="mt-1.5 w-full px-4 py-2.5 bg-abyss-950 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 placeholder:text-mist-400 clip-facet-r"
                  />
                </div>
              </div>
              <ErrorLine message={securityError} />
              <div className="pt-1">
                <SaveButton saved={securitySaved} />
              </div>
            </div>
          </SectionCard>
        </form>
      </Reveal>

      {/* Notifications */}
      <Reveal delay={0.15}>
        <form onSubmit={saveNotif}>
          <SectionCard icon={Bell} title="Notifications" description="What this account gets alerted about.">
            <div className="space-y-4">
              {[
                { key: 'fraudAlerts', label: 'Real-time fraud alerts', hint: 'Get notified the moment a high-risk event is scored.' },
                { key: 'weeklyReport', label: 'Weekly summary report', hint: 'A digest of registrations, requests and mail activity.' },
                { key: 'kycApprovals', label: 'KYC approvals', hint: 'Notify when a KYC submission is approved or rejected.' },
                { key: 'newAdminLogin', label: 'New admin sign-in', hint: 'Alert when a new device signs into an admin account.' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-mist-100">{item.label}</p>
                    <p className="text-xs text-mist-400">{item.hint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotif(item.key)}
                    className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ml-4 ${
                      notifications[item.key] ? 'bg-signal-500' : 'bg-white/10'
                    }`}
                  >
                    <motion.span
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white"
                      animate={{ x: notifications[item.key] ? 16 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              ))}
              <ErrorLine message={notifError} />
              <div className="pt-1">
                <SaveButton saved={notifSaved} />
              </div>
            </div>
          </SectionCard>
        </form>
      </Reveal>

      {/* API / Webhooks — read-only preview, wired up once backend is live */}
      <Reveal delay={0.2}>
        <SectionCard icon={Webhook} title="API access" description="For connecting FortiMates to your own systems.">
          <div className="flex items-center justify-between p-4 bg-abyss-950 border border-white/5 clip-facet-r">
            <div>
              <p className="text-xs text-mist-400">API key</p>
              <p className="text-sm text-mist-200 font-mono mt-1">••••••••••••••••••••3f2a</p>
            </div>
            <span className="text-xs text-mist-400">Connect backend to manage keys</span>
          </div>
        </SectionCard>
      </Reveal>
    </div>
  )
}
