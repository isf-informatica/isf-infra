import api from './axios'
import { toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Digital Rights Management API layer — LIVE backend.
   Real content-key server: uploads are AES-256-GCM encrypted (key held server-side),
   SHA-256 fingerprinted, stored on the office on-prem server. A native DRM player
   checks out a content key via /easyreach/drm/license/checkout (seats/expiry/geo
   enforced) and gets a forensic watermark payload for leak tracing.
   Endpoints: /easyreach/drm/...   Page (pages/drm/DrmView.jsx) unchanged.
   ───────────────────────────────────────────────────────────────────────────── */

export const DEFAULT_POLICY = () => ({
  perms: { view: true, download: false, print: false, printPages: 10, copy: false, screenCapture: false, annotate: true, share: false },
  device: { maxDevices: 2, concurrent: 1 },
  time: { mode: 'subscription', days: 365, start: '', end: '', offlineDays: 7 },
  geo: { restrict: false, regions: ['India'], ipRanges: [] },
  quality: { maxRes: '720p' },
  watermark: { visible: true, text: '{name} · {id} · {time}', position: 'diagonal', opacity: 18, forensic: true },
})

const animateStages = async (stages, onStage) => {
  for (let i = 0; i < stages.length; i++) {
    for (let p = 0; p < 100; p += 16 + Math.round(Math.random() * 18)) {
      onStage?.(i, Math.min(99, p), stages)
      await new Promise(r => setTimeout(r, 55 + Math.random() * 70))
    }
    onStage?.(i, 100, stages)
  }
}

/* ── Summary ── */
// GET /drm/summary
export const getDrmSummary = async () => {
  const res = await api.get('/easyreach/drm/summary')
  return res.data
}

/* ── Protected content ── */
// GET /drm/assets
export const getAssets = async () => {
  const res = await api.get('/easyreach/drm/assets')
  return res.data.data || []
}

// POST /drm/assets  (multipart → hash → AES-256-GCM → register key)
export const protectAsset = async (file, { title, policyId, watermark }, onStage) => {
  const isVideo = /\.(mp4|mkv|mov|webm)$/i.test(file.name)
  const stages = [
    ['upload', 'Uploading original to secure storage'],
    ['hash', 'Computing SHA-256 fingerprint'],
    ['encrypt', isVideo ? 'Encrypting & segmenting (AES)' : 'Encrypting with AES-256-GCM'],
    ['watermark', watermark ? 'Registering forensic watermark layer' : 'Skipping watermark'],
    ['register', 'Registering content key with license server'],
  ]
  const fd = new FormData()
  fd.append('file', file)
  fd.append('title', title || file.name.replace(/\.[^.]+$/, ''))
  if (policyId != null) fd.append('policyId', policyId)
  fd.append('watermark', watermark ? 'true' : 'false')
  // run the staged UI animation while the encrypted upload happens
  const [res] = await Promise.all([
    api.post('/easyreach/drm/assets', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    animateStages(stages, onStage),
  ])
  return res.data.data
}

// POST /drm/assets/{id}/rotate-key
export const rotateKey = async (id) => {
  const res = await api.post(`/easyreach/drm/assets/${id}/rotate-key`)
  return res.data
}

// POST /drm/assets/{id}/verify
export const verifyIntegrity = async (id) => {
  const res = await api.post(`/easyreach/drm/assets/${id}/verify`)
  return res.data
}

// PATCH /drm/assets/{id}   { policyId }
export const setAssetPolicy = async (id, policyId) => {
  const res = await api.patch(`/easyreach/drm/assets/${id}`, { policyId })
  return res.data
}

// POST /drm/assets/{id}/revoke-all
export const revokeAsset = async (id) => {
  const res = await api.post(`/easyreach/drm/assets/${id}/revoke-all`)
  return res.data
}

/* ── Rights policies ── */
// GET /drm/policies
export const getPolicies = async () => {
  const res = await api.get('/easyreach/drm/policies')
  return res.data.data || []
}

// POST /drm/policies   (create or update when id present)
export const savePolicy = async ({ id, name, desc, settings }) => {
  const res = await api.post('/easyreach/drm/policies', { id: id || null, name, desc, settings })
  return res.data.data
}

/* ── Licenses ── */
// GET /drm/licenses
export const getLicenses = async () => {
  const res = await api.get('/easyreach/drm/licenses')
  return res.data.data || []
}

// POST /drm/licenses
export const issueLicense = async ({ licensee, assetId, policyId, seats, days, startsAt }) => {
  const res = await api.post('/easyreach/drm/licenses', { licensee, assetId, policyId, seats: +seats, days: +days, startsAt: startsAt || null })
  return res.data.data
}

// POST /drm/licenses/{id}/renew   { days }
export const renewLicense = async (id, days) => {
  const res = await api.post(`/easyreach/drm/licenses/${id}/renew`, { days: +days })
  return res.data.data
}

// POST /drm/licenses/{id}/revoke
export const revokeLicense = async (id) => {
  const res = await api.post(`/easyreach/drm/licenses/${id}/revoke`)
  return res.data.data
}

// POST /drm/licenses/{id}/seats   { add }
export const addSeats = async (id, n) => {
  const res = await api.post(`/easyreach/drm/licenses/${id}/seats`, { add: +n })
  return res.data.data
}

/* ── Devices ── */
// GET /drm/devices
export const getDevices = async () => {
  const res = await api.get('/easyreach/drm/devices')
  return res.data.data || []
}

// PATCH /drm/devices/{id}   { status }
export const setDeviceStatus = async (id, status) => {
  const res = await api.patch(`/easyreach/drm/devices/${id}`, { status })
  return res.data.data
}

/* ── Audit log ── */
// GET /drm/events
export const getEvents = async () => {
  const res = await api.get('/easyreach/drm/events')
  return res.data.data || []
}

// Events CSV — built client-side.
export const exportEvents = async (rows) => {
  return toCsvBlob(
    ['Time', 'User', 'User ID', 'Institution', 'Device', 'IP', 'Location', 'Content', 'Action', 'Result', 'Reason'],
    (rows || []).map(r => [r.at ? new Date(r.at).toLocaleString('en-IN') : '', r.user, r.userId, r.school, r.device, r.ip, r.location, r.asset, r.action, r.result, r.reason || '']))
}

/* ── Forensic leak tracing ── */
// POST /drm/forensics/trace  (multipart → scan for embedded watermark payload)
export const traceLeak = async (file, onStage) => {
  const stages = ['Normalising image / frames', 'Detecting forensic watermark', 'Decoding payload', 'Matching license & device record']
  const fd = new FormData()
  fd.append('file', file)
  const [res] = await Promise.all([
    api.post('/easyreach/drm/forensics/trace', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    animateStages(stages, onStage),
  ])
  return res.data.data
}

// GET /drm/forensics/traces
export const getTraces = async () => {
  const res = await api.get('/easyreach/drm/forensics/traces')
  return res.data.data || []
}
