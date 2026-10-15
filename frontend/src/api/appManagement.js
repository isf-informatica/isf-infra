import { getAllSchools } from './schools'

/* ─────────────────────────────────────────────────────────────────────────────
   App Management API layer.

   ⚠️ DEMO MODE — backend endpoints for App Management do not exist yet.
   Every function below has the same signature a real axios call would have
   (async, returns `res.data` shape). When the backend is ready, replace the
   body of each function with the commented `api.*` call above it — the page
   (AppManagementView.jsx) does not need any change.

   State is persisted in localStorage so actions (block app, push APK, add
   rule) survive page refresh during a demo.
   ───────────────────────────────────────────────────────────────────────────── */

const STORE_KEY = 'easyreach_appmgmt_store_v1'
const latency = (min = 350, max = 900) => new Promise(r => setTimeout(r, min + Math.random() * (max - min)))
const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const FALLBACK_SCHOOLS = [
  { id: 1, name: 'MBSE School' },
  { id: 2, name: 'Pimpri Chinchwad University' },
  { id: 3, name: 'MET School Nashik' },
]

const SEED_APPS = [
  { id: 'app_01', name: 'EasyLearn Classroom', pkg: 'com.isfinformatica.easylearnv2', publisher: 'ISF Analytica', version: '2.4.1', platform: 'android', category: 'Education', installs: 412, status: 'allowed', managed: true, sizeMb: 38.2 },
  { id: 'app_02', name: 'EasyLearn TV', pkg: 'in.athenastar.app', publisher: 'ISF Analytica', version: '1.9.0', platform: 'android', category: 'Education', installs: 186, status: 'allowed', managed: true, sizeMb: 52.7 },
  { id: 'app_03', name: 'Google Chrome', pkg: 'chrome.exe', publisher: 'Google LLC', version: '129.0.6668', platform: 'windows', category: 'Browser', installs: 298, status: 'allowed', managed: false, sizeMb: 112.4 },
  { id: 'app_04', name: 'Microsoft Office 2021', pkg: 'WINWORD.EXE', publisher: 'Microsoft', version: '16.0.14332', platform: 'windows', category: 'Productivity', installs: 241, status: 'allowed', managed: false, sizeMb: 2840 },
  { id: 'app_05', name: 'GeoGebra Classic', pkg: 'org.geogebra.android', publisher: 'GeoGebra', version: '5.2.851', platform: 'android', category: 'Education', installs: 133, status: 'allowed', managed: true, sizeMb: 24.9 },
  { id: 'app_06', name: 'VLC Media Player', pkg: 'vlc.exe', publisher: 'VideoLAN', version: '3.0.21', platform: 'windows', category: 'Media', installs: 207, status: 'allowed', managed: false, sizeMb: 42.0 },
  { id: 'app_07', name: 'Instagram', pkg: 'com.instagram.android', publisher: 'Meta Platforms', version: '348.0.0', platform: 'android', category: 'Social', installs: 14, status: 'blocked', managed: false, sizeMb: 68.3 },
  { id: 'app_08', name: 'Free Fire', pkg: 'com.dts.freefireth', publisher: 'Garena', version: '1.104.1', platform: 'android', category: 'Games', installs: 9, status: 'blocked', managed: false, sizeMb: 512.0 },
  { id: 'app_09', name: 'uTorrent', pkg: 'uTorrent.exe', publisher: 'BitTorrent Inc.', version: '3.6.0', platform: 'windows', category: 'Utilities', installs: 6, status: 'blocked', managed: false, sizeMb: 4.1 },
  { id: 'app_10', name: 'AnyDesk', pkg: 'AnyDesk.exe', publisher: 'AnyDesk Software', version: '8.0.14', platform: 'windows', category: 'Remote Access', installs: 23, status: 'review', managed: false, sizeMb: 5.6 },
  { id: 'app_11', name: 'YouTube', pkg: 'com.google.android.youtube', publisher: 'Google LLC', version: '19.38.41', platform: 'android', category: 'Media', installs: 157, status: 'review', managed: false, sizeMb: 146.0 },
  { id: 'app_12', name: 'Zoom Workplace', pkg: 'Zoom.exe', publisher: 'Zoom Video Communications', version: '6.2.5', platform: 'windows', category: 'Communication', installs: 88, status: 'allowed', managed: false, sizeMb: 98.6 },
  { id: 'app_13', name: 'WhatsApp', pkg: 'com.whatsapp', publisher: 'WhatsApp LLC', version: '2.24.20', platform: 'android', category: 'Social', installs: 31, status: 'review', managed: false, sizeMb: 61.2 },
  { id: 'app_14', name: 'Scratch 3', pkg: 'Scratch 3.exe', publisher: 'MIT Media Lab', version: '3.29.1', platform: 'windows', category: 'Education', installs: 64, status: 'allowed', managed: true, sizeMb: 210.0 },
  { id: 'app_15', name: 'PUBG Mobile', pkg: 'com.tencent.ig', publisher: 'Level Infinite', version: '3.4.0', platform: 'android', category: 'Games', installs: 4, status: 'blocked', managed: false, sizeMb: 980.0 },
  { id: 'app_16', name: 'Kiwix (Offline Wiki)', pkg: 'org.kiwix.kiwixmobile', publisher: 'Kiwix', version: '3.11.1', platform: 'android', category: 'Education', installs: 72, status: 'allowed', managed: true, sizeMb: 19.4 },
]

const SEED_RULES = [
  { id: 'rule_01', type: 'blacklist', match: 'com.instagram.android', label: 'Instagram', scope: 'All institutions', action: 'block_and_uninstall', createdBy: 'Yash', createdAt: '2026-10-02T10:12:00' },
  { id: 'rule_02', type: 'blacklist', match: 'com.dts.freefireth', label: 'Free Fire', scope: 'All institutions', action: 'block_and_uninstall', createdBy: 'Yash', createdAt: '2026-10-02T10:14:00' },
  { id: 'rule_03', type: 'blacklist', match: 'uTorrent.exe', label: 'uTorrent', scope: 'All institutions', action: 'block_launch', createdBy: 'Shyam', createdAt: '2026-10-05T16:40:00' },
  { id: 'rule_04', type: 'blacklist', match: 'com.tencent.ig', label: 'PUBG Mobile', scope: 'All institutions', action: 'block_and_uninstall', createdBy: 'Yash', createdAt: '2026-10-07T09:02:00' },
  { id: 'rule_05', type: 'whitelist', match: 'com.isfinformatica.*', label: 'All ISF / EasyLearn apps', scope: 'All institutions', action: 'always_allow', createdBy: 'Yash', createdAt: '2026-09-28T12:00:00' },
  { id: 'rule_06', type: 'whitelist', match: 'org.geogebra.android', label: 'GeoGebra Classic', scope: 'MBSE School', action: 'always_allow', createdBy: 'Shyam', createdAt: '2026-10-01T11:30:00' },
]

const minsAgo = (m) => new Date(Date.now() - m * 60000).toISOString()

const seedViolations = () => ([
  { id: 'v_01', app: 'Free Fire', pkg: 'com.dts.freefireth', device: 'TAB-CLS8B-014', school: 'MBSE School', at: minsAgo(6), action: 'Uninstalled', offHours: false },
  { id: 'v_02', app: 'uTorrent', pkg: 'uTorrent.exe', device: 'IOE-TNPLAB', school: 'Pimpri Chinchwad University', at: minsAgo(23), action: 'Launch blocked', offHours: false },
  { id: 'v_03', app: 'Instagram', pkg: 'com.instagram.android', device: 'TAB-CLS10A-007', school: 'MBSE School', at: minsAgo(48), action: 'Uninstalled', offHours: false },
  { id: 'v_04', app: 'PUBG Mobile', pkg: 'com.tencent.ig', device: 'IFP-LAB2-02', school: 'MET School Nashik', at: minsAgo(131), action: 'Install blocked', offHours: true },
  { id: 'v_05', app: 'Instagram', pkg: 'com.instagram.android', device: 'TAB-CLS9C-021', school: 'MET School Nashik', at: minsAgo(260), action: 'Uninstalled', offHours: true },
])

const seedDeployments = () => ([
  {
    id: 'dep_01', app: 'EasyLearn Classroom', version: '2.4.1', file: 'easylearn_v2.4.1_release.apk', platform: 'android',
    target: 'All institutions', total: 412, installed: 409, failed: 3, pending: 0, status: 'completed',
    silent: true, autoLaunch: false, startedAt: minsAgo(60 * 26), createdBy: 'Yash',
  },
  {
    id: 'dep_02', app: 'Scratch 3', version: '3.29.1', file: 'Scratch_3.29.1_Setup.exe', platform: 'windows',
    target: 'Pimpri Chinchwad University', total: 64, installed: 64, failed: 0, pending: 0, status: 'completed',
    silent: true, autoLaunch: false, startedAt: minsAgo(60 * 50), createdBy: 'Shyam',
  },
])

const loadStore = () => {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    apps: SEED_APPS,
    rules: SEED_RULES,
    violations: seedViolations(),
    deployments: seedDeployments(),
    mode: 'blacklist',
    lastSync: new Date().toISOString(),
  }
}
let store = loadStore()
const persist = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)) } catch {} }
const clone = (x) => JSON.parse(JSON.stringify(x))

/* ── Institutions — this one IS a real backend call (falls back if offline) ── */
// GET /easyreach/schools/
export const getInstitutions = async () => {
  try {
    const data = await getAllSchools()
    if (Array.isArray(data) && data.length) return data.map(s => ({ id: s.id, name: s.name }))
  } catch {}
  return FALLBACK_SCHOOLS
}

/* ── Overview ── */
// GET /easyreach/mdm/apps/summary
export const getAppSummary = async () => {
  await latency()
  const apps = store.apps
  const dayAgo = Date.now() - 24 * 3600 * 1000
  return {
    totalApps: apps.length,
    totalInstalls: apps.reduce((s, a) => s + a.installs, 0),
    managedApps: apps.filter(a => a.managed).length,
    blocked: apps.filter(a => a.status === 'blocked').length,
    pendingReview: apps.filter(a => a.status === 'review').length,
    violations24h: store.violations.filter(v => new Date(v.at).getTime() > dayAgo).length,
    activeDeployments: store.deployments.filter(d => d.status === 'running').length,
    mode: store.mode,
    lastSync: store.lastSync,
  }
}

/* ── Inventory ── */
// GET /easyreach/mdm/apps?platform=&status=&q=
export const getAppInventory = async () => {
  await latency()
  return clone(store.apps)
}

// POST /easyreach/mdm/apps/sync   → asks every agent to re-report installed apps
export const syncInventory = async () => {
  await latency(1400, 2200)
  store.apps = store.apps.map(a => ({ ...a, installs: Math.max(0, a.installs + Math.round((Math.random() - 0.4) * 3)) }))
  store.lastSync = new Date().toISOString()
  persist()
  return { ok: true, devicesReported: 437 + Math.round(Math.random() * 8), lastSync: store.lastSync }
}

// PATCH /easyreach/mdm/apps/{id}/status   { status: 'allowed' | 'blocked' | 'review' }
export const setAppStatus = async (appId, status) => {
  await latency()
  const app = store.apps.find(a => a.id === appId)
  if (!app) throw new Error('App not found')
  app.status = status
  if (status === 'blocked' && !store.rules.some(r => r.match === app.pkg && r.type === 'blacklist')) {
    store.rules.unshift({ id: uid('rule'), type: 'blacklist', match: app.pkg, label: app.name, scope: 'All institutions', action: 'block_and_uninstall', createdBy: currentUser(), createdAt: new Date().toISOString() })
  }
  if (status !== 'blocked') store.rules = store.rules.filter(r => !(r.type === 'blacklist' && r.match === app.pkg))
  persist()
  return { ok: true, app: clone(app), commandQueuedFor: app.installs }
}

/* ── Blacklist / Whitelist rules ── */
// GET /easyreach/mdm/app-rules
export const getAppRules = async () => {
  await latency()
  return { mode: store.mode, rules: clone(store.rules) }
}

// PUT /easyreach/mdm/app-rules/mode   { mode: 'blacklist' | 'whitelist' }
export const setEnforcementMode = async (mode) => {
  await latency(600, 1100)
  store.mode = mode
  persist()
  return { ok: true, mode }
}

// POST /easyreach/mdm/app-rules
export const createAppRule = async (rule) => {
  await latency()
  const r = { id: uid('rule'), createdBy: currentUser(), createdAt: new Date().toISOString(), ...rule }
  store.rules.unshift(r)
  const app = store.apps.find(a => a.pkg === rule.match)
  if (app) app.status = rule.type === 'blacklist' ? 'blocked' : 'allowed'
  persist()
  return clone(r)
}

// DELETE /easyreach/mdm/app-rules/{id}
export const deleteAppRule = async (ruleId) => {
  await latency()
  const rule = store.rules.find(r => r.id === ruleId)
  store.rules = store.rules.filter(r => r.id !== ruleId)
  if (rule) {
    const app = store.apps.find(a => a.pkg === rule.match)
    if (app && rule.type === 'blacklist') app.status = 'review'
  }
  persist()
  return { ok: true }
}

/* ── Violations / alerts ── */
// GET /easyreach/mdm/app-violations?limit=20
export const getViolations = async () => {
  await latency()
  return clone(store.violations).sort((a, b) => new Date(b.at) - new Date(a.at))
}

/* ── Push / deploy custom apps ── */
// GET /easyreach/mdm/app-deployments
export const getDeployments = async () => {
  await latency(200, 400)
  tickDeployments()
  return clone(store.deployments).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
}

// POST /easyreach/mdm/app-packages   (multipart upload)   onProgress(0..100)
export const uploadPackage = async (file, onProgress) => {
  const steps = 18
  for (let i = 1; i <= steps; i++) {
    await new Promise(r => setTimeout(r, 70 + Math.random() * 90))
    onProgress?.(Math.round((i / steps) * 100))
  }
  await latency(300, 600)
  const isApk = /\.apk$/i.test(file.name)
  const base = file.name.replace(/\.(apk|exe|msi|appx)$/i, '')
  const verMatch = base.match(/(\d+\.\d+(\.\d+)?)/)
  return {
    packageId: uid('pkg'),
    fileName: file.name,
    sizeMb: +(file.size / (1024 * 1024)).toFixed(1),
    platform: isApk ? 'android' : 'windows',
    detectedName: prettify(base.replace(/[_-]?v?\d+(\.\d+)+.*$/i, '')) || 'Custom App',
    detectedVersion: verMatch ? verMatch[1] : '1.0.0',
    detectedPkg: isApk ? `com.custom.${base.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18) || 'app'}` : file.name,
    sha256: Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
    signature: isApk ? 'Verified (v2 scheme)' : 'Authenticode — not signed',
  }
}

// POST /easyreach/mdm/app-deployments
export const createDeployment = async (payload) => {
  await latency(700, 1200)
  const total = payload.deviceCount
  const dep = {
    id: uid('dep'),
    app: payload.name, version: payload.version, file: payload.fileName, platform: payload.platform,
    target: payload.targetLabel, total, installed: 0, failed: 0, pending: total, status: 'running',
    silent: payload.silent, autoLaunch: payload.autoLaunch, config: payload.config,
    startedAt: new Date().toISOString(), createdBy: currentUser(),
  }
  store.deployments.unshift(dep)
  if (!store.apps.some(a => a.pkg === payload.pkg)) {
    store.apps.unshift({
      id: uid('app'), name: payload.name, pkg: payload.pkg, publisher: 'Custom (uploaded)', version: payload.version,
      platform: payload.platform, category: 'Custom', installs: 0, status: 'allowed', managed: true, sizeMb: payload.sizeMb,
    })
  }
  persist()
  return clone(dep)
}

// POST /easyreach/mdm/app-deployments/{id}/retry
export const retryDeployment = async (depId) => {
  await latency()
  const d = store.deployments.find(x => x.id === depId)
  if (d && d.failed > 0) { d.pending += d.failed; d.failed = 0; d.status = 'running' }
  persist()
  return clone(d)
}

/* Simulates agents reporting install results over time. */
function tickDeployments() {
  let changed = false
  store.deployments.forEach(d => {
    if (d.status !== 'running') return
    const elapsed = (Date.now() - new Date(d.startedAt).getTime()) / 1000
    const batch = Math.max(1, Math.ceil(d.total * (0.05 + Math.random() * 0.09)))
    const n = Math.min(d.pending, elapsed < 2 ? 0 : batch)
    const fails = Math.random() < 0.18 && n > 2 ? 1 : 0
    d.installed += n - fails
    d.failed += fails
    d.pending -= n
    if (d.pending <= 0) {
      d.status = 'completed'
      const app = store.apps.find(a => a.name === d.app)
      if (app) app.installs = Math.max(app.installs, d.installed)
    }
    changed = true
  })
  if (changed) persist()
}

/* ── Usage analytics ── */
// GET /easyreach/mdm/app-usage?period=daily|monthly|yearly&school_id=
export const getAppUsage = async (period = 'daily', schoolId = 'all') => {
  await latency()
  const mult = period === 'daily' ? 1 : period === 'monthly' ? 24 : 290
  const scale = schoolId === 'all' ? 1 : 0.28 + (String(schoolId).length % 3) * 0.11
  const base = [
    ['EasyLearn Classroom', 5.8, 0.3], ['Microsoft Office 2021', 3.6, 0.2], ['Google Chrome', 3.1, 0.9],
    ['EasyLearn TV', 2.7, 0.1], ['GeoGebra Classic', 1.6, 0.05], ['YouTube', 1.2, 1.1],
    ['Zoom Workplace', 1.0, 0.1], ['Scratch 3', 0.8, 0.02], ['VLC Media Player', 0.5, 0.4], ['WhatsApp', 0.3, 0.6],
  ]
  return base.map(([name, work, off]) => {
    const jitter = 0.9 + Math.random() * 0.2
    const app = store.apps.find(a => a.name === name)
    return {
      name,
      platform: app?.platform || 'android',
      workingHrs: +(work * 100 * mult * scale * jitter).toFixed(0),
      offHrs: +(off * 100 * mult * scale * jitter).toFixed(0),
      devices: Math.round((app?.installs || 50) * scale),
    }
  }).sort((a, b) => (b.workingHrs + b.offHrs) - (a.workingHrs + a.offHrs))
}

// GET /easyreach/mdm/app-usage/export?format=xlsx   (returns blob)
export const exportUsageReport = async (rows, period) => {
  await latency(500, 900)
  const header = ['App', 'Platform', 'Devices', 'Working hours (hrs)', 'Non-working hours (hrs)', 'Total (hrs)', 'Off-hours %']
  const lines = rows.map(r => {
    const t = r.workingHrs + r.offHrs
    return [r.name, r.platform, r.devices, r.workingHrs, r.offHrs, t, t ? ((r.offHrs / t) * 100).toFixed(1) : 0]
  })
  const csv = [header, ...lines].map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  return new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
}

/* helpers */
function prettify(s) {
  return s.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase())
}
function currentUser() {
  try { return JSON.parse(localStorage.getItem('user'))?.name || 'Admin' } catch { return 'Admin' }
}
