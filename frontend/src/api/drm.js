import { latency, uid, minsAgo, clone, currentUser, createStore, toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Digital Rights Management API layer.

   ⚠️ DEMO MODE — backend endpoints do not exist yet. Replace each function body
   with the commented endpoint above it when the DRM microservice is ready
   (FastAPI: licenses, devices, policies, content keys, forensic trace). The
   page (pages/drm/DrmView.jsx) does not need any change.
   Reset demo data: localStorage.removeItem('easyreach_drm_store_v2')
   ───────────────────────────────────────────────────────────────────────────── */

export const DEFAULT_POLICY = () => ({
  perms: { view: true, download: false, print: false, printPages: 10, copy: false, screenCapture: false, annotate: true, share: false },
  device: { maxDevices: 2, concurrent: 1 },
  time: { mode: 'subscription', days: 365, start: '', end: '', offlineDays: 7 },
  geo: { restrict: false, regions: ['India'], ipRanges: [] },
  quality: { maxRes: '720p' },
  watermark: { visible: true, text: '{name} · {id} · {time}', position: 'diagonal', opacity: 18, forensic: true },
})

const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
const keyId = () => `kid-${hex(4)}-${hex(4)}`
const dayIso = (days) => new Date(Date.now() + days * 86400000).toISOString()

const STUDENTS = [
  ['Aarav Patil', 'STU-20261040', 'MBSE School'], ['Sneha Kulkarni', 'STU-20260871', 'MBSE School'],
  ['Rahul Kadam', 'PCU-23BT1182', 'Pimpri Chinchwad University'], ['Priya Deshmukh', 'PCU-23BT0915', 'Pimpri Chinchwad University'],
  ['Om Jadhav', 'MET-10B-031', 'MET School Nashik'], ['Isha Shinde', 'MET-09A-014', 'MET School Nashik'],
]
const CITY = { 'MBSE School': 'Mumbai, MH', 'Pimpri Chinchwad University': 'Pune, MH', 'MET School Nashik': 'Nashik, MH' }
const DENY_REASONS = ['Device limit reached', 'Screen recording detected', 'Outside allowed region', 'License expired', 'Offline grace period over', 'Tampered player']

const seed = () => {
  const p1 = DEFAULT_POLICY()
  p1.perms = { ...p1.perms, download: true }
  p1.time.offlineDays = 15

  const p2 = DEFAULT_POLICY()
  p2.device = { maxDevices: 1, concurrent: 1 }
  p2.time = { mode: 'window', days: 0, start: '2026-11-10T09:00', end: '2026-11-10T13:00', offlineDays: 0 }
  p2.geo = { restrict: true, regions: ['Maharashtra'], ipRanges: ['192.168.12.0/24'] }
  p2.perms = { ...p2.perms, annotate: false }
  p2.watermark = { ...p2.watermark, position: 'tiled', opacity: 22 }

  const p3 = DEFAULT_POLICY()
  p3.perms = { view: true, download: true, print: true, printPages: 50, copy: true, screenCapture: false, annotate: true, share: false }
  p3.device = { maxDevices: 3, concurrent: 2 }
  p3.time = { mode: 'perpetual', days: 0, start: '', end: '', offlineDays: 30 }
  p3.quality.maxRes = '1080p'
  p3.watermark = { ...p3.watermark, visible: false }

  const p4 = DEFAULT_POLICY()
  p4.time = { mode: 'rental', days: 30, start: '', end: '', offlineDays: 3 }
  p4.quality.maxRes = '480p'
  p4.watermark = { ...p4.watermark, position: 'footer' }

  const assets = [
    { id: 'as_01', title: 'Class 10 Science — Full Video Course', type: 'video', meta: '64 lectures · 31 hr', sizeMb: 4820, encryption: 'HLS AES-128 + Widevine', watermark: true, policyId: 'po_01', views: 18420, protectedAt: minsAgo(60 * 24 * 40), owner: 'ISF Studio' },
    { id: 'as_02', title: 'Class 10 Maths — Chapter-wise eBook', type: 'ebook', meta: '15 chapters', sizeMb: 212, encryption: 'AES-256-GCM (EPUB)', watermark: true, policyId: 'po_01', views: 9310, protectedAt: minsAgo(60 * 24 * 32), owner: 'ISF Studio' },
    { id: 'as_03', title: 'Board Exam Prelim Paper 2026 — Science', type: 'pdf', meta: '12 pages', sizeMb: 2.4, encryption: 'AES-256-GCM (PDF)', watermark: true, policyId: 'po_02', views: 640, protectedAt: minsAgo(60 * 24 * 2), owner: 'MBSE Exam Cell' },
    { id: 'as_04', title: 'NEET Biology Crash Course', type: 'video', meta: '82 lectures · 46 hr', sizeMb: 6110, encryption: 'HLS AES-128 + Widevine', watermark: true, policyId: 'po_04', views: 12800, protectedAt: minsAgo(60 * 24 * 21), owner: 'Partner — EduPrime' },
    { id: 'as_05', title: 'Teacher Training Handbook 2026', type: 'pdf', meta: '148 pages', sizeMb: 18, encryption: 'AES-256-GCM (PDF)', watermark: false, policyId: 'po_03', views: 1440, protectedAt: minsAgo(60 * 24 * 12), owner: 'ISF Studio' },
    { id: 'as_06', title: 'English Grammar Workbook', type: 'doc', meta: '42 pages', sizeMb: 6.8, encryption: 'AES-256-GCM (DOCX)', watermark: true, policyId: 'po_01', views: 5230, protectedAt: minsAgo(60 * 24 * 6), owner: 'ISF Studio' },
  ].map(a => ({ ...a, keyId: keyId(), keyRotatedAt: minsAgo(60 * 24 * (3 + Math.floor(Math.random() * 20))), sha256: hex(64) }))

  const licenses = [
    { id: 'li_01', key: 'DRM-MBSE-10SC-7K2Q', licensee: 'MBSE School — Class 10 (all sections)', assetId: 'as_01', policyId: 'po_01', seats: 420, used: 398, issuedAt: minsAgo(60 * 24 * 200), startsAt: minsAgo(60 * 24 * 200), expiresAt: dayIso(168), revoked: false },
    { id: 'li_02', key: 'DRM-MBSE-10MA-3MPL', licensee: 'MBSE School — Class 10 (all sections)', assetId: 'as_02', policyId: 'po_01', seats: 420, used: 377, issuedAt: minsAgo(60 * 24 * 180), startsAt: minsAgo(60 * 24 * 180), expiresAt: dayIso(168), revoked: false },
    { id: 'li_03', key: 'DRM-MBSE-PRL-Z8RT', licensee: 'MBSE School — Class 10 prelim exam', assetId: 'as_03', policyId: 'po_02', seats: 420, used: 0, issuedAt: minsAgo(60 * 24 * 2), startsAt: dayIso(26), expiresAt: dayIso(26.2), revoked: false },
    { id: 'li_04', key: 'DRM-PCU-NEET-91XA', licensee: 'Pimpri Chinchwad University — Pre-med batch', assetId: 'as_04', policyId: 'po_04', seats: 250, used: 238, issuedAt: minsAgo(60 * 24 * 150), startsAt: minsAgo(60 * 24 * 150), expiresAt: dayIso(9), revoked: false },
    { id: 'li_05', key: 'DRM-MET-10SC-44CD', licensee: 'MET School Nashik — Class 10', assetId: 'as_01', policyId: 'po_01', seats: 200, used: 197, issuedAt: minsAgo(60 * 24 * 345), startsAt: minsAgo(60 * 24 * 345), expiresAt: dayIso(20), revoked: false },
    { id: 'li_06', key: 'DRM-ISF-TTH-0007', licensee: 'ISF Analytica — Teachers', assetId: 'as_05', policyId: 'po_03', seats: 60, used: 41, issuedAt: minsAgo(60 * 24 * 90), startsAt: minsAgo(60 * 24 * 90), expiresAt: dayIso(3650), revoked: false },
    { id: 'li_07', key: 'DRM-BFC-NEET-Q1WE', licensee: 'Bright Future Coaching — NEET batch', assetId: 'as_04', policyId: 'po_04', seats: 80, used: 0, issuedAt: minsAgo(60 * 24 * 300), startsAt: minsAgo(60 * 24 * 300), expiresAt: dayIso(-45), revoked: false },
    { id: 'li_08', key: 'DRM-SRA-TRL-5521', licensee: 'Sunrise Academy — Trial', assetId: 'as_06', policyId: 'po_01', seats: 30, used: 0, issuedAt: minsAgo(60 * 24 * 40), startsAt: minsAgo(60 * 24 * 40), expiresAt: dayIso(-10), revoked: true },
  ]

  const devices = [
    ['TAB-CLS10A-007', 'Android 13', 0, 'authorized', 4], ['TAB-CLS10B-019', 'Android 13', 1, 'authorized', 6],
    ['PCU-LIB-PC-14', 'Windows 11', 2, 'authorized', 22], ['Redmi Note 12', 'Android 14', 2, 'authorized', 47],
    ['HP-Laptop-PD', 'Windows 11', 3, 'authorized', 180], ['IFP-LAB2-04', 'Android 11', 4, 'blocked', 60 * 24 * 11],
    ['Samsung Tab S6', 'Android 12', 2, 'blocked', 60 * 3], ['TAB-CLS9A-014', 'Android 13', 5, 'authorized', 15],
  ].map(([name, os, si, status, mins], i) => {
    const [user, userId, school] = STUDENTS[si]
    return {
      id: `dv_${i + 1}`, name, os, school, user, userId, fingerprint: `${hex(4)}:${hex(4)}:${hex(4)}`,
      licenses: status === 'blocked' ? 0 : 1 + (i % 3), lastSeen: minsAgo(mins), status,
      blockReason: status === 'blocked' ? (name === 'IFP-LAB2-04' ? 'Offline grace period over' : 'Device limit reached') : null,
    }
  })

  return {
    policies: [
      { id: 'po_01', name: 'Student — View & Offline', desc: 'Stream or download for 15 days offline, no copy / print', settings: p1 },
      { id: 'po_02', name: 'Exam Paper — Lab Window Only', desc: 'Opens only in the exam window, on lab network, 1 device', settings: p2 },
      { id: 'po_03', name: 'Teacher — Full Access', desc: 'Print, copy and annotate, 3 devices, no expiry', settings: p3 },
      { id: 'po_04', name: 'Partner Course — 30-day Rental', desc: '30 days from first open, 480p, footer watermark', settings: p4 },
    ],
    assets, licenses, devices,
    events: Array.from({ length: 26 }, (_, i) => makeEvent(assets, devices, 6 + i * 23 + Math.floor(Math.random() * 15))),
    traces: [],
  }
}

function makeEvent(assets, devices, mins) {
  const d = devices[Math.floor(Math.random() * devices.length)]
  const a = assets[Math.floor(Math.random() * assets.length)]
  const denied = d.status === 'blocked' || Math.random() < 0.22
  const actions = a.type === 'video' ? ['Play', 'Download for offline', 'Play'] : ['Open', 'Open', 'Print', 'Download for offline']
  const action = actions[Math.floor(Math.random() * actions.length)]
  return {
    id: uid('ev'), at: minsAgo(mins), user: d.user, userId: d.userId, school: d.school, device: d.name,
    ip: `${[49, 103, 117, 14][Math.floor(Math.random() * 4)]}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    location: CITY[d.school], asset: a.title, action,
    result: denied ? 'denied' : 'allowed',
    reason: denied ? (d.blockReason || DENY_REASONS[Math.floor(Math.random() * DENY_REASONS.length)]) : null,
  }
}

const store = createStore('easyreach_drm_store_v2', seed)
const S = () => store.get()

const licStatus = (l) => {
  if (l.revoked) return 'revoked'
  const now = Date.now()
  if (new Date(l.startsAt).getTime() > now) return 'scheduled'
  if (new Date(l.expiresAt).getTime() < now) return 'expired'
  if (new Date(l.expiresAt).getTime() - now < 14 * 86400000) return 'expiring'
  return 'active'
}
const policyName = (id) => S().policies.find(p => p.id === id)?.name || '—'
const assetTitle = (id) => S().assets.find(a => a.id === id)?.title || '—'
const shapeLicense = (l) => ({ ...clone(l), status: licStatus(l), asset: assetTitle(l.assetId), policy: policyName(l.policyId) })
const shapeAsset = (a) => ({
  ...clone(a), policy: policyName(a.policyId),
  licenses: S().licenses.filter(l => l.assetId === a.id && ['active', 'expiring', 'scheduled'].includes(licStatus(l))).length,
})
const logEvent = (action, asset, result = 'allowed', reason = null) => store.set(s => {
  s.events.unshift({ id: uid('ev'), at: new Date().toISOString(), user: currentUser(), userId: 'ADMIN', school: 'ISF Console', device: 'Admin console', ip: '—', location: '—', asset, action, result, reason })
})

/* ── Summary ── */
// GET /drm/summary
export const getDrmSummary = async () => {
  await latency()
  const s = S()
  const dayAgo = Date.now() - 86400000
  const today = s.events.filter(e => new Date(e.at).getTime() > dayAgo)
  const denied = today.filter(e => e.result === 'denied')
  const byReason = {}
  denied.forEach(e => { byReason[e.reason] = (byReason[e.reason] || 0) + 1 })
  const lic = s.licenses.map(l => ({ ...l, status: licStatus(l) }))
  const live = lic.filter(l => l.status === 'active' || l.status === 'expiring')
  return {
    assets: s.assets.length,
    storageGb: +(s.assets.reduce((t, a) => t + a.sizeMb, 0) / 1024).toFixed(1),
    activeLicenses: live.length,
    expiring: lic.filter(l => l.status === 'expiring').length,
    seatsUsed: live.reduce((t, l) => t + l.used, 0),
    devices: 1180 + s.devices.filter(d => d.status === 'authorized').length, // fleet total incl. classroom tablets
    blockedDevices: s.devices.filter(d => d.status === 'blocked').length,
    accessToday: today.length * 37,
    deniedToday: denied.length * 3,
    alerts: denied.slice(0, 6).map(e => ({ id: e.id, action: e.action, reason: e.reason, user: e.user, device: e.device, asset: e.asset, at: e.at })),
    topAssets: [...s.assets].sort((a, b) => b.views - a.views).slice(0, 5).map(a => ({ title: a.title, type: a.type, views: a.views })),
    deniedByReason: Object.entries(byReason).map(([r, n]) => [r, n * 3]).sort((a, b) => b[1] - a[1]),
  }
}

/* ── Protected content ── */
// GET /drm/assets
export const getAssets = async () => { await latency(); return S().assets.map(shapeAsset).sort((a, b) => new Date(b.protectedAt) - new Date(a.protectedAt)) }

// POST /drm/assets   (multipart → hash → encrypt → package → register key)
export const protectAsset = async (file, { title, policyId, watermark }, onStage) => {
  const isVideo = /\.(mp4|mkv|mov|webm)$/i.test(file.name)
  const type = isVideo ? 'video' : /\.epub$/i.test(file.name) ? 'ebook' : /\.docx?$/i.test(file.name) ? 'doc' : 'pdf'
  const stages = [
    ['upload', 'Uploading original to secure storage'],
    ['hash', 'Computing SHA-256 fingerprint'],
    ['encrypt', isVideo ? 'Encrypting & segmenting (HLS AES-128 + Widevine)' : 'Encrypting with AES-256-GCM'],
    ['watermark', watermark ? 'Embedding forensic watermark layer' : 'Skipping watermark'],
    ['register', 'Registering content key with license server'],
  ]
  for (let i = 0; i < stages.length; i++) {
    for (let p = 0; p < 100; p += 14 + Math.round(Math.random() * 18)) {
      onStage?.(i, Math.min(99, p), stages)
      await new Promise(r => setTimeout(r, 60 + Math.random() * 80))
    }
    onStage?.(i, 100, stages)
  }
  const sizeMb = +(file.size / 1048576).toFixed(1)
  const a = {
    id: uid('as'), title, type,
    meta: isVideo ? `${Math.max(1, Math.round(sizeMb / 9))} min` : type === 'pdf' ? `${Math.max(1, Math.round(sizeMb * 6))} pages` : file.name.split('.').pop().toUpperCase(),
    sizeMb: Math.max(0.1, sizeMb),
    encryption: isVideo ? 'HLS AES-128 + Widevine' : `AES-256-GCM (${type === 'ebook' ? 'EPUB' : type === 'doc' ? 'DOCX' : 'PDF'})`,
    watermark, policyId, views: 0, protectedAt: new Date().toISOString(), owner: 'ISF Studio',
    keyId: keyId(), keyRotatedAt: new Date().toISOString(), sha256: hex(64),
  }
  store.set(s => { s.assets.unshift(a) })
  logEvent('Protected new content', title)
  return shapeAsset(a)
}

// POST /drm/assets/{id}/rotate-key
export const rotateKey = async (id) => {
  await latency(700, 1200)
  let a
  store.set(s => { a = s.assets.find(x => x.id === id); a.keyId = keyId(); a.keyRotatedAt = new Date().toISOString() })
  logEvent('Rotated content key', a.title)
  return { keyId: a.keyId, keyRotatedAt: a.keyRotatedAt }
}

// POST /drm/assets/{id}/verify
export const verifyIntegrity = async (id) => {
  await latency(900, 1500)
  logEvent('Integrity check passed', assetTitle(id))
  return { ok: true, checkedAt: new Date().toISOString() }
}

// PATCH /drm/assets/{id}   { policy_id }
export const setAssetPolicy = async (id, policyId) => {
  await latency()
  store.set(s => { s.assets.find(a => a.id === id).policyId = policyId })
  logEvent(`Rights policy changed to "${policyName(policyId)}"`, assetTitle(id))
  return { ok: true }
}

// POST /drm/assets/{id}/revoke-all
export const revokeAsset = async (id) => {
  await latency(700, 1100)
  let n = 0
  store.set(s => { s.licenses.forEach(l => { if (l.assetId === id && !l.revoked && ['active', 'expiring', 'scheduled'].includes(licStatus(l))) { l.revoked = true; n++ } }) })
  logEvent(`Revoked ${n} license(s)`, assetTitle(id))
  return { revoked: n }
}

/* ── Rights policies ── */
// GET /drm/policies
export const getPolicies = async () => {
  await latency()
  return S().policies.map(p => ({ ...clone(p), assets: S().assets.filter(a => a.policyId === p.id).length }))
}

// POST /drm/policies  |  PUT /drm/policies/{id}
export const savePolicy = async ({ id, name, desc, settings }) => {
  await latency(500, 900)
  let p
  store.set(s => {
    if (id) { p = s.policies.find(x => x.id === id); Object.assign(p, { name, desc, settings }) }
    else { p = { id: uid('po'), name, desc, settings }; s.policies.push(p) }
  })
  logEvent(id ? 'Edited rights policy' : 'Created rights policy', name)
  return clone(p)
}

/* ── Licenses ── */
// GET /drm/licenses
export const getLicenses = async () => {
  await latency()
  const order = { expiring: 0, active: 1, scheduled: 2, expired: 3, revoked: 4 }
  return S().licenses.map(shapeLicense).sort((a, b) => order[a.status] - order[b.status] || new Date(b.issuedAt) - new Date(a.issuedAt))
}

// POST /drm/licenses
export const issueLicense = async ({ licensee, assetId, policyId, seats, days, startsAt }) => {
  await latency(700, 1100)
  const start = startsAt ? new Date(startsAt + 'T00:00:00') : new Date()
  const l = {
    id: uid('li'), key: `DRM-${hex(4).toUpperCase()}-${hex(4).toUpperCase()}-${hex(4).toUpperCase()}`, licensee, assetId, policyId,
    seats: +seats, used: 0, issuedAt: new Date().toISOString(), startsAt: start.toISOString(),
    expiresAt: new Date(start.getTime() + days * 86400000).toISOString(), revoked: false,
  }
  store.set(s => { s.licenses.unshift(l) })
  logEvent(`Issued license ${l.key} (${seats} seats)`, assetTitle(assetId))
  return shapeLicense(l)
}

// POST /drm/licenses/{id}/renew   { days }
export const renewLicense = async (id, days) => {
  await latency(600, 1000)
  let l
  store.set(s => {
    l = s.licenses.find(x => x.id === id)
    const base = Math.max(Date.now(), new Date(l.expiresAt).getTime())
    l.expiresAt = new Date(base + days * 86400000).toISOString()
  })
  logEvent(`Renewed license +${days} days`, l.licensee)
  return shapeLicense(l)
}

// POST /drm/licenses/{id}/revoke
export const revokeLicense = async (id) => {
  await latency(600, 1000)
  let l
  store.set(s => { l = s.licenses.find(x => x.id === id); l.revoked = true })
  logEvent(`Revoked license ${l.key}`, l.licensee)
  return shapeLicense(l)
}

// POST /drm/licenses/{id}/seats   { add }
export const addSeats = async (id, n) => {
  await latency(500, 900)
  let l
  store.set(s => { l = s.licenses.find(x => x.id === id); l.seats += n })
  logEvent(`Added ${n} seats`, l.licensee)
  return shapeLicense(l)
}

/* ── Devices ── */
// GET /drm/devices
export const getDevices = async () => { await latency(); return clone(S().devices).sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)) }

// PATCH /drm/devices/{id}   { status: 'authorized' | 'blocked' }
export const setDeviceStatus = async (id, status) => {
  await latency(500, 900)
  let d
  store.set(s => {
    d = s.devices.find(x => x.id === id)
    d.status = status
    d.blockReason = status === 'blocked' ? `Deauthorized by ${currentUser()}` : null
    d.licenses = status === 'blocked' ? 0 : Math.max(1, d.licenses)
  })
  logEvent(status === 'blocked' ? `Deauthorized device ${d.name}` : `Authorized device ${d.name}`, d.user)
  return clone(d)
}

/* ── Audit log (live) ── */
// GET /drm/events
export const getEvents = async () => {
  await latency(250, 500)
  if (Math.random() < 0.6) store.set(s => { s.events.unshift(makeEvent(s.assets, s.devices, 0)); s.events = s.events.slice(0, 200) })
  return clone(S().events).sort((a, b) => new Date(b.at) - new Date(a.at))
}

// GET /drm/events/export
export const exportEvents = async (rows) => {
  await latency(400, 700)
  return toCsvBlob(['Time', 'User', 'User ID', 'Institution', 'Device', 'IP', 'Location', 'Content', 'Action', 'Result', 'Reason'],
    rows.map(r => [new Date(r.at).toLocaleString('en-IN'), r.user, r.userId, r.school, r.device, r.ip, r.location, r.asset, r.action, r.result, r.reason || '']))
}

/* ── Forensic leak tracing ── */
// POST /drm/forensics/trace   (multipart)
export const traceLeak = async (file, onStage) => {
  const stages = ['Normalising image / frames', 'Detecting forensic watermark', 'Decoding payload', 'Matching license & device record']
  for (let i = 0; i < stages.length; i++) {
    for (let p = 0; p < 100; p += 12 + Math.round(Math.random() * 16)) {
      onStage?.(i, Math.min(99, p), stages)
      await new Promise(r => setTimeout(r, 70 + Math.random() * 90))
    }
    onStage?.(i, 100, stages)
  }
  const s = S()
  const d = s.devices.find(x => x.status === 'authorized' && x.name === 'Redmi Note 12') || s.devices[0]
  const a = s.assets.find(x => x.id === 'as_04') || s.assets[0]
  const l = s.licenses.find(x => x.assetId === a.id) || s.licenses[0]
  const r = {
    id: uid('tr'), fileName: file.name, confidence: +(94 + Math.random() * 5).toFixed(1),
    user: d.user, userId: d.userId, school: d.school, device: d.name, fingerprint: d.fingerprint,
    asset: a.title, openedAt: minsAgo(60 * 24 * 2 + 37), ip: '103.21.58.14', licensee: l.licensee,
    payload: `wm1:${d.userId}:${d.fingerprint.replace(/:/g, '')}:${hex(8)}`, tracedAt: new Date().toISOString(),
  }
  store.set(st => { st.traces.unshift(r) })
  logEvent(`Leaked copy "${file.name}" traced to ${r.user}`, a.title, 'denied', 'Forensic match')
  return clone(r)
}

// GET /drm/forensics/traces
export const getTraces = async () => { await latency(200, 400); return clone(S().traces) }
