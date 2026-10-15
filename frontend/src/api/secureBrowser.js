import { latency, uid, minsAgo, clone, currentUser, createStore, tickRollouts, toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Secure Browser API layer.

   ⚠️ DEMO MODE — backend endpoints do not exist yet. Replace each function body
   with the commented `api.*` call above it when the backend is ready; the page
   (SecureBrowserView.jsx) does not need any change.
   Reset demo data: localStorage.removeItem('easyreach_browser_store_v1')
   ───────────────────────────────────────────────────────────────────────────── */

export const CATEGORIES = [
  { key: 'adult', label: 'Adult content', icon: 'ti-eye-off', sites: 48210, locked: true },
  { key: 'gambling', label: 'Gambling & betting', icon: 'ti-cards', sites: 9120 },
  { key: 'social', label: 'Social media', icon: 'ti-brand-instagram', sites: 1840 },
  { key: 'gaming', label: 'Online games', icon: 'ti-device-gamepad-2', sites: 12450 },
  { key: 'streaming', label: 'Video streaming & OTT', icon: 'ti-movie', sites: 2310 },
  { key: 'chat', label: 'Chat & messaging', icon: 'ti-message-circle', sites: 960 },
  { key: 'proxy', label: 'Proxy & VPN', icon: 'ti-shield-x', sites: 6720 },
  { key: 'piracy', label: 'Piracy & torrents', icon: 'ti-download-off', sites: 15400 },
  { key: 'shopping', label: 'Shopping', icon: 'ti-shopping-cart', sites: 4200 },
  { key: 'dating', label: 'Dating', icon: 'ti-heart', sites: 2880 },
]

const SCHOOLS = ['MBSE School', 'Pimpri Chinchwad University', 'MET School Nashik']
const SAMPLE_HITS = [
  ['instagram.com', 'social'], ['www.youtube.com/shorts', 'streaming'], ['poki.com', 'gaming'], ['web.whatsapp.com', 'chat'],
  ['1337x.to', 'piracy'], ['hotstar.com', 'streaming'], ['crazygames.com', 'gaming'], ['facebook.com', 'social'],
  ['proxysite.com', 'proxy'], ['dream11.com', 'gambling'], ['amazon.in', 'shopping'], ['snapchat.com', 'social'],
  ['torrent free movies', 'keyword'], ['free fire diamond hack', 'keyword'],
]
const randomDevice = () => {
  const cls = ['8A', '8B', '9A', '9C', '10A', '10B', '10C'][Math.floor(Math.random() * 7)]
  return Math.random() < 0.2 ? `IFP-LAB${1 + Math.floor(Math.random() * 3)}-0${1 + Math.floor(Math.random() * 6)}` : `TAB-CLS${cls}-0${10 + Math.floor(Math.random() * 30)}`
}
const makeHit = (mins) => {
  const [url, category] = SAMPLE_HITS[Math.floor(Math.random() * SAMPLE_HITS.length)]
  const at = minsAgo(mins)
  const h = new Date(at).getHours()
  return { id: uid('hit'), url, category, device: randomDevice(), school: SCHOOLS[Math.floor(Math.random() * 3)], at, offHours: h < 8 || h >= 17, action: 'Blocked' }
}

const seed = () => ({
  config: {
    mode: 'filter',
    categories: { adult: true, gambling: true, social: true, gaming: true, streaming: false, chat: true, proxy: true, piracy: true, shopping: false, dating: true },
    safeSearch: true, youtubeRestricted: true, incognito: false, downloads: false, printing: true,
    clearOnExit: true, homepage: 'https://easylearn.org.in', kiosk: false, kioskUrl: '',
    version: 5, pendingPush: false, updatedAt: minsAgo(60 * 28),
  },
  rules: [
    { id: 'r_01', type: 'allow', domain: 'easylearn.org.in', scope: 'All institutions', note: 'ISF learning portal', hits: 18420, createdBy: 'Yash', createdAt: minsAgo(60 * 24 * 20) },
    { id: 'r_02', type: 'allow', domain: 'ncert.nic.in', scope: 'All institutions', note: 'Textbooks', hits: 6210, createdBy: 'Yash', createdAt: minsAgo(60 * 24 * 20) },
    { id: 'r_03', type: 'allow', domain: 'diksha.gov.in', scope: 'All institutions', note: 'Govt. e-learning', hits: 4870, createdBy: 'Shyam', createdAt: minsAgo(60 * 24 * 18) },
    { id: 'r_04', type: 'allow', domain: 'en.wikipedia.org', scope: 'All institutions', note: '', hits: 3102, createdBy: 'Shyam', createdAt: minsAgo(60 * 24 * 15) },
    { id: 'r_05', type: 'block', domain: 'chat.openai.com', scope: 'MBSE School', note: 'Blocked during exams', hits: 212, createdBy: 'Yash', createdAt: minsAgo(60 * 24 * 6) },
    { id: 'r_06', type: 'block', domain: 'brainly.in', scope: 'All institutions', note: 'Homework answers', hits: 534, createdBy: 'Shyam', createdAt: minsAgo(60 * 24 * 4) },
    { id: 'r_07', type: 'block', domain: 'telegram.org', scope: 'All institutions', note: '', hits: 97, createdBy: 'Yash', createdAt: minsAgo(60 * 24 * 2) },
  ],
  keywords: ['torrent', 'free fire hack', 'pubg uc', 'bet', 'casino', 'proxy', 'unblock'],
  activity: [5, 11, 19, 26, 34, 41, 58, 73, 96, 120, 155, 190, 240, 300, 380, 470, 610, 790].map(makeHit),
  rollout: { id: 'bro_01', total: 412, done: 410, failed: 2, pending: 0, status: 'completed', startedAt: minsAgo(60 * 28), target: 'All institutions', by: 'Yash' },
})

const store = createStore('easyreach_browser_store_v1', seed)
const S = () => store.get()
// Only show hits that the current policy actually blocks
const isBlocked = (a) => S().config.mode === 'allowlist' || a.category === 'keyword' || !!S().config.categories[a.category]
const visibleActivity = () => S().activity.filter(isBlocked)
const markDirty = (s) => { s.config.pendingPush = true; s.config.updatedAt = new Date().toISOString() }

// GET /easyreach/mdm/browser/summary
export const getBrowserSummary = async () => {
  await latency()
  const dayAgo = Date.now() - 24 * 3600 * 1000
  const today = visibleActivity().filter(a => new Date(a.at).getTime() > dayAgo)
  const byDomain = {}
  today.forEach(a => { byDomain[a.url] = (byDomain[a.url] || 0) + 1 })
  const byCat = {}
  today.forEach(a => { byCat[a.category] = (byCat[a.category] || 0) + 1 })
  return {
    blockedToday: today.length * 17 + 23, // agents batch-report; scaled to fleet
    offHours: today.filter(a => a.offHours).length * 17,
    devices: S().rollout?.done || 0,
    categoriesOn: Object.values(S().config.categories).filter(Boolean).length,
    mode: S().config.mode,
    version: S().config.version,
    pendingPush: S().config.pendingPush,
    topDomains: Object.entries(byDomain).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([d, n]) => ({ domain: d, count: n * 17 })),
    byCategory: Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, n]) => ({ category: c, count: n * 17 })),
    running: S().rollout?.status === 'running',
  }
}

// GET /easyreach/mdm/browser/config
export const getConfig = async () => { await latency(); return clone(S().config) }

// PATCH /easyreach/mdm/browser/config
export const updateConfig = async (patch) => {
  await latency(250, 500)
  store.set(s => { Object.assign(s.config, patch); markDirty(s) })
  return clone(S().config)
}
export const setCategory = async (key, on) => {
  await latency(250, 500)
  store.set(s => { s.config.categories[key] = on; markDirty(s) })
  return clone(S().config)
}

// POST /easyreach/mdm/browser/push   { institution_ids: [] }
export const pushConfig = async ({ targetLabel, deviceCount }) => {
  await latency(700, 1100)
  store.set(s => {
    s.config.version += 1
    s.config.pendingPush = false
    s.rollout = { id: uid('bro'), total: deviceCount, done: 0, failed: 0, pending: deviceCount, status: 'running', startedAt: new Date().toISOString(), target: targetLabel, by: currentUser() }
  })
  return { config: clone(S().config), rollout: clone(S().rollout) }
}

// GET /easyreach/mdm/browser/push-status
export const getRollout = async () => {
  await latency(200, 400)
  store.set(s => { if (s.rollout) tickRollouts([s.rollout]) })
  return clone(S().rollout)
}

// GET /easyreach/mdm/browser/rules
export const getRules = async () => { await latency(); return { rules: clone(S().rules), keywords: clone(S().keywords) } }

// POST /easyreach/mdm/browser/rules
export const addRule = async ({ type, domain, scope, note }) => {
  await latency()
  const clean = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
  const r = { id: uid('r'), type, domain: clean, scope, note, hits: 0, createdBy: currentUser(), createdAt: new Date().toISOString() }
  store.set(s => { s.rules.unshift(r); markDirty(s) })
  return clone(r)
}

// DELETE /easyreach/mdm/browser/rules/{id}
export const deleteRule = async (id) => { await latency(); store.set(s => { s.rules = s.rules.filter(r => r.id !== id); markDirty(s) }); return { ok: true } }

// PUT /easyreach/mdm/browser/keywords
export const setKeywords = async (keywords) => { await latency(250, 500); store.set(s => { s.keywords = keywords; markDirty(s) }); return clone(keywords) }

// GET /easyreach/mdm/browser/activity
export const getActivity = async () => {
  await latency(250, 500)
  // new blocked attempts keep arriving from agents
  if (Math.random() < 0.55) {
    let hit = makeHit(0)
    for (let i = 0; i < 6 && !isBlocked(hit); i++) hit = makeHit(0)
    if (isBlocked(hit)) store.set(s => { s.activity.unshift(hit); s.activity = s.activity.slice(0, 120) })
  }
  return clone(visibleActivity())
}

// GET /easyreach/mdm/browser/activity/export
export const exportActivity = async (rows) => {
  await latency(400, 700)
  return toCsvBlob(['Time', 'URL / search', 'Category', 'Device', 'Institution', 'Off-hours', 'Action'],
    rows.map(a => [new Date(a.at).toLocaleString('en-IN'), a.url, a.category, a.device, a.school, a.offHours ? 'Yes' : 'No', a.action]))
}
