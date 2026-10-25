import { latency, uid, minsAgo, clone, currentUser, createStore, toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Visitor Management API layer.

   Ported from easylearnv3 (mbse branch):
     • app/Controllers/Visitor_Controller.php  (register_visitor,
       get_active_visitors, checkout_visitor, get_visit_history,
       get_security_logs, get_visitor, delete_visitor)
     • app/Models/Visitor_Model.php            (el_visitors,
       el_visitor_security_logs)
     • app/Views/Easylearn/visitor_*.php       (register, active, history,
       report, security logs, gate pass)

   ⚠️ DEMO MODE — the isf-infra backend has no visitor endpoints yet. Each
   function keeps the same async signature a real call would have; replace
   the body with the commented endpoint above it (mbse route names) when
   wired in. The page (pages/visitors/VisitorView.jsx) does not need any change.
   Reset demo data: localStorage.removeItem('easyreach_visitors_store_v1')
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

const hoursFrom = (iso, h) => new Date(new Date(iso).getTime() + h * 3600000).toISOString()

const seed = () => {
  // [name, phone, purpose, host, dept, site, minsAgoIn, passHours, outAfterMins|null|'cancel']
  const rows = [
    ['Rohan Mehta', '98200 41123', 'Parent Visit', 'Mrs. Kulkarni', 'Academics', 'MBSE School', 35, 2, null],
    ['Blue Dart Courier', '99300 77812', 'Delivery', 'Front Office', 'Administration', 'MBSE School', 12, 1, null],
    ['Sneha Rao', '97690 22018', 'Interview', 'Mr. Deshpande', 'Principal Office', 'MBSE School', 95, 2, null],
    ['Ankit Sharma', '98190 55021', 'Official Work', 'IT Team', 'IT', 'ISF Head Office', 300, 4, null],
    ['Priya Nair', '90040 11290', 'Meeting', 'Accounts Head', 'Accounts', 'Pimpri Chinchwad University', 180, 2, 70],
    ['Vikram Joshi', '98700 63344', 'Parent Visit', 'Class Teacher 7B', 'Academics', 'MET School Nashik', 60 * 26, 1, 40],
    ['Swiggy Genie', '91520 90031', 'Delivery', 'Canteen', 'Administration', 'MBSE School', 60 * 27, 1, 8],
    ['Dr. Farah Khan', '98211 30470', 'Meeting', 'Principal', 'Principal Office', 'MBSE School', 60 * 50, 4, 95],
    ['Rahul Patil', '99870 12555', 'Interview', 'HR', 'Administration', 'ISF Head Office', 60 * 74, 2, 55],
    ['Meera Iyer', '98330 44781', 'Official Work', 'Transport In-charge', 'Transport', 'MBSE School', 60 * 98, 8, 210],
    ['Kunal Verma', '90290 66412', 'Meeting', 'Admissions Desk', 'Admissions', 'Pimpri Chinchwad University', 60 * 120, 2, 'cancel'],
  ]
  const visitors = rows.map(([name, phone, purpose, host, dept, site, inMins, hours, out], i) => {
    const check_in_time = minsAgo(inMins)
    const id = 2041 + i
    const v = {
      id, visitor_name: name, visitor_phone: phone, visitor_email: '', purpose,
      id_proof_type: ID_PROOFS[i % ID_PROOFS.length], id_proof_no: `XXXX-${String(4100 + i * 37).slice(-4)}`,
      host_name: host, host_email: '', host_department: dept, site, remarks: '',
      check_in_time, visit_date: check_in_time.slice(0, 10), gate_pass_expiry: hoursFrom(check_in_time, hours),
      check_out_time: typeof out === 'number' ? hoursFrom(check_in_time, out / 60) : null,
      status: out === 'cancel' ? 'cancelled' : typeof out === 'number' ? 'checked_out' : 'active',
      visitor_photo: null, registered_by: i % 2 ? 'Security Desk' : 'Front Office', visitor_mobile_notified: i % 3 === 0,
    }
    return v
  })
  const logs = []
  visitors.forEach(v => {
    logs.push({ id: uid('sl'), visitor_id: v.id, event_type: 'CHECK_IN', event_desc: `Visitor checked in: ${v.visitor_name}`, done_by: v.registered_by, event_time: v.check_in_time })
    if (v.status === 'checked_out') logs.push({ id: uid('sl'), visitor_id: v.id, event_type: 'CHECK_OUT', event_desc: `Visitor checked out: ${v.visitor_name}`, done_by: 'Security Desk', event_time: v.check_out_time })
    if (v.status === 'cancelled') logs.push({ id: uid('sl'), visitor_id: v.id, event_type: 'CANCELLED', event_desc: `Visit cancelled: ${v.visitor_name}`, done_by: 'Front Office', event_time: hoursFrom(v.check_in_time, 0.2) })
  })
  return { visitors, logs }
}

const store = createStore('easyreach_visitors_store_v1', seed)
const S = () => store.get()
const log = (visitor, event_type, event_desc) => store.set(s => {
  s.logs.unshift({ id: uid('sl'), visitor_id: visitor.id, event_type, event_desc, done_by: currentUser(), event_time: new Date().toISOString() })
})
const withName = (l) => {
  const v = S().visitors.find(x => x.id === l.visitor_id)
  return { ...l, visitor_name: v?.visitor_name || '—', visitor_phone: v?.visitor_phone || '' }
}

/* Logs a one-time PASS_EXPIRED event for any active visitor whose pass has run out. */
function sweepExpired() {
  const s = S()
  s.visitors.forEach(v => {
    if (passState(v) === 'expired' && !s.logs.some(l => l.visitor_id === v.id && l.event_type === 'PASS_EXPIRED')) {
      store.set(st => { st.logs.unshift({ id: uid('sl'), visitor_id: v.id, event_type: 'PASS_EXPIRED', event_desc: `Gate pass expired, still on premises: ${v.visitor_name}`, done_by: 'System', event_time: v.gate_pass_expiry }) })
    }
  })
}

/* ── Summary (visitor_management.php cards + visitor_report.php stats) ── */
export const getVisitorSummary = async () => {
  await latency()
  sweepExpired()
  const s = S()
  const today = new Date().toISOString().slice(0, 10)
  const todays = s.visitors.filter(v => v.visit_date === today)
  const active = s.visitors.filter(v => v.status === 'active')
  const done = s.visitors.filter(v => v.status === 'checked_out')
  const byPurpose = {}
  s.visitors.filter(v => v.status !== 'cancelled').forEach(v => { byPurpose[v.purpose] = (byPurpose[v.purpose] || 0) + 1 })
  const days = []
  for (let k = 6; k >= 0; k--) {
    const d = new Date(Date.now() - k * 86400000)
    const key = d.toISOString().slice(0, 10)
    days.push({ key, label: d.toLocaleDateString('en-IN', { weekday: 'short' }), count: s.visitors.filter(v => v.visit_date === key && v.status !== 'cancelled').length })
  }
  return {
    today: todays.filter(v => v.status !== 'cancelled').length,
    onPremises: active.length,
    expired: active.filter(v => passState(v) === 'expired').length,
    checkedOutToday: todays.filter(v => v.status === 'checked_out').length,
    total: s.visitors.length,
    avgMins: done.length ? Math.round(done.reduce((t, v) => t + durationMins(v), 0) / done.length) : 0,
    byPurpose: Object.entries(byPurpose).sort((a, b) => b[1] - a[1]),
    days,
  }
}

/* ── Register ── */
// POST register_visitor  (multipart: visitor_* fields, host_*, gate_pass_hours, visitor_photo, id_proof_photo, notify_visitor)
export const registerVisitor = async (data) => {
  await latency(500, 900)
  const now = new Date().toISOString()
  const v = {
    id: Math.max(2040, ...S().visitors.map(x => x.id)) + 1,
    visitor_name: data.visitor_name.trim(), visitor_phone: data.visitor_phone.trim(), visitor_email: data.visitor_email || '',
    purpose: data.purpose, id_proof_type: data.id_proof_type || '', id_proof_no: data.id_proof_no || '',
    host_name: data.host_name || '', host_email: data.host_email || '', host_department: data.host_department || '',
    site: data.site, remarks: data.remarks || '',
    check_in_time: now, visit_date: now.slice(0, 10), gate_pass_expiry: hoursFrom(now, Number(data.gate_pass_hours) || 4),
    check_out_time: null, status: 'active', visitor_photo: data.visitor_photo || null,
    registered_by: currentUser(), visitor_mobile_notified: !!data.notify_visitor,
  }
  store.set(s => { s.visitors.unshift(v) })
  log(v, 'CHECK_IN', `Visitor checked in: ${v.visitor_name}`)
  return clone(v)
}

/* ── Active ── */
// POST get_active_visitors
export const getActiveVisitors = async () => {
  await latency(200, 400)
  sweepExpired()
  return clone(S().visitors.filter(v => v.status === 'active')).sort((a, b) => b.check_in_time.localeCompare(a.check_in_time))
}

// POST checkout_visitor  { visitor_id }
export const checkoutVisitor = async (id) => {
  await latency(300, 600)
  let v
  store.set(s => { v = s.visitors.find(x => x.id === id); v.status = 'checked_out'; v.check_out_time = new Date().toISOString() })
  log(v, 'CHECK_OUT', `Visitor checked out: ${v.visitor_name}`)
  return clone(v)
}

// POST delete_visitor  { visitor_id }  (soft delete → status 'cancelled')
export const cancelVisitor = async (id) => {
  await latency(300, 600)
  let v
  store.set(s => { v = s.visitors.find(x => x.id === id); v.status = 'cancelled' })
  log(v, 'CANCELLED', `Visit cancelled: ${v.visitor_name}`)
  return clone(v)
}

// POST get_visitor  { visitor_id }
export const getVisitor = async (id) => { await latency(150, 300); return clone(S().visitors.find(v => v.id === id) || null) }

/* ── History / report ── */
// POST get_visit_history  { date_from, date_to, search }
export const getVisitHistory = async ({ from, to, search } = {}) => {
  await latency()
  const q = (search || '').trim().toLowerCase()
  return clone(S().visitors.filter(v => (!from || v.visit_date >= from) && (!to || v.visit_date <= to)
    && (!q || `${v.visitor_name} ${v.visitor_phone} ${v.host_name}`.toLowerCase().includes(q))))
    .sort((a, b) => b.check_in_time.localeCompare(a.check_in_time))
}

export const exportVisits = async (rows) => {
  await latency(300, 600)
  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN') : ''
  return toCsvBlob(['Gate pass', 'Visitor', 'Phone', 'Purpose', 'Host', 'Department', 'Site', 'Check-in', 'Check-out', 'Duration (min)', 'Status', 'Registered by'],
    rows.map(v => [passNo(v), v.visitor_name, v.visitor_phone, v.purpose, v.host_name, v.host_department, v.site, fmt(v.check_in_time), fmt(v.check_out_time),
      v.status === 'cancelled' ? '' : durationMins(v), VISIT_STATUS[v.status]?.label, v.registered_by]))
}

/* ── Security logs ── */
// POST get_security_logs  { date_from, date_to }
export const getSecurityLogs = async ({ from, to } = {}) => {
  await latency()
  sweepExpired()
  return S().logs.filter(l => { const d = l.event_time.slice(0, 10); return (!from || d >= from) && (!to || d <= to) })
    .map(withName).sort((a, b) => b.event_time.localeCompare(a.event_time))
}

/* Visitor photo is kept as a small data URL in demo mode (images only, ≤ 300 KB). */
export const readPhoto = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error('Only image files are allowed'))
  if (file.size > 300 * 1024) return reject(new Error('Photo must be under 300 KB in demo mode'))
  const r = new FileReader()
  r.onload = () => resolve(r.result)
  r.onerror = () => reject(new Error('Could not read the photo'))
  r.readAsDataURL(file)
})
