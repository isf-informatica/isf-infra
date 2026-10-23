import { latency, uid, minsAgo, clone, currentUser, createStore, toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Issue Manager (Software Issues) API layer.

   Ported from easylearnv3 (mbse branch):
     • app/Views/Easylearn/buglist.php    — report an issue (work/title,
       description, priority, category, level, screenshots)
     • app/Views/Easylearn/bugreport.php  — triage: allocate to a team member,
       reviewer, estimated / actual dates, status workflow
       New → In Review → Updated → Resolved → Closed (or Re-Opened)

   ⚠️ DEMO MODE — the isf-infra backend has no issue endpoints yet. Each
   function keeps the same async signature a real call would have; replace
   the body with the commented endpoint above it when wired in. The page
   (pages/issues/IssueView.jsx) does not need any change.
   Reset demo data: localStorage.removeItem('easyreach_issues_store_v1')
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

export const TEAM = [
  { id: 'u1', name: 'Shyam', role: 'Developer' },
  { id: 'u2', name: 'Yash', role: 'Developer' },
  { id: 'u3', name: 'Sahil', role: 'Developer' },
  { id: 'u4', name: 'Kavya', role: 'QA' },
  { id: 'u5', name: 'Pratyush', role: 'Developer' },
  { id: 'u6', name: 'Tapan Das', role: 'Reviewer' },
]

const dateIso = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

const seed = () => {
  const rows = [
    ['Attendance report export shows wrong month', 'Exporting the monthly attendance report from School Admin downloads data for the previous month.', 'bug', 'L2', 'high', 'in_review', 'EasyLearn', 'u1', 'Kavya', 30],
    ['Timetable page takes 12s to load for mentors', 'Batch timetable with 40+ batches is very slow on mentor login.', 'performance', 'L3', 'medium', 'updated', 'EasyLearn', 'u2', 'Kavya', 75],
    ['Login button overlaps on small Android TV screens', 'On 720p TVs the login CTA overlaps the keyboard hint.', 'uiux', 'L1', 'low', 'new', 'EasyLearn TV App', null, 'Mahesh', 8],
    ['Fee receipt PDF missing GST number', 'ISF Tax Invoice PDF does not print school GSTIN on the header.', 'bug', 'L2', 'high', 'resolved', 'EasyLearn', 'u5', 'Accounts team', 140],
    ['Video stutters on OTT for 1080p streams', 'Buffering every 10–15s on 1080p for Athena Star titles over Jio.', 'performance', 'L4', 'high', 'reopened', 'Athena Star OTT', 'u3', 'Support desk', 220],
    ['Course card titles cut off at two lines', 'Long course names are truncated without tooltip on SkillMaster dashboard.', 'uiux', 'L1', 'low', 'closed', 'SkillMaster', 'u2', 'Rutuja', 600],
    ['Student promotion clears section filter', 'After saving a promotion, the class/section filter resets to default.', 'bug', 'L2', 'medium', 'new', 'EasyLearn', null, 'MBSE school admin', 3],
    ['License usage chart empty for new schools', 'Usage tab shows no data for schools assigned in the last 24h.', 'bug', 'L3', 'medium', 'in_review', 'ISF Infra', 'u2', 'Yash', 50],
  ]
  const issues = rows.map(([title, description, category, level, priority, status, product, assignee, addedBy, mins], i) => ({
    id: `ISS-${String(1041 + i)}`, title, description, category, level, priority, status, product,
    allocated_to: assignee, reviewed_by: status === 'resolved' || status === 'closed' ? 'Tapan Das' : null,
    estimated_start_date: assignee ? dateIso(-Math.ceil(mins / 60 / 24)) : '', estimated_end_date: assignee ? dateIso(3 + i) : '',
    actual_start_date: ['in_review', 'updated', 'resolved', 'closed', 'reopened'].includes(status) ? dateIso(-Math.ceil(mins / 60 / 24)) : '',
    actual_end_date: ['resolved', 'closed'].includes(status) ? dateIso(-1) : '',
    screenshots: [], added_by: addedBy, added_on: minsAgo(60 * mins), updated_by: assignee ? TEAM.find(t => t.id === assignee).name : addedBy, updated_on: minsAgo(60 * (mins / 3)),
    resolved_by: ['resolved', 'closed'].includes(status) && assignee ? TEAM.find(t => t.id === assignee).name : null,
    history: [{ at: minsAgo(60 * mins), by: addedBy, text: 'Reported the issue' }],
  }))
  return {
    issues,
    audit: [
      { id: 'ia_1', at: minsAgo(60 * 2), by: 'Kavya', action: 'Moved to In Review', target: 'ISS-1041' },
      { id: 'ia_2', at: minsAgo(60 * 9), by: 'Support desk', action: 'Re-opened', target: 'ISS-1045' },
    ],
  }
}

const store = createStore('easyreach_issues_store_v1', seed)
const S = () => store.get()
const audit = (action, target) => store.set(s => { s.audit.unshift({ id: uid('ia'), at: new Date().toISOString(), by: currentUser(), action, target }) })
export const memberName = (id) => TEAM.find(t => t.id === id)?.name || null

/* ── Summary ── */
// GET /issues/summary
export const getIssueSummary = async () => {
  await latency()
  const s = S()
  const open = s.issues.filter(i => OPEN_STATUSES.includes(i.status))
  const byStatus = {}
  Object.keys(STATUS).forEach(k => { byStatus[k] = s.issues.filter(i => i.status === k).length })
  const byCategory = {}
  Object.keys(CATEGORIES).forEach(k => { byCategory[k] = open.filter(i => i.category === k).length })
  const byProduct = {}
  open.forEach(i => { byProduct[i.product] = (byProduct[i.product] || 0) + 1 })
  const workload = TEAM.map(t => ({ ...t, open: open.filter(i => i.allocated_to === t.id).length })).filter(t => t.open > 0).sort((a, b) => b.open - a.open)
  return {
    total: s.issues.length, open: open.length,
    unassigned: open.filter(i => !i.allocated_to).length,
    highOpen: open.filter(i => i.priority === 'high').length,
    resolved: byStatus.resolved + byStatus.closed,
    byStatus, byCategory,
    byProduct: Object.entries(byProduct).sort((a, b) => b[1] - a[1]),
    workload,
  }
}

/* ── Issues ── */
// GET /issues
export const getIssues = async () => {
  await latency()
  return clone(S().issues).sort((a, b) => new Date(b.added_on) - new Date(a.added_on))
}

// POST /issues   (multipart: title, description, category, level, priority, product, screenshots[])
export const reportIssue = async (data) => {
  await latency(500, 900)
  const n = Math.max(1040, ...S().issues.map(i => Number(i.id.split('-')[1]))) + 1
  const now = new Date().toISOString()
  const issue = {
    id: `ISS-${n}`, status: 'new', allocated_to: null, reviewed_by: null,
    estimated_start_date: '', estimated_end_date: '', actual_start_date: '', actual_end_date: '',
    added_by: currentUser(), added_on: now, updated_by: currentUser(), updated_on: now, resolved_by: null,
    screenshots: [], ...data,
    history: [{ at: now, by: currentUser(), text: 'Reported the issue' }],
  }
  store.set(s => { s.issues.unshift(issue) })
  audit('Reported issue', `${issue.id} · ${issue.title}`)
  return clone(issue)
}

// PATCH /issues/{id}   (allocation, reviewer, dates, edits)
export const updateIssue = async (id, patch, note) => {
  await latency(400, 700)
  let issue
  store.set(s => {
    issue = s.issues.find(i => i.id === id)
    Object.assign(issue, patch)
    issue.updated_by = currentUser()
    issue.updated_on = new Date().toISOString()
    if (note) issue.history.push({ at: issue.updated_on, by: currentUser(), text: note })
  })
  if (note) audit(note, id)
  return clone(issue)
}

// POST /issues/{id}/status   { status, remark }
export const setIssueStatus = async (id, status, remark = '') => {
  const cur = S().issues.find(i => i.id === id)
  const patch = { status }
  const today = new Date().toISOString().slice(0, 10)
  if (status === 'in_review' && !cur.actual_start_date) patch.actual_start_date = today
  if (status === 'resolved') { patch.actual_end_date = today; patch.resolved_by = currentUser() }
  if (status === 'closed') patch.reviewed_by = cur.reviewed_by || currentUser()
  if (status === 'reopened') { patch.actual_end_date = ''; patch.resolved_by = null }
  return updateIssue(id, patch, `Moved to ${STATUS[status].label}${remark ? ` — ${remark}` : ''}`)
}

// DELETE /issues/{id}
export const deleteIssue = async (id) => {
  await latency(300, 500)
  store.set(s => { s.issues = s.issues.filter(i => i.id !== id) })
  audit('Deleted issue', id)
  return { ok: true }
}

// GET /issues/export
export const exportIssues = async (rows) => {
  await latency(300, 600)
  return toCsvBlob(['ID', 'Title', 'Product', 'Category', 'Level', 'Priority', 'Status', 'Allocated to', 'Reported by', 'Reported on', 'Est. end', 'Resolved by'],
    rows.map(i => [i.id, i.title, i.product, CATEGORIES[i.category]?.label, i.level, PRIORITY[i.priority]?.label, STATUS[i.status]?.label,
      memberName(i.allocated_to) || '—', i.added_by, new Date(i.added_on).toLocaleDateString('en-IN'), i.estimated_end_date, i.resolved_by || '']))
}

/* Screenshots are kept as small data URLs in demo mode (images only, ≤ 400 KB each). */
export const MAX_SHOT_BYTES = 400 * 1024
export const readScreenshot = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error('Only image files are allowed'))
  if (file.size > MAX_SHOT_BYTES) return reject(new Error(`${file.name} is larger than 400 KB`))
  const r = new FileReader()
  r.onload = () => resolve({ name: file.name, url: r.result })
  r.onerror = () => reject(new Error(`Could not read ${file.name}`))
  r.readAsDataURL(file)
})

/* ── Audit ── */
export const getIssueAudit = async () => { await latency(200, 400); return clone(S().audit) }
