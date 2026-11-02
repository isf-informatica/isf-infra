import api from './axios'
import { toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Visitor Management API layer — LIVE (EasyReach backend /easyreach/visitors).

   Ported from easylearnv3 (mbse branch) Visitor_Controller / Visitor_Model.
   Same function names/shapes as the old demo layer, so VisitorView.jsx is
   unchanged. Differences handled here:
     • photo is uploaded as a real file (multipart) and fetched back with the
       login token (cached as a data URL so <img> and the printed gate pass work)
     • backend names → page names: done_by_name → done_by,
       registered_by_name → registered_by
     • "Pass expired" log rows are derived from active visitors whose gate pass
       has run out (backend logs only check-in / check-out / cancel)
   ───────────────────────────────────────────────────────────────────────────── */

// Same option lists as visitor_register.php
export const PURPOSES = ['Meeting', 'Delivery', 'Interview', 'Parent Visit', 'Official Work', 'Other']
export const ID_PROOFS = ['Aadhar Card', 'PAN Card', 'Passport', 'Driving License', 'Voter ID']
export const PASS_HOURS = [[1, '1 Hour'], [2, '2 Hours'], [4, '4 Hours'], [8, '8 Hours (Full Day)'], [24, '24 Hours']]
export const DEPARTMENTS = ['Administration', 'Accounts', 'Admissions', 'Academics', 'IT', 'Principal Office', 'Transport']
export const SITES = ['MBSE School', 'Pimpri Chinchwad University', 'MET School Nashik', 'ISF Head Office']

// el_visitors.status
export const VISIT_STATUS = {
  active: { label: 'Checked in', color: '#17B26A', bg: '#ECFDF5', border: '#A7E9C8', icon: 'ti-login' },
  checked_out: { label: 'Checked out', color: '#5C5C57', bg: '#F2F2EE', border: '#D5D5CE', icon: 'ti-logout' },
  cancelled: { label: 'Cancelled', color: '#8A2A2A', bg: '#FBEAE9', border: '#EFC4C1', icon: 'ti-ban' },
}

// el_visitor_security_logs.event_type
export const EVENT_TYPES = {
  CHECK_IN: { label: 'Check-in', color: '#17B26A', icon: 'ti-login' },
  CHECK_OUT: { label: 'Check-out', color: '#2563EB', icon: 'ti-logout' },
  CANCELLED: { label: 'Cancelled', color: '#8A2A2A', icon: 'ti-ban' },
  PASS_EXPIRED: { label: 'Pass expired', color: '#C2410C', icon: 'ti-clock-exclamation' },
}

/* Gate pass state, same rule as visitor_gate_pass.php: expiry < now = expired. */
export const passState = (v) => {
  if (v.status !== 'active') return 'closed'
  return v.gate_pass_expiry && new Date(v.gate_pass_expiry).getTime() < Date.now() ? 'expired' : 'valid'
}
export const passNo = (v) => `GP-${String(v.id).padStart(5, '0')}`
export const durationMins = (v) => {
  const end = v.check_out_time ? new Date(v.check_out_time) : new Date()
  return Math.max(0, Math.round((end - new Date(v.check_in_time)) / 60000))
}

const B = '/easyreach/visitors'
const d = (res) => res.data?.data ?? res.data

/* ── photos: fetched with the auth token, cached per visitor as a data URL ── */
const photoCache = new Map()
const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(r.result)
  r.onerror = () => reject(new Error('Could not read photo'))
  r.readAsDataURL(blob)
})
async function loadPhoto(id) {
  if (photoCache.has(id)) return photoCache.get(id)
  try {
    const res = await api.get(`${B}/${id}/file/photo`, { responseType: 'blob' })
    const url = await blobToDataUrl(res.data)
    photoCache.set(id, url)
    return url
  } catch {
    photoCache.set(id, null)
    return null
  }
}
const toPage = (v) => ({ ...v, registered_by: v.registered_by_name || '', visitor_photo: photoCache.get(v.id) || null })
async function withPhotos(rows, max = 60) {
  await Promise.all(rows.slice(0, max).filter(v => v.has_photo).map(v => loadPhoto(v.id)))
  return rows.map(toPage)
}

/* ── Summary (visitor_management.php cards + visitor_report.php stats) ── */
// GET /easyreach/visitors/summary
export const getVisitorSummary = async () => (await api.get(`${B}/summary`)).data

/* ── Register ── */
// POST /easyreach/visitors  (multipart: visitor_* fields, host_*, gate_pass_hours, visitor_photo, notify_visitor)
export const registerVisitor = async (data) => {
  const fd = new FormData()
  const fields = ['visitor_name', 'visitor_phone', 'visitor_email', 'purpose', 'id_proof_type', 'id_proof_no',
    'host_name', 'host_email', 'host_department', 'site', 'remarks', 'gate_pass_hours']
  fields.forEach(k => fd.append(k, data[k] == null ? '' : String(data[k]).trim()))
  fd.append('notify_visitor', data.notify_visitor ? '1' : '0')
  if (data.visitor_photo) {
    const blob = await (await fetch(data.visitor_photo)).blob()
    const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
    fd.append('visitor_photo', blob, `photo.${ext}`)
  }
  try {
    const v = d(await api.post(B, fd, { headers: { 'Content-Type': 'multipart/form-data' } }))
    if (data.visitor_photo) photoCache.set(v.id, data.visitor_photo)
    return toPage(v)
  } catch (e) {
    throw new Error(e?.response?.data?.detail || 'Could not register visitor', { cause: e })
  }
}

/* ── Active ── */
// GET /easyreach/visitors/active
export const getActiveVisitors = async () => withPhotos(d(await api.get(`${B}/active`)))

// POST /easyreach/visitors/{id}/checkout
export const checkoutVisitor = async (id) => toPage(d(await api.post(`${B}/${id}/checkout`)))

// POST /easyreach/visitors/{id}/cancel   (soft delete → status 'cancelled')
export const cancelVisitor = async (id) => toPage(d(await api.post(`${B}/${id}/cancel`)))

// GET /easyreach/visitors/{id}
export const getVisitor = async (id) => {
  try {
    const v = d(await api.get(`${B}/${id}`))
    if (v.has_photo) await loadPhoto(v.id)
    return toPage(v)
  } catch { return null }
}

/* ── History / report ── */
// GET /easyreach/visitors/history?date_from&date_to&search
export const getVisitHistory = async ({ from, to, search } = {}) =>
  withPhotos(d(await api.get(`${B}/history`, { params: { date_from: from || undefined, date_to: to || undefined, search: search || undefined } })))

export const exportVisits = async (rows) => {
  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN') : ''
  return toCsvBlob(['Gate pass', 'Visitor', 'Phone', 'Purpose', 'Host', 'Department', 'Site', 'Check-in', 'Check-out', 'Duration (min)', 'Status', 'Registered by'],
    rows.map(v => [passNo(v), v.visitor_name, v.visitor_phone, v.purpose, v.host_name, v.host_department, v.site, fmt(v.check_in_time), fmt(v.check_out_time),
      v.status === 'cancelled' ? '' : durationMins(v), VISIT_STATUS[v.status]?.label, v.registered_by]))
}

/* ── Security logs ── */
// GET /easyreach/visitors/logs?date_from&date_to   (+ derived "Pass expired" rows)
export const getSecurityLogs = async ({ from, to } = {}) => {
  const [logs, active] = await Promise.all([
    d(await api.get(`${B}/logs`, { params: { date_from: from || undefined, date_to: to || undefined } })),
    d(await api.get(`${B}/active`)),
  ])
  const rows = logs.map(l => ({ ...l, done_by: l.done_by_name || 'System' }))
  active.filter(v => passState(v) === 'expired').forEach(v => {
    const day = v.gate_pass_expiry.slice(0, 10)
    if ((!from || day >= from) && (!to || day <= to)) {
      rows.push({ id: `exp_${v.id}`, visitor_id: v.id, event_type: 'PASS_EXPIRED', event_desc: `Gate pass expired, still on premises: ${v.visitor_name}`,
        done_by: 'System', event_time: v.gate_pass_expiry, visitor_name: v.visitor_name, visitor_phone: v.visitor_phone })
    }
  })
  return rows.sort((a, b) => b.event_time.localeCompare(a.event_time))
}

/* Visitor photo — read as a data URL for preview, uploaded as a file on register (images only, ≤ 2 MB). */
export const readPhoto = (file) => new Promise((resolve, reject) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return reject(new Error('Only JPG, PNG or WebP photos are allowed'))
  if (file.size > 2 * 1024 * 1024) return reject(new Error('Photo must be under 2 MB'))
  const r = new FileReader()
  r.onload = () => resolve(r.result)
  r.onerror = () => reject(new Error('Could not read the photo'))
  r.readAsDataURL(file)
})
