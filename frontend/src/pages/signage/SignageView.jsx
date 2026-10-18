import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MdmPage, C, Card, CardHeader, Btn, IconBtn, Loader, Empty, Modal, Field, Input, Select, Switch, Chips,
  Kpi, Pill, PILL, TargetPicker, useToasts, usePoll, timeAgo, fmt, downloadBlob,
} from '../../components/mdm/MdmKit'
import { getInstitutions } from '../../api/appManagement'
import {
  PLATFORMS, MEDIA_TYPES, getSignageSummary, getScreens, addScreen, screenCommand, deleteScreen,
  getContent, uploadMedia, deleteMedia, getPlaylists, savePlaylist, deletePlaylist, pushPlaylist,
  getSchedules, saveSchedule, deleteSchedule, getAnalytics, exportAnalytics,
} from '../../api/signage'

const ACCENT = '#C026D3'
const THEME = {
  accent: ACCENT, accentDeep: '#A21CAF', accentBg: '#FDF4FF', accentBorder: '#F5D0FE',
  gradient: 'linear-gradient(135deg, #D946EF, #A21CAF)',
}
const TABS = [
  { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { key: 'screens', label: 'Screens', icon: 'ti-device-tv' },
  { key: 'content', label: 'Content & Playlists', icon: 'ti-slideshow' },
  { key: 'scheduling', label: 'Scheduling', icon: 'ti-calendar-event' },
  { key: 'analytics', label: 'Analytics', icon: 'ti-chart-bar' },
]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SCREEN_STATUS = {
  online: { color: C.success, bg: C.successBg, border: C.successBorder, icon: 'ti-circle-check', label: 'Online' },
  offline: { color: C.danger, bg: C.dangerBg, border: C.dangerBorder, icon: 'ti-plug-connected-x', label: 'Offline' },
  syncing: { color: THEME.accentDeep, bg: THEME.accentBg, border: THEME.accentBorder, icon: 'ti-loader-2 animate-spin', label: 'Syncing' },
}
const sizeLabel = (mb) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(mb * 1024)} KB`)
const dur = (s) => (s ? `${Math.floor(s / 60) ? Math.floor(s / 60) + 'm ' : ''}${s % 60}s` : 'Live')

export default function SignageView() {
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const { toasts, toast } = useToasts()
  const refresh = useCallback(() => getSignageSummary().then(setSummary).catch(() => {}), [])
  useEffect(() => { refresh(); getInstitutions().then(setInstitutions) }, [refresh])
  usePoll(refresh, true, 15000)

  return (
    <MdmPage {...THEME} icon="ti-device-tv" title="Digital Signboard"
      subtitle="Control screens, content and schedules across every site — from one dashboard"
      tabs={TABS} tab={tab} onTab={setTab} toasts={toasts}
      activeKey="signage" backPath="/home" backLabel="Home"
      badges={{ screens: summary?.offline || 0 }}
      status={summary ? `Live · ${summary.online}/${summary.total} screens online` : 'connecting…'}>
      {tab === 'overview' && <OverviewTab summary={summary} goTo={setTab} />}
      {tab === 'screens' && <ScreensTab institutions={institutions} toast={toast} onChange={refresh} />}
      {tab === 'content' && <ContentTab toast={toast} onChange={refresh} />}
      {tab === 'scheduling' && <SchedulingTab institutions={institutions} toast={toast} />}
      {tab === 'analytics' && <AnalyticsTab toast={toast} />}
    </MdmPage>
  )
}

/* ───────── Overview ───────── */
function OverviewTab({ summary, goTo }) {
  if (!summary) return <Loader label="Connecting to screens…" />
  const maxNow = Math.max(1, ...summary.nowPlaying.map(p => p[1]))
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Screens online" value={`${summary.online}/${summary.total}`} sub={`${summary.offline} offline · ${summary.syncing} syncing`} icon="ti-device-tv" color={ACCENT} />
        <Kpi label="Avg uptime" value={`${summary.uptime}%`} sub="Across live screens" icon="ti-activity" color={C.success} />
        <Kpi label="Content items" value={summary.content} sub={`${summary.playlists} playlists`} icon="ti-slideshow" color="#2563EB" />
        <Kpi label="Alerts" value={summary.alerts} sub="Need attention" icon="ti-alert-triangle" color={C.red} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Live alerts" sub="Offline screens & playback errors"
            right={<Btn icon="ti-arrow-right" onClick={() => goTo('screens')}>Screens</Btn>} />
          {summary.recentAlerts.length === 0 ? <Empty icon="ti-circle-check">All screens healthy.</Empty> : summary.recentAlerts.map(a => (
            <div key={a.id} className="mk-row px-5 py-3 flex items-start gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: a.sev === 'high' ? C.dangerBg : a.sev === 'medium' ? C.warningBg : C.surfaceAlt }}>
                <i className={`ti ${a.kind === 'offline' ? 'ti-plug-connected-x' : a.kind === 'playback' ? 'ti-player-stop' : 'ti-database'} text-[15px]`}
                  style={{ color: a.sev === 'high' ? C.danger : a.sev === 'medium' ? C.warning : C.textMuted }} aria-hidden="true"></i>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{a.title}</div>
                <div className="text-[11.5px] mt-0.5 truncate" style={{ color: C.textMuted }}>{a.detail}</div>
              </div>
              <span className="text-[11px] shrink-0" style={{ color: C.textMuted }}>{timeAgo(a.at)}</span>
            </div>
          ))}
        </Card>
        <div className="xl:col-span-2 flex flex-col gap-5">
          <Card>
            <CardHeader title="Now playing" sub="Content live on screens" />
            <div className="p-5 flex flex-col gap-3">
              {summary.nowPlaying.map(([name, n]) => (
                <div key={name}>
                  <div className="flex justify-between gap-3 text-[12px] mb-1.5"><span className="font-semibold truncate" style={{ color: C.textPrimary }}>{name}</span><span className="shrink-0" style={{ color: C.textSecondary }}>{n} screen{n > 1 ? 's' : ''}</span></div>
                  <div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${(n / maxNow) * 100}%`, background: ACCENT }} /></div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Screens by location" />
            <div className="p-5 flex flex-col gap-2.5">
              {summary.byLocation.map(l => (
                <div key={l.inst} className="flex items-center justify-between text-[12.5px]">
                  <span className="truncate" style={{ color: C.textPrimary }}>{l.inst}</span>
                  <span className="shrink-0 font-semibold" style={{ color: l.online === l.total ? C.success : C.warning }}>{l.online}/{l.total} online</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ───────── Screens ───────── */
function ScreensTab({ institutions, toast, onChange }) {
  const [list, setList] = useState(null)
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(null)
  const [adding, setAdding] = useState(false)
  const [shot, setShot] = useState(null)

  const load = useCallback(() => getScreens().then(setList), [])
  useEffect(() => { load() }, [load])
  usePoll(load, list?.some(s => s.status === 'syncing'), 1500)

  const counts = useMemo(() => ({ all: list?.length || 0, online: list?.filter(s => s.status === 'online').length || 0, offline: list?.filter(s => s.status === 'offline').length || 0, syncing: list?.filter(s => s.status === 'syncing').length || 0 }), [list])
  const shown = (list || []).filter(s => (status === 'all' || s.status === status) && (!q.trim() || `${s.name} ${s.inst}`.toLowerCase().includes(q.trim().toLowerCase())))

  const cmd = async (sc, type, label) => {
    setBusy(sc.id + type)
    const r = await screenCommand(sc.id, type)
    if (type === 'screenshot') setShot({ sc, at: r.capturedAt })
    await load(); onChange(); setBusy(null)
    if (type !== 'screenshot') toast(`${label} — ${sc.name}`)
  }
  const del = async (sc) => { if (!window.confirm(`Remove ${sc.name}?`)) return; setBusy(sc.id + 'del'); await deleteScreen(sc.id); await load(); onChange(); setBusy(null); toast('Screen removed') }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search screen or site" className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-56" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
          </div>
          <Chips options={[['all', 'All'], ['online', 'Online'], ['offline', 'Offline'], ['syncing', 'Syncing']]} value={status} onChange={setStatus} counts={counts} />
        </div>
        <Btn variant="accent" icon="ti-plus" onClick={() => setAdding(true)}>Add screen</Btn>
      </div>
      {!list ? <Loader label="Loading screens…" /> : shown.length === 0 ? <Empty icon="ti-device-tv-off">No screens match.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 1000 }}>
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                <th className="px-5 py-2.5">Screen</th><th className="px-3 py-2.5">Platform</th><th className="px-3 py-2.5">Now playing</th>
                <th className="px-3 py-2.5">Health</th><th className="px-3 py-2.5">Status</th><th className="px-5 py-2.5 text-right">Remote actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(s => {
                const p = PLATFORMS[s.platform], st = SCREEN_STATUS[s.status]
                return (
                  <tr key={s.id} className="mk-row" style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-5 py-3">
                      <div className="text-[13px] font-semibold mono" style={{ color: C.textPrimary }}>{s.name}</div>
                      <div className="text-[11px]" style={{ color: C.textMuted }}>{s.inst} · {s.resolution} · {s.orientation}</div>
                    </td>
                    <td className="px-3 py-3"><span className="flex items-center gap-1.5 text-[12px]" style={{ color: C.textSecondary }}><i className={`ti ${p.icon} text-[14px]`} style={{ color: p.color }} aria-hidden="true"></i>{p.label}</span></td>
                    <td className="px-3 py-3 text-[12.5px] max-w-[200px] truncate" style={{ color: C.textPrimary }}>{s.playing}</td>
                    <td className="px-3 py-3 text-[11.5px]" style={{ color: C.textSecondary }}>{s.status === 'offline' ? '—' : <>Uptime {s.uptime}% · CPU {s.cpu}% · Disk {s.storage}%</>}</td>
                    <td className="px-3 py-3"><Pill small meta={st} /><div className="text-[10.5px] mt-0.5" style={{ color: C.textMuted }}>{s.status === 'offline' ? `seen ${timeAgo(s.lastSeen)}` : timeAgo(s.lastSeen)}</div></td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <IconBtn icon="ti-camera" title="Screenshot" loading={busy === s.id + 'screenshot'} onClick={() => cmd(s, 'screenshot')} />
                        <IconBtn icon="ti-refresh" title="Refresh content" loading={busy === s.id + 'refresh'} onClick={() => cmd(s, 'refresh', 'Content refreshed')} />
                        <IconBtn icon="ti-rotate" title="Restart" loading={busy === s.id + 'restart'} onClick={() => cmd(s, 'restart', 'Restarted')} />
                        {s.status === 'offline'
                          ? <IconBtn icon="ti-power" title="Power on" loading={busy === s.id + 'power_on'} onClick={() => cmd(s, 'power_on', 'Powered on')} />
                          : <IconBtn icon="ti-power" title="Power off" danger loading={busy === s.id + 'power_off'} onClick={() => cmd(s, 'power_off', 'Powered off')} />}
                        <IconBtn icon="ti-trash" title="Remove" danger loading={busy === s.id + 'del'} onClick={() => del(s)} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {adding && <AddScreenModal institutions={institutions} onClose={() => setAdding(false)} onAdded={async (sc) => { setAdding(false); await load(); onChange(); toast(`Screen added — ${sc.name}`) }} />}
      {shot && (
        <Modal title={`Live screenshot — ${shot.sc.name}`} onClose={() => setShot(null)} width={560}>
          <div className="rounded-xl overflow-hidden flex items-center justify-center relative" style={{ aspectRatio: shot.sc.orientation === 'portrait' ? '9/16' : '16/9', background: THEME.gradient, maxHeight: 380, margin: '0 auto' }}>
            <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#FFFFFF33 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            <div className="text-center text-white px-6">
              <i className="ti ti-slideshow text-[34px]" aria-hidden="true"></i>
              <div className="text-[15px] font-bold mt-2">{shot.sc.playing}</div>
              <div className="text-[11.5px] opacity-90 mt-1">{shot.sc.resolution} · captured {timeAgo(shot.at)}</div>
            </div>
          </div>
          <p className="text-[11.5px] mt-3 text-center" style={{ color: C.textMuted }}>Live frame grabbed from the player. In the real build this shows the actual screen output.</p>
        </Modal>
      )}
    </Card>
  )
}

function AddScreenModal({ institutions, onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', inst: institutions[0]?.name || 'MBSE School', platform: 'android', resolution: '1920×1080', orientation: 'landscape', playing: '—' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <Modal title="Add screen" onClose={onClose}>
      <Field label="Screen name"><Input autoFocus value={form.name} onChange={e => set('name', e.target.value)} placeholder="SIGN-LOBBY-01" className="mono" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Institution"><Select value={form.inst} onChange={e => set('inst', e.target.value)} className="w-full">{(institutions.length ? institutions.map(i => i.name) : ['MBSE School', 'Pimpri Chinchwad University', 'MET School Nashik', 'ISF Head Office']).map(n => <option key={n}>{n}</option>)}</Select></Field>
        <Field label="Player"><Select value={form.platform} onChange={e => set('platform', e.target.value)} className="w-full">{Object.entries(PLATFORMS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</Select></Field>
        <Field label="Resolution"><Select value={form.resolution} onChange={e => set('resolution', e.target.value)} className="w-full">{['1366×768', '1920×1080', '3840×2160'].map(r => <option key={r}>{r}</option>)}</Select></Field>
        <Field label="Orientation"><Select value={form.orientation} onChange={e => set('orientation', e.target.value)} className="w-full"><option>landscape</option><option>portrait</option></Select></Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-plus" loading={busy} disabled={!form.name.trim()} onClick={async () => { setBusy(true); onAdded(await addScreen(form)) }}>Add screen</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Content & Playlists ───────── */
function ContentTab({ toast, onChange }) {
  const [view, setView] = useState('playlists')
  return (
    <div className="flex flex-col gap-4">
      <Chips options={[['playlists', 'Playlists'], ['library', 'Media library']]} value={view} onChange={setView} />
      {view === 'playlists' ? <Playlists toast={toast} onChange={onChange} /> : <Library toast={toast} />}
    </div>
  )
}

function Library({ toast }) {
  const [list, setList] = useState(null)
  const [type, setType] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(null)
  const load = useCallback(() => getContent().then(setList), [])
  useEffect(() => { load() }, [load])
  const counts = useMemo(() => { const c = { all: list?.length || 0 }; Object.keys(MEDIA_TYPES).forEach(k => c[k] = list?.filter(x => x.type === k).length || 0); return c }, [list])
  const shown = (list || []).filter(m => type === 'all' || m.type === type)
  const del = async (m) => { if (!window.confirm(`Delete ${m.name}?`)) return; setBusy(m.id); await deleteMedia(m.id); await load(); setBusy(null); toast('Deleted') }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <Chips options={[['all', 'All'], ...Object.entries(MEDIA_TYPES).map(([k, m]) => [k, m.label])]} value={type} onChange={setType} counts={counts} />
        <Btn variant="accent" icon="ti-upload" onClick={() => setUploading(true)}>Upload media</Btn>
      </div>
      {!list ? <Loader /> : shown.length === 0 ? <Empty icon="ti-photo">No media.</Empty> : (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {shown.map(m => { const t = MEDIA_TYPES[m.type]; return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ border: `1px solid ${C.border}` }}>
              <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.color + '14' }}><i className={`ti ${t.icon} text-[18px]`} style={{ color: t.color }} aria-hidden="true"></i></span>
              <div className="min-w-0 flex-1"><div className="text-[12.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{m.name}</div><div className="text-[11px]" style={{ color: C.textMuted }}>{t.label} · {m.folder} · {m.duration ? dur(m.duration) : 'Live'} · {sizeLabel(m.sizeMb)}</div></div>
              <IconBtn icon="ti-trash" title="Delete" danger loading={busy === m.id} onClick={() => del(m)} />
            </div>
          ) })}
        </div>
      )}
      {uploading && <UploadModal onClose={() => setUploading(false)} onDone={async () => { setUploading(false); await load(); toast('Media uploaded') }} />}
    </Card>
  )
}

function UploadModal({ onClose, onDone }) {
  const [file, setFile] = useState(null)
  const [folder, setFolder] = useState('Announcements')
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)
  return (
    <Modal title="Upload media" onClose={onClose}>
      {!file ? (
        <div onClick={() => ref.current?.click()} className="rounded-2xl py-9 flex flex-col items-center text-center cursor-pointer" style={{ border: `2px dashed ${C.borderStrong}`, background: C.surfaceAlt }}>
          <i className="ti ti-cloud-upload text-[26px] mb-2" style={{ color: ACCENT }} aria-hidden="true"></i>
          <div className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>Click to choose a file</div>
          <div className="text-[11.5px] mt-1" style={{ color: C.textMuted }}>Image · MP4 video · PDF</div>
          <input ref={ref} type="file" accept=".png,.jpg,.jpeg,.mp4,.pdf" className="hidden" onChange={e => setFile(e.target.files?.[0])} />
        </div>
      ) : (
        <>
          <div className="rounded-xl p-3 mb-3 flex items-center gap-3" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
            <i className="ti ti-file text-[18px]" style={{ color: C.textSecondary }} aria-hidden="true"></i>
            <div className="min-w-0 flex-1"><div className="text-[12.5px] font-semibold mono truncate" style={{ color: C.textPrimary }}>{file.name}</div><div className="text-[11px]" style={{ color: C.textMuted }}>{sizeLabel(file.size / 1048576)}{busy ? ` · ${progress}%` : ''}</div>
              {busy && <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: C.surface }}><div className="mk-stripe" style={{ height: '100%', width: `${progress}%`, background: ACCENT }} /></div>}</div>
          </div>
          <Field label="Folder"><Select value={folder} onChange={e => setFolder(e.target.value)} className="w-full">{['Announcements', 'Canteen', 'Notices', 'Marketing', 'Widgets', 'Web'].map(f => <option key={f}>{f}</option>)}</Select></Field>
        </>
      )}
      <div className="flex justify-end gap-2 pt-3">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-upload" loading={busy} disabled={!file} onClick={async () => { setBusy(true); await uploadMedia(file, { folder }, setProgress); onDone() }}>Upload</Btn>
      </div>
    </Modal>
  )
}

function Playlists({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null)
  const [pushing, setPushing] = useState(null)
  const [busy, setBusy] = useState(null)
  const load = useCallback(() => getPlaylists().then(setList), [])
  useEffect(() => { load() }, [load])
  const del = async (p) => { if (!window.confirm(`Delete playlist "${p.name}"?`)) return; setBusy(p.id); await deletePlaylist(p.id); await load(); setBusy(null); toast('Playlist deleted') }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>Playlists</span>
        <Btn variant="accent" icon="ti-plus" onClick={() => setEditing({})}>New playlist</Btn>
      </div>
      {!list ? <Loader /> : list.length === 0 ? <Empty icon="ti-playlist">No playlists.</Empty> : list.map(p => (
        <div key={p.id} className="mk-row px-5 py-4 flex items-center gap-4 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}><i className="ti ti-playlist text-[17px]" style={{ color: ACCENT }} aria-hidden="true"></i></span>
          <div className="min-w-0 flex-1" style={{ minWidth: 220 }}>
            <div className="text-[13.5px] font-semibold flex items-center gap-2 flex-wrap" style={{ color: C.textPrimary }}>{p.name}{p.loop && <Pill small meta={PILL.neutral('ti-repeat')}>Loop</Pill>}</div>
            <div className="text-[11.5px] mt-0.5 truncate" style={{ color: C.textMuted }}>{p.itemTitles.length} items · {dur(p.duration)} · on {p.screens} screen{p.screens === 1 ? '' : 's'} · by {p.by}</div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Btn variant="accent" icon="ti-send" onClick={() => setPushing(p)}>Push to screens</Btn>
            <IconBtn icon="ti-pencil" title="Edit" onClick={() => setEditing(p)} />
            <IconBtn icon="ti-trash" title="Delete" danger loading={busy === p.id} onClick={() => del(p)} />
          </div>
        </div>
      ))}
      {editing && <PlaylistEditor playlist={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); toast('Playlist saved') }} />}
      {pushing && <PushModal playlist={pushing} onClose={() => setPushing(null)} onPushed={async (n) => { setPushing(null); await load(); onChange(); toast(`Pushing to ${n} screen${n > 1 ? 's' : ''}`) }} />}
    </Card>
  )
}

function PlaylistEditor({ playlist, onClose, onSaved }) {
  const [name, setName] = useState(playlist.name || '')
  const [loop, setLoop] = useState(playlist.loop ?? true)
  const [items, setItems] = useState(playlist.items || [])
  const [media, setMedia] = useState([])
  const [busy, setBusy] = useState(false)
  useEffect(() => { getContent().then(setMedia) }, [])
  const toggle = (id) => setItems(x => x.includes(id) ? x.filter(i => i !== id) : [...x, id])

  return (
    <Modal title={playlist.id ? 'Edit playlist' : 'New playlist'} onClose={onClose} width={600}>
      <Field label="Playlist name"><Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning Announcements" /></Field>
      <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.textPrimary }}>Content ({items.length} selected, in order)</div>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1 mb-3">
        {media.map(m => { const t = MEDIA_TYPES[m.type]; const on = items.includes(m.id); const pos = items.indexOf(m.id) + 1; return (
          <button key={m.id} type="button" onClick={() => toggle(m.id)} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left cursor-pointer" style={{ border: `1px solid ${on ? ACCENT : C.border}`, background: on ? THEME.accentBg : C.surface }}>
            <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: on ? ACCENT : C.surfaceAlt, color: on ? '#fff' : C.textMuted, border: on ? 'none' : `1px solid ${C.border}` }}>{on ? pos : ''}</span>
            <i className={`ti ${t.icon} text-[16px]`} style={{ color: t.color }} aria-hidden="true"></i>
            <span className="text-[12.5px] font-semibold truncate flex-1" style={{ color: C.textPrimary }}>{m.name}</span>
            <span className="text-[11px] shrink-0" style={{ color: C.textMuted }}>{dur(m.duration)}</span>
          </button>
        ) })}
      </div>
      <div className="rounded-xl px-4 py-1 mb-2" style={{ border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between py-2.5"><span className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>Loop playlist</span><Switch on={loop} onChange={setLoop} /></div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-device-floppy" loading={busy} disabled={!name.trim() || !items.length} onClick={async () => { setBusy(true); await savePlaylist({ id: playlist.id, name: name.trim(), items, loop }); onSaved() }}>Save playlist</Btn>
      </div>
    </Modal>
  )
}

function PushModal({ playlist, onClose, onPushed }) {
  const [screens, setScreens] = useState([])
  const [sel, setSel] = useState([])
  const [busy, setBusy] = useState(false)
  useEffect(() => { getScreens().then(s => setScreens(s.filter(x => x.status !== 'offline'))) }, [])
  const insts = [...new Set(screens.map(s => s.inst))].map(name => ({ id: name, name }))
  const countFor = (i) => screens.filter(s => s.inst === i.name).length
  // map selected institution ids → their screens
  const selScreens = screens.filter(s => sel.includes(s.inst)).map(s => s.id)

  return (
    <Modal title={`Push "${playlist.name}"`} onClose={onClose} width={560}>
      <TargetPicker institutions={insts} value={sel} onChange={setSel} countFor={countFor} unit="screens" />
      <div className="flex justify-end gap-2 pt-5">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-send" loading={busy} disabled={!sel.length} onClick={async () => { setBusy(true); await pushPlaylist(playlist.id, { screenIds: selScreens, label: playlist.name }); onPushed(selScreens.length) }}>Push to {selScreens.length} screen{selScreens.length !== 1 ? 's' : ''}</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Scheduling ───────── */
function SchedulingTab({ institutions, toast }) {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(null)
  const load = useCallback(() => getSchedules().then(setList), [])
  useEffect(() => { load() }, [load])
  const del = async (s) => { if (!window.confirm(`Delete schedule "${s.name}"?`)) return; setBusy(s.id); await deleteSchedule(s.id); await load(); setBusy(null); toast('Schedule deleted') }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>Content schedules (day-parting)</span>
        <Btn variant="accent" icon="ti-plus" onClick={() => setEditing({})}>New schedule</Btn>
      </div>
      {!list ? <Loader /> : list.length === 0 ? <Empty icon="ti-calendar-off">No schedules.</Empty> : list.map(s => (
        <div key={s.id} className="mk-row px-5 py-4 flex items-center gap-4 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}><i className="ti ti-calendar-event text-[17px]" style={{ color: ACCENT }} aria-hidden="true"></i></span>
          <div className="min-w-0 flex-1" style={{ minWidth: 240 }}>
            <div className="text-[13.5px] font-semibold flex items-center gap-2 flex-wrap" style={{ color: C.textPrimary }}>{s.name}{s.status === 'scheduled' ? <Pill small meta={PILL.neutral('ti-clock')}>Scheduled</Pill> : <Pill small meta={PILL.success()}>Active</Pill>}</div>
            <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{s.playlist} → {s.target} · {s.start}–{s.end} · {s.days.length === 7 ? 'Daily' : s.days.join(', ')}</div>
          </div>
          <div className="flex gap-1.5 shrink-0"><IconBtn icon="ti-pencil" title="Edit" onClick={() => setEditing(s)} /><IconBtn icon="ti-trash" title="Delete" danger loading={busy === s.id} onClick={() => del(s)} /></div>
        </div>
      ))}
      {editing && <ScheduleEditor sched={editing} institutions={institutions} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); toast('Schedule saved') }} />}
    </Card>
  )
}

function ScheduleEditor({ sched, institutions, onClose, onSaved }) {
  const [form, setForm] = useState({ name: sched.name || '', playlist: sched.playlist || '', target: sched.target || (institutions[0]?.name || 'MBSE School'), start: sched.start || '08:00', end: sched.end || '17:00', days: sched.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] })
  const [playlists, setPlaylists] = useState([])
  const [busy, setBusy] = useState(false)
  useEffect(() => { getPlaylists().then(p => { setPlaylists(p); setForm(f => ({ ...f, playlist: f.playlist || p[0]?.name || '' })) }) }, [])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleDay = (d) => set('days', form.days.includes(d) ? form.days.filter(x => x !== d) : [...form.days, d])

  return (
    <Modal title={sched.id ? 'Edit schedule' : 'New schedule'} onClose={onClose} width={560}>
      <Field label="Schedule name"><Input autoFocus value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Lunch menu (day-part)" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Playlist"><Select value={form.playlist} onChange={e => set('playlist', e.target.value)} className="w-full">{playlists.map(p => <option key={p.id}>{p.name}</option>)}</Select></Field>
        <Field label="Target"><Select value={form.target} onChange={e => set('target', e.target.value)} className="w-full">{(institutions.length ? institutions.map(i => i.name) : ['MBSE School', 'Pimpri Chinchwad University', 'MET School Nashik', 'ISF Head Office']).map(n => <option key={n}>{n}</option>)}</Select></Field>
        <Field label="Start time"><Input type="time" value={form.start} onChange={e => set('start', e.target.value)} /></Field>
        <Field label="End time"><Input type="time" value={form.end} onChange={e => set('end', e.target.value)} /></Field>
      </div>
      <div className="text-[12px] font-semibold mb-1.5" style={{ color: C.textPrimary }}>Days</div>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {DAYS.map(d => { const on = form.days.includes(d); return <button key={d} type="button" onClick={() => toggleDay(d)} className="text-[12px] font-semibold w-12 py-1.5 rounded-lg cursor-pointer" style={on ? { background: C.textPrimary, color: '#fff', border: `1px solid ${C.textPrimary}` } : { background: C.surface, color: C.textSecondary, border: `1px solid ${C.border}` }}>{d}</button> })}
      </div>
      <div className="flex justify-end gap-2 pt-3">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-device-floppy" loading={busy} disabled={!form.name.trim() || !form.days.length} onClick={async () => { setBusy(true); await saveSchedule({ id: sched.id, ...form }); onSaved() }}>Save schedule</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Analytics ───────── */
function AnalyticsTab({ toast }) {
  const [data, setData] = useState(null)
  const [exporting, setExporting] = useState(false)
  useEffect(() => { getAnalytics().then(setData) }, [])
  if (!data) return <Loader label="Aggregating playback logs…" />
  const maxPlays = Math.max(1, ...data.rows.map(r => r.plays))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label="Total plays" value={fmt(data.totalPlays)} sub="This month" icon="ti-player-play" color={ACCENT} />
        <Kpi label="Content tracked" value={data.rows.length} sub="Items with playback" icon="ti-slideshow" color="#2563EB" />
        <Kpi label="Avg screen uptime" value={`${(data.screenUptime.filter(s => s.status !== 'offline').reduce((t, s) => t + s.uptime, 0) / Math.max(1, data.screenUptime.filter(s => s.status !== 'offline').length)).toFixed(1)}%`} sub="Live screens" icon="ti-activity" color={C.success} />
      </div>
      <Card>
        <CardHeader title="Most-played content" sub="By play count this month" right={<Btn variant="primary" icon="ti-file-spreadsheet" loading={exporting} onClick={async () => { setExporting(true); downloadBlob(await exportAnalytics(data.rows), `signage-analytics-${new Date().toISOString().slice(0, 10)}.csv`); setExporting(false); toast('Report exported') }}>Export</Btn>} />
        <div className="p-5 flex flex-col gap-3">
          {data.rows.slice(0, 9).map(r => { const t = MEDIA_TYPES[r.type]; return (
            <div key={r.name}>
              <div className="flex justify-between gap-3 text-[12.5px] mb-1.5"><span className="font-semibold flex items-center gap-1.5 truncate" style={{ color: C.textPrimary }}><i className={`ti ${t.icon} text-[13px]`} style={{ color: t.color }} aria-hidden="true"></i>{r.name}</span><span className="shrink-0" style={{ color: C.textSecondary }}>{fmt(r.plays)} plays · {r.hours} h</span></div>
              <div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${(r.plays / maxPlays) * 100}%`, background: ACCENT }} /></div>
            </div>
          ) })}
        </div>
      </Card>
      <Card>
        <CardHeader title="Screen uptime" sub="Last 30 days" />
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 600 }}>
            <thead><tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}><th className="px-5 py-2.5">Screen</th><th className="px-3 py-2.5">Site</th><th className="px-3 py-2.5 w-[30%]">Uptime</th><th className="px-5 py-2.5 text-right">%</th></tr></thead>
            <tbody>
              {data.screenUptime.map(s => (
                <tr key={s.name} className="mk-row" style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="px-5 py-2.5 text-[12.5px] font-semibold mono" style={{ color: C.textPrimary }}>{s.name}</td>
                  <td className="px-3 py-2.5 text-[12px]" style={{ color: C.textSecondary }}>{s.inst}</td>
                  <td className="px-3 py-2.5"><div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${s.uptime}%`, background: s.uptime >= 98 ? C.success : s.uptime >= 90 ? '#E0A526' : C.red }} /></div></td>
                  <td className="px-5 py-2.5 text-right text-[12.5px] font-semibold" style={{ color: s.status === 'offline' ? C.red : C.textPrimary }}>{s.status === 'offline' ? 'Offline' : `${s.uptime}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
