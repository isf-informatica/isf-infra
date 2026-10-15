import { useEffect, useState } from 'react'
import { RefreshCw, Inbox, Send, AlertTriangle } from 'lucide-react'
import Reveal from '../../components/common/Reveal.jsx'
import MailTrackerTable from '../widgets/MailTrackerTable.jsx'
import MailLogTable from '../widgets/MailLogTable.jsx'
import UsersDonut from '../widgets/UsersDonut.jsx'
import { apiGet, apiPost } from '../../lib/api.js'

/**
 * Mail Tracker — two tabs:
 *   Inbox → mails received in the connected mailbox (IMAP sync, with risk check)
 *   Sent  → mails sent by FortiMates (admin invites, …)
 */
const TABS = [
  { key: 'inbound', label: 'Inbox', icon: Inbox },
  { key: 'outbound', label: 'Sent', icon: Send }
]

function timeAgo(iso) {
  if (!iso) return 'never'
  const diff = (Date.now() - new Date(iso.endsWith('Z') ? iso : `${iso}Z`).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`
  return new Date(iso).toLocaleString()
}

export default function MailTrackerPage() {
  const [tab, setTab] = useState('inbound')
  const [refreshKey, setRefreshKey] = useState(0)
  const [sync, setSync] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    apiGet('/mails/sync-status')
      .then((st) => {
        setSync(st)
        if (st.running) setSyncing(true)   // an auto-sync is already running
      })
      .catch(() => {})
  }, [refreshKey])

  // While a sync runs in the background, check its status every 3 s
  useEffect(() => {
    if (!syncing) return
    const timer = setInterval(async () => {
      try {
        const st = await apiGet('/mails/sync-status')
        setSync(st)
        if (!st.running) {
          setSyncing(false)
          if (!st.last_error) {
            setSyncMsg(
              `${st.last_added} new mail${st.last_added === 1 ? '' : 's'}` +
                (st.last_skipped ? `, ${st.last_skipped} skipped` : '')
            )
          }
          setRefreshKey((k) => k + 1)
        }
      } catch {
        /* keep polling */
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [syncing])

  async function syncNow() {
    setSyncing(true)
    setSyncMsg('')
    try {
      // POST /fortimates/mails/sync — starts the sync in the background, returns at once
      const res = await apiPost('/mails/sync')
      setSync(res)
    } catch (err) {
      setSyncMsg(err.message)
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs + sync bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex border border-white/10 overflow-hidden">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors"
              style={
                tab === key
                  ? { background: 'rgba(43,196,217,0.15)', color: '#4FD6E8' }
                  : { background: 'transparent', color: '#AAB8D6' }
              }
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'inbound' && (
          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: '#AAB8D6' }}>
            <span>
              {sync?.mailbox ? <b style={{ color: '#DCE4F2' }}>{sync.mailbox}</b> : 'Mailbox'} · last synced{' '}
              {timeAgo(sync?.last_sync_at)}
              {syncMsg && <span style={{ color: '#4FD6E8' }}> · {syncMsg}</span>}
            </span>
            <button
              onClick={syncNow}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold disabled:opacity-60"
              style={{ background: 'linear-gradient(120deg, #F5AE0E 0%, #FFC94A 45%, #4FD6E8 100%)', color: '#050B18' }}
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
        )}
      </div>

      {tab === 'inbound' && sync?.last_error && (
        <div
          className="flex items-start gap-2 p-3.5 text-xs border"
          style={{ background: 'rgba(239,71,111,0.08)', borderColor: 'rgba(239,71,111,0.35)', color: '#F4F7FC' }}
        >
          <AlertTriangle size={15} style={{ color: '#EF476F' }} className="shrink-0 mt-0.5" />
          <span>Inbox sync failed: {sync.last_error}</span>
        </div>
      )}

      <Reveal key={`top-${tab}`}>
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <MailTrackerTable direction={tab} refreshKey={refreshKey} />
          </div>
          <UsersDonut direction={tab} refreshKey={refreshKey} />
        </div>
      </Reveal>

      <Reveal delay={0.1} key={`log-${tab}`}>
        <MailLogTable direction={tab} refreshKey={refreshKey} />
      </Reveal>
    </div>
  )
}