import api from './axios'
import { toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Issue Manager (Software Issues) API layer — LIVE (EasyReach backend /easyreach/issues).

   Ported from easylearnv3 (mbse branch) buglist.php / bugreport.php.
   Same function names/shapes as the old demo layer, so IssueView.jsx is
   unchanged. Differences handled here:
     • TEAM = real active users from the backend (id = user name, which is what
       the backend stores in allocated_to). Filled in place on first load.
     • screenshots are uploaded as real files and fetched back with the login
       token (cached as data URLs so <img> works)
   ───────────────────────────────────────────────────────────────────────────── */

export const CATEGORIES = {
  bug: { label: 'Bug', icon: 'ti-bug', color: '#B5322A' },
  performance: { label: 'Performance Issue', icon: 'ti-gauge', color: '#C2410C' },
  uiux: { label: 'UI/UX Issue', icon: 'ti-layout', color: '#7C3AED' },
}

// L1 … L5 — escalation level from buglist.php
export const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5']

export const PRIORITY = {
  high: { label: 'High', color: '#B5322A', bg: '#FDEEEC', border: '#F6C3BE', icon: 'ti-chevrons-up', rank: 3 },
  medium: { label: 'Medium', color: '#8A6816', bg: '#FBF3E0', border: '#E7D39C', icon: 'ti-chevron-up', rank: 2 },
  low: { label: 'Low', color: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC', icon: 'ti-chevron-down', rank: 1 },
}

// Same status values as bugreport.php's "Update Status To" select.
export const STATUS = {
  new: { label: 'New', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: 'ti-circle-plus' },
  in_review: { label: 'In Review', color: '#8A6816', bg: '#FBF3E0', border: '#E7D39C', icon: 'ti-eye' },
  updated: { label: 'Updated', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: 'ti-refresh' },
  resolved: { label: 'Resolved', color: '#17B26A', bg: '#ECFDF5', border: '#A7E9C8', icon: 'ti-circle-check' },
  closed: { label: 'Closed', color: '#5C5C57', bg: '#F2F2EE', border: '#D5D5CE', icon: 'ti-lock' },
  reopened: { label: 'Re-Opened', color: '#B5322A', bg: '#FDEEEC', border: '#F6C3BE', icon: 'ti-rotate' },
}
export const OPEN_STATUSES = ['new', 'in_review', 'updated', 'reopened']

// Allowed next steps from each status (keeps the mbse workflow intact).
export const NEXT = {
  new: ['in_review'],
  in_review: ['updated', 'resolved'],
  updated: ['in_review', 'resolved'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in_review'],
}

export const PRODUCTS = ['EasyLearn', 'SkillMaster', 'Athena Star OTT', 'EasyTutor', 'ISF Infra', 'EasyLearn TV App']

// Real team — filled from GET /easyreach/issues/meta/options (same array object, so imports stay valid)
export const TEAM = []
// allocated_to holds the member's name; a name not in TEAM (e.g. inactive user) is still shown
export const memberName = (id) => TEAM.find(t => t.id === id)?.name || id || null

const B = '/easyreach/issues'
const d = (res) => res.data?.data ?? res.data

let teamLoaded = null
const loadTeam = () => {
  if (!teamLoaded) {
    teamLoaded = api.get(`${B}/meta/options`).then(r => {
      TEAM.splice(0, TEAM.length, ...(r.data.team || []).map(u => ({ id: u.id, name: u.name, role: u.role || '' })))
    }).catch(() => { teamLoaded = null })
  }
  return teamLoaded
}

/* ── screenshots: fetched with the auth token, cached as data URLs ── */
const shotCache = new Map()
const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(r.result)
  r.onerror = () => reject(new Error('Could not read screenshot'))
  r.readAsDataURL(blob)
})
async function loadShot(url) {
  if (shotCache.has(url)) return shotCache.get(url)
  try {
    const res = await api.get(url, { responseType: 'blob' })
    const dataUrl = await blobToDataUrl(res.data)
    shotCache.set(url, dataUrl)
    return dataUrl
  } catch { return '' }
}
async function withShots(issue) {
  const screenshots = await Promise.all((issue.screenshots || []).map(async s => ({ ...s, url: await loadShot(s.url) })))
  return { ...issue, screenshots }
}

/* ── Summary ── */
// GET /easyreach/issues/summary
export const getIssueSummary = async () => {
  await loadTeam()
  const s = (await api.get(`${B}/summary`)).data
  s.workload = (s.workload || []).map(w => ({ ...w, id: w.name, role: w.role || TEAM.find(t => t.id === w.name)?.role || '' }))
  return s
}

/* ── Issues ── */
// GET /easyreach/issues
export const getIssues = async () => {
  await loadTeam()
  return Promise.all(d(await api.get(B)).map(withShots))
}

// POST /easyreach/issues   (multipart: title, description, category, level, priority, product, screenshots[])
export const reportIssue = async (data) => {
  const fd = new FormData()
  ;['title', 'description', 'category', 'level', 'priority', 'product'].forEach(k => fd.append(k, data[k] == null ? '' : String(data[k])))
  for (const shot of data.screenshots || []) {
    const blob = await (await fetch(shot.url)).blob()
    fd.append('screenshots', blob, shot.name || 'screenshot.png')
  }
  try {
    return await withShots(d(await api.post(B, fd, { headers: { 'Content-Type': 'multipart/form-data' } })))
  } catch (e) {
    throw new Error(e?.response?.data?.detail || 'Could not report issue', { cause: e })
  }
}

// PATCH /easyreach/issues/{id}   (allocation, reviewer, estimated dates; note goes to history)
export const updateIssue = async (id, patch, note) => {
  const body = { note: note || '' }
  ;['allocated_to', 'reviewed_by', 'estimated_start_date', 'estimated_end_date'].forEach(k => {
    if (k in patch) body[k] = patch[k] == null ? '' : String(patch[k])   // '' = clear (null would mean "unchanged")
  })
  return withShots(d(await api.patch(`${B}/${id}`, body)))
}

// POST /easyreach/issues/{id}/status   { status, remark }
export const setIssueStatus = async (id, status, remark = '') => {
  try {
    return await withShots(d(await api.post(`${B}/${id}/status`, { status, remark })))
  } catch (e) {
    throw new Error(e?.response?.data?.detail || 'Could not change status', { cause: e })
  }
}

// DELETE /easyreach/issues/{id}
export const deleteIssue = async (id) => (await api.delete(`${B}/${id}`)).data

// CSV built in the browser from the rows on screen
export const exportIssues = async (rows) =>
  toCsvBlob(['ID', 'Title', 'Product', 'Category', 'Level', 'Priority', 'Status', 'Allocated to', 'Reported by', 'Reported on', 'Est. end', 'Resolved by'],
    rows.map(i => [i.id, i.title, i.product, CATEGORIES[i.category]?.label, i.level, PRIORITY[i.priority]?.label, STATUS[i.status]?.label,
      memberName(i.allocated_to) || '—', i.added_by, new Date(i.added_on).toLocaleDateString('en-IN'), i.estimated_end_date, i.resolved_by || '']))

/* Screenshot — read as a data URL for preview, uploaded as a file (JPG/PNG/WebP, ≤ 2 MB each, max 6). */
export const MAX_SHOT_BYTES = 2 * 1024 * 1024
export const readScreenshot = (file) => new Promise((resolve, reject) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return reject(new Error('Only JPG, PNG or WebP images are allowed'))
  if (file.size > MAX_SHOT_BYTES) return reject(new Error(`${file.name} is larger than 2 MB`))
  const r = new FileReader()
  r.onload = () => resolve({ name: file.name, url: r.result })
  r.onerror = () => reject(new Error(`Could not read ${file.name}`))
  r.readAsDataURL(file)
})

/* ── Audit ── */
// GET /easyreach/issues/audit
export const getIssueAudit = async () => d(await api.get(`${B}/audit`))
