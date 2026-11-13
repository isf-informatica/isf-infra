import api from './axios'
import { toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Content Publishing API layer — LIVE backend.

   Talks to the easyreach MDM content/branding endpoints:
     /easyreach/mdm/content..., /easyreach/mdm/branding...
   Real device delivery: when the publish/branding-push carries institution_ids,
   the backend queues a PUBLISH_CONTENT / APPLY_BRANDING command per Windows PC
   (same mechanism as policy push) and progress fills as agents report back.
   The page (pages/mdm/ContentPublishingView.jsx) needs no change.
   ───────────────────────────────────────────────────────────────────────────── */

export const FOLDERS = ['Class 8', 'Class 9', 'Class 10', 'Teachers', 'Notices']

// GET /easyreach/mdm/content/summary
export const getContentSummary = async () => {
  const res = await api.get('/easyreach/mdm/content/summary')
  return res.data
}

// GET /easyreach/mdm/content
export const getLibrary = async () => {
  const res = await api.get('/easyreach/mdm/content')
  return res.data.data || []
}

// POST /easyreach/mdm/content   (multipart)
export const uploadContent = async (file, { title, folder }, onProgress) => {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('title', title || '')
  fd.append('folder', folder || 'Class 10')
  const res = await api.post('/easyreach/mdm/content', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
  return res.data.data
}

// DELETE /easyreach/mdm/content/{id}
export const deleteContent = async (id) => {
  const res = await api.delete(`/easyreach/mdm/content/${id}`)
  return res.data
}

// POST /easyreach/mdm/content/publish
export const publishContent = async ({ contentIds, targetLabel, deviceCount, offline, mandatory, expiresAt, schedule, institution_ids }) => {
  const res = await api.post('/easyreach/mdm/content/publish', {
    contentIds, targetLabel, deviceCount, offline, mandatory,
    expiresAt: expiresAt || null, schedule: schedule || 'now',
    institution_ids: institution_ids && institution_ids.length ? institution_ids : null,
  })
  return res.data.data
}

// GET /easyreach/mdm/content/publications
export const getPublications = async () => {
  const res = await api.get('/easyreach/mdm/content/publications')
  return res.data.data || []
}

// POST /easyreach/mdm/content/publications/{id}/recall   (removes content from devices)
export const recallPublication = async (id) => {
  const res = await api.post(`/easyreach/mdm/content/publications/${id}/recall`)
  return res.data
}

// Delivery report CSV — built client-side from the live publications list.
export const exportDelivery = async () => {
  const pubs = await getPublications()
  return toCsvBlob(
    ['Content', 'Target', 'Devices', 'Delivered', 'Failed', 'Opened', 'Open rate %', 'Offline', 'Mandatory', 'Published by', 'Published at'],
    pubs.map(p => [
      (p.titles || []).join(' | '), p.target, p.total, p.done, p.failed, p.opened,
      p.done ? Math.round((p.opened / p.done) * 100) : 0,
      p.offline ? 'Yes' : 'No', p.mandatory ? 'Yes' : 'No', p.by,
      p.startedAt ? new Date(p.startedAt).toLocaleString('en-IN') : '',
    ])
  )
}

/* ── Boot logo / animation / wallpaper ── */
// GET /easyreach/mdm/branding
export const getBranding = async () => {
  const res = await api.get('/easyreach/mdm/branding')
  return res.data.data
}

// POST /easyreach/mdm/branding/{kind}   kind = logo | animation | wallpaper
export const uploadBrandAsset = async (kind, file, onProgress) => {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post(`/easyreach/mdm/branding/${kind}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
  return res.data.data
}

// POST /easyreach/mdm/branding/push
export const pushBranding = async ({ targetLabel, deviceCount, institution_ids }) => {
  const res = await api.post('/easyreach/mdm/branding/push', {
    targetLabel, deviceCount,
    institution_ids: institution_ids && institution_ids.length ? institution_ids : null,
  })
  return res.data.data
}
