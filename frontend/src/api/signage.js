import { latency, uid, minsAgo, clone, currentUser, createStore, tickRollouts, toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Digital Signage API layer.

   ⚠️ DEMO MODE — backend endpoints do not exist yet. Replace each function body
   with the commented endpoint above it when the signage backend is ready; the
   page (pages/signage/SignageView.jsx) does not need any change.
   Reset demo data: localStorage.removeItem('easyreach_signage_store_v1')
   ───────────────────────────────────────────────────────────────────────────── */

export const PLATFORMS = {
  android: { label: 'Android', icon: 'ti-brand-android', color: '#3DDC84' },
  windows: { label: 'Windows', icon: 'ti-brand-windows', color: '#0078D4' },
  rpi: { label: 'Raspberry Pi', icon: 'ti-cpu', color: '#C51A4A' },
  smarttv: { label: 'Smart TV', icon: 'ti-device-tv', color: '#7C5CFC' },
}

export const MEDIA_TYPES = {
  image: { label: 'Image', icon: 'ti-photo', color: '#16B8A6' },
  video: { label: 'Video', icon: 'ti-player-play', color: '#7C5CFC' },
  pdf: { label: 'PDF', icon: 'ti-file-type-pdf', color: '#E4483C' },
  web: { label: 'Web page', icon: 'ti-world-www', color: '#2563EB' },
  widget: { label: 'Widget', icon: 'ti-layout-board-split', color: '#D97706' },
}

const INSTS = ['MBSE School', 'Pimpri Chinchwad University', 'MET School Nashik', 'ISF Head Office']

const seed = () => {
  const screens = [
    ['SIGN-MBSE-LOBBY', 'MBSE School', 'android', 'online', '1920×1080', 'landscape', 'Morning Announcements', 2],
    ['SIGN-MBSE-CANTEEN', 'MBSE School', 'rpi', 'online', '1920×1080', 'landscape', 'Lunch Menu Board', 6],
    ['SIGN-PCU-ENTRANCE', 'Pimpri Chinchwad University', 'smarttv', 'online', '3840×2160', 'landscape', 'Campus Notices 4K', 1],
    ['SIGN-PCU-LIBRARY', 'Pimpri Chinchwad University', 'windows', 'online', '1920×1080', 'portrait', 'Library Timings', 12],
    ['SIGN-PCU-AUDITORIUM', 'Pimpri Chinchwad University', 'android', 'syncing', '1920×1080', 'landscape', 'Event Schedule', 0],
    ['SIGN-MET-RECEPTION', 'MET School Nashik', 'android', 'online', '1920×1080', 'landscape', 'Welcome Loop', 4],
    ['SIGN-MET-CORRIDOR', 'MET School Nashik', 'rpi', 'offline', '1366×768', 'landscape', 'Exam Timetable', 60 * 24 * 2],
    ['SIGN-ISF-RECEPTION', 'ISF Head Office', 'smarttv', 'online', '3840×2160', 'landscape', 'Company KPIs', 3],
    ['SIGN-ISF-MEETING', 'ISF Head Office', 'windows', 'offline', '1920×1080', 'landscape', 'Meeting Room Status', 60 * 5],
  ].map(([name, inst, platform, status, resolution, orientation, playing, mins], i) => ({
    id: `sc_${i + 1}`, name, inst, platform, status, resolution, orientation, playing,
    lastSeen: minsAgo(status === 'online' ? mins : status === 'syncing' ? 0 : mins),
    uptime: status === 'offline' ? 0 : +(96 + Math.random() * 3.9).toFixed(1),
    cpu: status === 'offline' ? 0 : 10 + Math.floor(Math.random() * 45),
    storage: 30 + Math.floor(Math.random() * 55),
  }))

  const content = [
    { id: 'md_01', name: 'Morning Announcements', type: 'video', sizeMb: 86, duration: 45, folder: 'Announcements', uploadedAt: minsAgo(60 * 20), by: 'Yash' },
    { id: 'md_02', name: 'Lunch Menu Board', type: 'image', sizeMb: 3.2, duration: 15, folder: 'Canteen', uploadedAt: minsAgo(60 * 30), by: 'Shyam' },
    { id: 'md_03', name: 'Annual Exam Timetable', type: 'pdf', sizeMb: 0.6, duration: 20, folder: 'Notices', uploadedAt: minsAgo(60 * 5), by: 'Yash' },
    { id: 'md_04', name: 'Campus Virtual Tour', type: 'video', sizeMb: 310, duration: 120, folder: 'Marketing', uploadedAt: minsAgo(60 * 70), by: 'Yash' },
    { id: 'md_05', name: 'Live Weather + Clock', type: 'widget', sizeMb: 0.1, duration: 0, folder: 'Widgets', uploadedAt: minsAgo(60 * 24 * 5), by: 'Shyam' },
    { id: 'md_06', name: 'News Ticker (RSS)', type: 'widget', sizeMb: 0.1, duration: 0, folder: 'Widgets', uploadedAt: minsAgo(60 * 24 * 5), by: 'Shyam' },
    { id: 'md_07', name: 'Admission Open 2026-27', type: 'image', sizeMb: 4.8, duration: 12, folder: 'Marketing', uploadedAt: minsAgo(60 * 48), by: 'Yash' },
    { id: 'md_08', name: 'Safety Guidelines', type: 'pdf', sizeMb: 1.1, duration: 25, folder: 'Notices', uploadedAt: minsAgo(60 * 90), by: 'Shyam' },
    { id: 'md_09', name: 'Fee Payment Portal', type: 'web', sizeMb: 0, duration: 30, folder: 'Web', uploadedAt: minsAgo(60 * 24 * 2), by: 'Yash' },
  ]

  const playlists = [
    { id: 'pl_01', name: 'Morning Announcements', items: ['md_01', 'md_05', 'md_06'], screens: 2, loop: true, updatedAt: minsAgo(60 * 8), by: 'Yash' },
    { id: 'pl_02', name: 'Lunch Menu Board', items: ['md_02', 'md_05'], screens: 1, loop: true, updatedAt: minsAgo(60 * 30), by: 'Shyam' },
    { id: 'pl_03', name: 'Campus Notices 4K', items: ['md_04', 'md_07', 'md_03', 'md_06'], screens: 3, loop: true, updatedAt: minsAgo(60 * 12), by: 'Yash' },
    { id: 'pl_04', name: 'Exam Timetable', items: ['md_03', 'md_08'], screens: 2, loop: true, updatedAt: minsAgo(60 * 50), by: 'Shyam' },
    { id: 'pl_05', name: 'Welcome Loop', items: ['md_07', 'md_05', 'md_09'], screens: 1, loop: true, updatedAt: minsAgo(60 * 24), by: 'Yash' },
  ]

  const schedules = [
    { id: 'sh_01', name: 'School-hours announcements', playlist: 'Morning Announcements', target: 'MBSE School', start: '08:00', end: '09:30', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], status: 'active', by: 'Yash' },
    { id: 'sh_02', name: 'Lunch menu (day-part)', playlist: 'Lunch Menu Board', target: 'MBSE School', start: '12:00', end: '14:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], status: 'active', by: 'Shyam' },
    { id: 'sh_03', name: 'Admission campaign', playlist: 'Campus Notices 4K', target: 'Pimpri Chinchwad University', start: '09:00', end: '18:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], status: 'active', by: 'Yash' },
    { id: 'sh_04', name: 'Exam week timetable', playlist: 'Exam Timetable', target: 'MET School Nashik', start: '08:00', end: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], status: 'scheduled', by: 'Shyam' },
  ]

  return {
    screens, content, playlists, schedules,
    alerts: [
      { id: 'al_01', kind: 'offline', sev: 'high', title: 'Screen offline > 2 days', detail: 'SIGN-MET-CORRIDOR — MET School Nashik', at: minsAgo(30) },
      { id: 'al_02', kind: 'offline', sev: 'medium', title: 'Screen offline', detail: 'SIGN-ISF-MEETING — ISF Head Office', at: minsAgo(60 * 5) },
      { id: 'al_03', kind: 'playback', sev: 'medium', title: 'Playback error — media failed to load', detail: 'Campus Virtual Tour on SIGN-PCU-ENTRANCE', at: minsAgo(95) },
      { id: 'al_04', kind: 'storage', sev: 'low', title: 'Storage above 80%', detail: 'SIGN-PCU-LIBRARY — 84% used', at: minsAgo(60 * 3) },
    ],
    deployments: [],
  }
}

const store = createStore('easyreach_signage_store_v1', seed)
const S = () => store.get()
const title = (id) => S().content.find(c => c.id === id)?.name

// GET /signage/summary
export const getSignageSummary = async () => {
  await latency()
  const s = S()
  const online = s.screens.filter(x => x.status === 'online').length
  const offline = s.screens.filter(x => x.status === 'offline').length
  const live = s.screens.filter(x => x.status !== 'offline')
  const playCount = {}
  s.screens.forEach(x => { if (x.status !== 'offline') playCount[x.playing] = (playCount[x.playing] || 0) + 1 })
  return {
    total: s.screens.length, online, offline, syncing: s.screens.filter(x => x.status === 'syncing').length,
    content: s.content.length, playlists: s.playlists.length,
    uptime: live.length ? +(live.reduce((t, x) => t + x.uptime, 0) / live.length).toFixed(1) : 0,
    alerts: s.alerts.length,
    byLocation: INSTS.map(i => ({ inst: i, total: s.screens.filter(x => x.inst === i).length, online: s.screens.filter(x => x.inst === i && x.status === 'online').length })).filter(x => x.total),
    nowPlaying: Object.entries(playCount).sort((a, b) => b[1] - a[1]).slice(0, 5),
    recentAlerts: clone(s.alerts).slice(0, 5),
  }
}

/* ── Screens ── */
// GET /signage/screens
export const getScreens = async () => { await latency(); return clone(S().screens).sort((a, b) => a.name.localeCompare(b.name)) }

// POST /signage/screens
export const addScreen = async (data) => {
  await latency(500, 900)
  const sc = { id: uid('sc'), status: 'syncing', uptime: 0, cpu: 0, storage: 0, playing: '—', lastSeen: new Date().toISOString(), ...data }
  store.set(s => { s.screens.unshift(sc) })
  return clone(sc)
}

// POST /signage/screens/{id}/command   type = restart | refresh | power_on | power_off | screenshot
export const screenCommand = async (id, type) => {
  await latency(600, 1100)
  store.set(s => {
    const sc = s.screens.find(x => x.id === id)
    if (!sc) return
    if (type === 'power_off') { sc.status = 'offline'; sc.playing = '—'; sc.uptime = 0 }
    if (type === 'power_on' || type === 'restart') { sc.status = 'online'; sc.lastSeen = new Date().toISOString() }
    if (type === 'refresh') sc.lastSeen = new Date().toISOString()
  })
  if (type === 'screenshot') return { ok: true, capturedAt: new Date().toISOString() }
  return { ok: true }
}

// DELETE /signage/screens/{id}
export const deleteScreen = async (id) => { await latency(); store.set(s => { s.screens = s.screens.filter(x => x.id !== id) }); return { ok: true } }

/* ── Content library ── */
// GET /signage/content
export const getContent = async () => { await latency(); return clone(S().content).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)) }

// POST /signage/content  (multipart)
export const uploadMedia = async (file, { folder }, onProgress) => {
  for (let p = 0; p <= 100; p += 16 + Math.round(Math.random() * 12)) { await new Promise(r => setTimeout(r, 70 + Math.random() * 70)); onProgress?.(Math.min(100, p)) }
  onProgress?.(100); await latency(200, 400)
  const n = file.name.toLowerCase()
  const type = /\.(mp4|mkv|mov|webm)$/.test(n) ? 'video' : /\.pdf$/.test(n) ? 'pdf' : /\.(png|jpe?g|gif|webp)$/.test(n) ? 'image' : 'image'
  const m = { id: uid('md'), name: file.name.replace(/\.[^.]+$/, ''), type, sizeMb: +(file.size / 1048576).toFixed(1), duration: type === 'video' ? 60 : 15, folder, uploadedAt: new Date().toISOString(), by: currentUser() }
  store.set(s => { s.content.unshift(m) })
  return clone(m)
}

// DELETE /signage/content/{id}
export const deleteMedia = async (id) => { await latency(); store.set(s => { s.content = s.content.filter(c => c.id !== id) }); return { ok: true } }

/* ── Playlists ── */
// GET /signage/playlists
export const getPlaylists = async () => {
  await latency()
  return clone(S().playlists).map(p => ({ ...p, itemTitles: p.items.map(title).filter(Boolean), duration: p.items.reduce((t, id) => t + (S().content.find(c => c.id === id)?.duration || 0), 0) }))
}

// POST /signage/playlists
export const savePlaylist = async ({ id, name, items, loop }) => {
  await latency(500, 900)
  let pl
  store.set(s => {
    if (id) { pl = s.playlists.find(x => x.id === id); Object.assign(pl, { name, items, loop, updatedAt: new Date().toISOString(), by: currentUser() }) }
    else { pl = { id: uid('pl'), name, items, loop, screens: 0, updatedAt: new Date().toISOString(), by: currentUser() }; s.playlists.unshift(pl) }
  })
  return clone(pl)
}

// DELETE /signage/playlists/{id}
export const deletePlaylist = async (id) => { await latency(); store.set(s => { s.playlists = s.playlists.filter(p => p.id !== id) }); return { ok: true } }

// POST /signage/playlists/{id}/push   { screen_ids }
export const pushPlaylist = async (playlistId, { screenIds, label }) => {
  await latency(700, 1200)
  store.set(s => {
    const pl = s.playlists.find(p => p.id === playlistId)
    if (pl) pl.screens = screenIds.length
    s.screens.forEach(sc => { if (screenIds.includes(sc.id) && sc.status !== 'offline') { sc.playing = pl?.name || sc.playing; sc.status = 'syncing' } })
  })
  // flip syncing→online shortly, simulated on next getScreens via a timestamp check isn't trivial; keep simple
  setTimeout(() => store.set(s => { s.screens.forEach(sc => { if (sc.status === 'syncing') sc.status = 'online' }) }), 2500)
  return { ok: true, pushed: screenIds.length, label }
}

/* ── Scheduling ── */
// GET /signage/schedules
export const getSchedules = async () => { await latency(); return clone(S().schedules) }

// POST /signage/schedules
export const saveSchedule = async ({ id, ...data }) => {
  await latency(500, 900)
  let sh
  store.set(s => {
    if (id) { sh = s.schedules.find(x => x.id === id); Object.assign(sh, data) }
    else { sh = { id: uid('sh'), status: 'active', by: currentUser(), ...data }; s.schedules.unshift(sh) }
  })
  return clone(sh)
}

// DELETE /signage/schedules/{id}
export const deleteSchedule = async (id) => { await latency(); store.set(s => { s.schedules = s.schedules.filter(x => x.id !== id) }); return { ok: true } }

/* ── Analytics ── */
// GET /signage/analytics
export const getAnalytics = async () => {
  await latency()
  const s = S()
  const rows = s.content.map(c => {
    const plays = Math.round((c.duration ? 400 - c.duration : 500) * (0.6 + Math.random()))
    return { name: c.name, type: c.type, plays, hours: +((plays * (c.duration || 15)) / 3600).toFixed(1) }
  }).sort((a, b) => b.plays - a.plays)
  const screenUptime = s.screens.map(x => ({ name: x.name, inst: x.inst, uptime: x.uptime, status: x.status })).sort((a, b) => b.uptime - a.uptime)
  return { rows, screenUptime, totalPlays: rows.reduce((t, r) => t + r.plays, 0) }
}

// GET /signage/analytics/export
export const exportAnalytics = async (rows) => {
  await latency(400, 700)
  return toCsvBlob(['Content', 'Type', 'Plays', 'Screen-hours'], rows.map(r => [r.name, r.type, r.plays, r.hours]))
}

export { tickRollouts }
