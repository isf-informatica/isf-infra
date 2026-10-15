import { latency, uid, minsAgo, clone, currentUser, createStore, tickRollouts, toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Content Publishing API layer.

   ⚠️ DEMO MODE — backend endpoints do not exist yet. Replace each function body
   with the commented `api.*` call above it when the backend is ready; the page
   (ContentPublishingView.jsx) does not need any change.
   Reset demo data: localStorage.removeItem('easyreach_content_store_v1')
   ───────────────────────────────────────────────────────────────────────────── */

export const FOLDERS = ['Class 8', 'Class 9', 'Class 10', 'Teachers', 'Notices']

const seed = () => ({
  library: [
    { id: 'ct_01', title: 'Science — Chapter 4: Carbon and its Compounds', type: 'pdf', sizeMb: 6.4, meta: '38 pages', folder: 'Class 10', uploadedAt: minsAgo(60 * 20), uploadedBy: 'Yash', published: 2 },
    { id: 'ct_02', title: 'Maths — Quadratic Equations (Video Lecture)', type: 'video', sizeMb: 212.0, meta: '24:16 min', folder: 'Class 10', uploadedAt: minsAgo(60 * 26), uploadedBy: 'Shyam', published: 1 },
    { id: 'ct_03', title: 'Annual Exam Timetable 2026-27', type: 'pdf', sizeMb: 0.4, meta: '2 pages', folder: 'Notices', uploadedAt: minsAgo(60 * 4), uploadedBy: 'Yash', published: 1 },
    { id: 'ct_04', title: 'English Grammar Worksheet — Tenses', type: 'doc', sizeMb: 1.1, meta: '6 pages', folder: 'Class 8', uploadedAt: minsAgo(60 * 50), uploadedBy: 'Shyam', published: 0 },
    { id: 'ct_05', title: 'Physics Lab Safety Rules', type: 'ppt', sizeMb: 8.9, meta: '14 slides', folder: 'Class 9', uploadedAt: minsAgo(60 * 70), uploadedBy: 'Yash', published: 1 },
    { id: 'ct_06', title: 'Teacher Training — Using Interactive Panels', type: 'video', sizeMb: 486.5, meta: '41:02 min', folder: 'Teachers', uploadedAt: minsAgo(60 * 96), uploadedBy: 'Yash', published: 1 },
    { id: 'ct_07', title: 'Map of India — Political (HD)', type: 'image', sizeMb: 3.2, meta: '4000×4800 px', folder: 'Class 9', uploadedAt: minsAgo(60 * 120), uploadedBy: 'Shyam', published: 0 },
    { id: 'ct_08', title: 'Biology — Life Processes Animation', type: 'video', sizeMb: 98.3, meta: '08:45 min', folder: 'Class 10', uploadedAt: minsAgo(60 * 140), uploadedBy: 'Yash', published: 1 },
  ],
  publications: [
    { id: 'pub_01', titles: ['Annual Exam Timetable 2026-27'], contentIds: ['ct_03'], target: 'All institutions', total: 412, done: 409, failed: 3, pending: 0, opened: 356, status: 'completed', offline: true, mandatory: true, expiresAt: null, startedAt: minsAgo(60 * 4), by: 'Yash' },
    { id: 'pub_02', titles: ['Science — Chapter 4: Carbon and its Compounds', 'Biology — Life Processes Animation'], contentIds: ['ct_01', 'ct_08'], target: 'MBSE School', total: 186, done: 186, failed: 0, pending: 0, opened: 171, status: 'completed', offline: true, mandatory: false, expiresAt: null, startedAt: minsAgo(60 * 20), by: 'Yash' },
    { id: 'pub_03', titles: ['Teacher Training — Using Interactive Panels'], contentIds: ['ct_06'], target: 'Pimpri Chinchwad University +1', total: 58, done: 55, failed: 3, pending: 0, opened: 38, status: 'completed', offline: false, mandatory: false, expiresAt: '2026-11-30', startedAt: minsAgo(60 * 96), by: 'Shyam' },
  ],
  branding: {
    logo: { name: 'isf_boot_logo.png', sizeKb: 84, updatedAt: minsAgo(60 * 24 * 12) },
    animation: { name: 'isf_bootanimation.zip', sizeKb: 2310, updatedAt: minsAgo(60 * 24 * 12) },
    wallpaper: { name: 'classroom_wallpaper_2026.jpg', sizeKb: 640, updatedAt: minsAgo(60 * 24 * 3) },
    rollout: { id: 'br_01', total: 412, done: 412, failed: 0, pending: 0, status: 'completed', startedAt: minsAgo(60 * 24 * 3), target: 'All institutions', by: 'Yash' },
  },
})

const store = createStore('easyreach_content_store_v1', seed)
const S = () => store.get()

const step = async (onProgress, steps = 16) => {
  for (let i = 1; i <= steps; i++) {
    await new Promise(r => setTimeout(r, 60 + Math.random() * 90))
    onProgress?.(Math.round((i / steps) * 100))
  }
}

const typeFromName = (n) => {
  if (/\.pdf$/i.test(n)) return 'pdf'
  if (/\.(mp4|mkv|mov|webm|avi)$/i.test(n)) return 'video'
  if (/\.(ppt|pptx)$/i.test(n)) return 'ppt'
  if (/\.(png|jpe?g|gif|webp)$/i.test(n)) return 'image'
  return 'doc'
}

// GET /easyreach/mdm/content/summary
export const getContentSummary = async () => {
  await latency()
  const lib = S().library
  const pubs = S().publications
  const delivered = pubs.reduce((s, p) => s + p.done, 0)
  const opened = pubs.reduce((s, p) => s + p.opened, 0)
  return {
    items: lib.length,
    storageMb: Math.round(lib.reduce((s, c) => s + c.sizeMb, 0)),
    publications: pubs.length,
    delivered,
    openRate: delivered ? Math.round((opened / delivered) * 100) : 0,
    running: pubs.filter(p => p.status === 'running').length + (S().branding.rollout?.status === 'running' ? 1 : 0),
  }
}

// GET /easyreach/mdm/content
export const getLibrary = async () => { await latency(); return clone(S().library).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)) }

// POST /easyreach/mdm/content   (multipart)
export const uploadContent = async (file, { title, folder }, onProgress) => {
  await step(onProgress)
  await latency(300, 600)
  const type = typeFromName(file.name)
  const sizeMb = +(file.size / (1024 * 1024)).toFixed(1)
  const item = {
    id: uid('ct'), title: title || file.name.replace(/\.[^.]+$/, ''), type, sizeMb, folder,
    meta: type === 'pdf' ? `${Math.max(1, Math.round(sizeMb * 6))} pages` : type === 'video' ? `${Math.max(1, Math.round(sizeMb / 9))}:00 min` : type === 'ppt' ? `${Math.max(1, Math.round(sizeMb * 2))} slides` : file.name.split('.').pop().toUpperCase(),
    uploadedAt: new Date().toISOString(), uploadedBy: currentUser(), published: 0,
  }
  store.set(s => { s.library.unshift(item) })
  return clone(item)
}

// DELETE /easyreach/mdm/content/{id}
export const deleteContent = async (id) => { await latency(); store.set(s => { s.library = s.library.filter(c => c.id !== id) }); return { ok: true } }

// POST /easyreach/mdm/content/publish
export const publishContent = async ({ contentIds, targetLabel, deviceCount, offline, mandatory, expiresAt, schedule }) => {
  await latency(700, 1200)
  let pub
  store.set(s => {
    const items = s.library.filter(c => contentIds.includes(c.id))
    items.forEach(c => { c.published += 1 })
    pub = {
      id: uid('pub'), titles: items.map(c => c.title), contentIds, target: targetLabel,
      total: deviceCount, done: 0, failed: 0, pending: deviceCount, opened: 0,
      status: schedule === 'later' ? 'scheduled' : 'running', offline, mandatory, expiresAt: expiresAt || null,
      startedAt: new Date().toISOString(), by: currentUser(),
    }
    s.publications.unshift(pub)
  })
  return clone(pub)
}

// GET /easyreach/mdm/content/publications
export const getPublications = async () => {
  await latency(200, 400)
  store.set(s => {
    tickRollouts(s.publications)
    // students open delivered content over time
    s.publications.forEach(p => {
      if (p.opened < p.done * 0.92 && Math.random() < 0.7) p.opened = Math.min(p.done, p.opened + Math.ceil(p.done * 0.06 * Math.random()))
    })
  })
  return clone(S().publications).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
}

// POST /easyreach/mdm/content/publications/{id}/recall   (removes content from devices)
export const recallPublication = async (id) => {
  await latency(600, 1000)
  store.set(s => { const p = s.publications.find(x => x.id === id); if (p) { p.status = 'recalled'; p.pending = 0 } })
  return { ok: true }
}

// GET /easyreach/mdm/content/publications/export
export const exportDelivery = async () => {
  await latency(400, 700)
  return toCsvBlob(['Content', 'Target', 'Devices', 'Delivered', 'Failed', 'Opened', 'Open rate %', 'Offline', 'Mandatory', 'Published by', 'Published at'],
    S().publications.map(p => [p.titles.join(' | '), p.target, p.total, p.done, p.failed, p.opened, p.done ? Math.round((p.opened / p.done) * 100) : 0, p.offline ? 'Yes' : 'No', p.mandatory ? 'Yes' : 'No', p.by, new Date(p.startedAt).toLocaleString('en-IN')]))
}

/* ── Boot logo / animation / wallpaper ── */
// GET /easyreach/mdm/branding
export const getBranding = async () => {
  await latency(200, 400)
  store.set(s => { if (s.branding.rollout) tickRollouts([s.branding.rollout]) })
  return clone(S().branding)
}

// POST /easyreach/mdm/branding/{kind}   kind = logo | animation | wallpaper
export const uploadBrandAsset = async (kind, file, onProgress) => {
  await step(onProgress, 12)
  await latency(200, 400)
  store.set(s => { s.branding[kind] = { name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), updatedAt: new Date().toISOString(), pendingPush: true } })
  return clone(S().branding)
}

// POST /easyreach/mdm/branding/push
export const pushBranding = async ({ targetLabel, deviceCount }) => {
  await latency(700, 1100)
  store.set(s => {
    ;['logo', 'animation', 'wallpaper'].forEach(k => { if (s.branding[k]) s.branding[k].pendingPush = false })
    s.branding.rollout = { id: uid('br'), total: deviceCount, done: 0, failed: 0, pending: deviceCount, status: 'running', startedAt: new Date().toISOString(), target: targetLabel, by: currentUser() }
  })
  return clone(S().branding)
}
