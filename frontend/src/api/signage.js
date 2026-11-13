import api from './axios'
import { toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Digital Signage API layer — LIVE backend.
   Talks to /easyreach/signage/...  (admin) ; players use /easyreach/signage/player/...
   Media is stored on the office on-prem server (Nginx); players pull straight from it.
   The page (pages/signage/SignageView.jsx) needs no change.
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

// GET /signage/summary
export const getSignageSummary = async () => {
  const res = await api.get('/easyreach/signage/summary')
  return res.data
}

/* ── Screens ── */
// GET /signage/screens
export const getScreens = async () => {
  const res = await api.get('/easyreach/signage/screens')
  return res.data.data || []
}

// POST /signage/screens
export const addScreen = async (data) => {
  const res = await api.post('/easyreach/signage/screens', {
    name: data.name, inst: data.inst, platform: data.platform,
    resolution: data.resolution, orientation: data.orientation,
  })
  return res.data.data   // includes enrollToken (pair the player with this)
}

// POST /signage/screens/{id}/command   type = restart | refresh | power_on | power_off | screenshot
export const screenCommand = async (id, type) => {
  const res = await api.post(`/easyreach/signage/screens/${id}/command`, { type })
  return res.data
}

// DELETE /signage/screens/{id}
export const deleteScreen = async (id) => {
  const res = await api.delete(`/easyreach/signage/screens/${id}`)
  return res.data
}

/* ── Content library ── */
// GET /signage/content
export const getContent = async () => {
  const res = await api.get('/easyreach/signage/content')
  return res.data.data || []
}

// POST /signage/content  (multipart)
export const uploadMedia = async (file, { folder, duration }, onProgress) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', folder || 'General')
  if (duration) fd.append('duration', duration)
  const res = await api.post('/easyreach/signage/content', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100)) },
  })
  return res.data.data
}

// POST /signage/content/web   { name, type: web|widget, url, duration }
export const addWebContent = async (data) => {
  const res = await api.post('/easyreach/signage/content/web', data)
  return res.data.data
}

// DELETE /signage/content/{id}
export const deleteMedia = async (id) => {
  const res = await api.delete(`/easyreach/signage/content/${id}`)
  return res.data
}

/* ── Playlists ── */
// GET /signage/playlists
export const getPlaylists = async () => {
  const res = await api.get('/easyreach/signage/playlists')
  return res.data.data || []
}

// POST /signage/playlists
export const savePlaylist = async ({ id, name, items, loop }) => {
  const res = await api.post('/easyreach/signage/playlists', { id: id || null, name, items, loop })
  return res.data.data
}

// DELETE /signage/playlists/{id}
export const deletePlaylist = async (id) => {
  const res = await api.delete(`/easyreach/signage/playlists/${id}`)
  return res.data
}

// POST /signage/playlists/{id}/push   { screenIds, label }
export const pushPlaylist = async (playlistId, { screenIds, label }) => {
  const res = await api.post(`/easyreach/signage/playlists/${playlistId}/push`, { screenIds, label })
  return res.data
}

/* ── Scheduling ── */
// GET /signage/schedules
export const getSchedules = async () => {
  const res = await api.get('/easyreach/signage/schedules')
  return res.data.data || []
}

// POST /signage/schedules
export const saveSchedule = async ({ id, ...data }) => {
  const res = await api.post('/easyreach/signage/schedules', { id: id || null, ...data })
  return res.data.data
}

// DELETE /signage/schedules/{id}
export const deleteSchedule = async (id) => {
  const res = await api.delete(`/easyreach/signage/schedules/${id}`)
  return res.data
}

/* ── Analytics ── */
// GET /signage/analytics
export const getAnalytics = async () => {
  const res = await api.get('/easyreach/signage/analytics')
  return res.data
}

// Analytics CSV — built client-side from the rows the page already has.
export const exportAnalytics = async (rows) => {
  return toCsvBlob(['Content', 'Type', 'Plays', 'Screen-hours'], (rows || []).map(r => [r.name, r.type, r.plays, r.hours]))
}
