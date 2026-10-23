import { latency, uid, clone, createStore } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Digital Organizer API layer — personal notes, tasks and calendar.

   New module (no existing source in easylearnv3 / isf-api). Data shapes follow
   the EasyLearn sticky_notes + manage_calendar conventions so it can be backed
   by the same tables later.

   ⚠️ DEMO MODE — no backend endpoints yet. Each function keeps the same async
   signature a real call would have; replace the body with the commented
   endpoint above it when wired in. The page
   (pages/organizer/OrganizerView.jsx) does not need any change.
   Data is per browser. Reset: localStorage.removeItem('easyreach_organizer_store_v1')
   ───────────────────────────────────────────────────────────────────────────── */

export const NOTE_COLORS = {
  yellow: { bg: '#FEF9C3', border: '#FDE68A', ink: '#713F12' },
  green: { bg: '#DCFCE7', border: '#BBF7D0', ink: '#14532D' },
  blue: { bg: '#DBEAFE', border: '#BFDBFE', ink: '#1E3A8A' },
  pink: { bg: '#FCE7F3', border: '#FBCFE8', ink: '#831843' },
  purple: { bg: '#EDE9FE', border: '#DDD6FE', ink: '#4C1D95' },
  grey: { bg: '#F2F2EE', border: '#D5D5CE', ink: '#1A1A18' },
}

export const TASK_PRIORITY = {
  high: { label: 'High', color: '#B5322A', bg: '#FDEEEC', border: '#F6C3BE', icon: 'ti-flag-3', rank: 3 },
  medium: { label: 'Medium', color: '#8A6816', bg: '#FBF3E0', border: '#E7D39C', icon: 'ti-flag-2', rank: 2 },
  low: { label: 'Low', color: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC', icon: 'ti-flag', rank: 1 },
}

export const TASK_LISTS = ['Work', 'Personal', 'Follow-ups', 'Deployments']

export const EVENT_KINDS = {
  meeting: { label: 'Meeting', color: '#2563EB', icon: 'ti-users' },
  deadline: { label: 'Deadline', color: '#DC2626', icon: 'ti-alarm' },
  visit: { label: 'Site visit', color: '#059669', icon: 'ti-map-pin' },
  reminder: { label: 'Reminder', color: '#D97706', icon: 'ti-bell' },
  personal: { label: 'Personal', color: '#7C3AED', icon: 'ti-heart' },
}

export const ymd = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
const dayOffset = (n) => ymd(new Date(Date.now() + n * 86400000))

const seed = () => ({
  notes: [
    { id: 'n1', title: 'MBSE server checklist', body: 'Check rclone sync logs\nVerify Nginx cert renewal\nConfirm IIS proxy is forwarding /media', color: 'yellow', pinned: true, updatedAt: new Date(Date.now() - 3600e3).toISOString() },
    { id: 'n2', title: 'Ideas — Infra landing', body: 'Add customer logos strip, short demo video, pricing teaser.', color: 'blue', pinned: false, updatedAt: new Date(Date.now() - 86400e3).toISOString() },
    { id: 'n3', title: 'Call notes — PCU', body: 'Wants DRM for engineering eBooks. Send proposal by Friday.', color: 'green', pinned: true, updatedAt: new Date(Date.now() - 2 * 86400e3).toISOString() },
    { id: 'n4', title: 'Groceries', body: 'Milk, bread, coffee', color: 'pink', pinned: false, updatedAt: new Date(Date.now() - 4 * 86400e3).toISOString() },
  ],
  tasks: [
    { id: 't1', title: 'Push Infra modules to main', list: 'Deployments', priority: 'high', due: dayOffset(0), done: false, createdAt: new Date().toISOString() },
    { id: 't2', title: 'Send DRM proposal to PCU', list: 'Follow-ups', priority: 'high', due: dayOffset(1), done: false, createdAt: new Date().toISOString() },
    { id: 't3', title: 'Review VAPT report with Tapan sir', list: 'Work', priority: 'medium', due: dayOffset(2), done: false, createdAt: new Date().toISOString() },
    { id: 't4', title: 'Renew domain — infrapoint.co.in', list: 'Work', priority: 'medium', due: dayOffset(-1), done: false, createdAt: new Date().toISOString() },
    { id: 't5', title: 'Update timesheet', list: 'Personal', priority: 'low', due: dayOffset(4), done: false, createdAt: new Date().toISOString() },
    { id: 't6', title: 'Fix license usage chart', list: 'Work', priority: 'medium', due: dayOffset(-2), done: true, createdAt: new Date().toISOString() },
  ],
  events: [
    { id: 'e1', title: 'Weekly tech sync', kind: 'meeting', date: dayOffset(0), start: '11:00', end: '11:45', location: 'ISF Office' },
    { id: 'e2', title: 'MBSE on-premise visit', kind: 'visit', date: dayOffset(2), start: '10:00', end: '13:00', location: 'MBSE School' },
    { id: 'e3', title: 'Signage demo — MET Nashik', kind: 'meeting', date: dayOffset(5), start: '15:00', end: '16:00', location: 'Google Meet' },
    { id: 'e4', title: 'Q3 invoices due', kind: 'deadline', date: dayOffset(8), start: '', end: '', location: '' },
    { id: 'e5', title: 'Backup verification', kind: 'reminder', date: dayOffset(-3), start: '18:00', end: '', location: '' },
  ],
})

const store = createStore('easyreach_organizer_store_v1', seed)
const S = () => store.get()
const quick = () => latency(120, 260)

/* ── Today ── */
// GET /organizer/today
export const getToday = async () => {
  await quick()
  const s = S()
  const today = ymd(new Date())
  const open = s.tasks.filter(t => !t.done)
  return {
    date: today,
    events: s.events.filter(e => e.date === today).sort((a, b) => (a.start || '99').localeCompare(b.start || '99')),
    upcoming: s.events.filter(e => e.date > today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    dueToday: open.filter(t => t.due === today),
    overdue: open.filter(t => t.due && t.due < today),
    openTasks: open.length,
    doneTasks: s.tasks.filter(t => t.done).length,
    pinned: s.notes.filter(n => n.pinned),
    notes: s.notes.length,
  }
}

/* ── Notes ── */
// GET /organizer/notes
export const getNotes = async () => { await quick(); return clone(S().notes).sort((a, b) => (b.pinned - a.pinned) || b.updatedAt.localeCompare(a.updatedAt)) }
// POST /organizer/notes
export const saveNote = async (note) => {
  await quick()
  const n = { ...note, updatedAt: new Date().toISOString() }
  store.set(s => {
    if (n.id) { const i = s.notes.findIndex(x => x.id === n.id); if (i >= 0) s.notes[i] = n; else s.notes.unshift(n) }
    else { n.id = uid('n'); s.notes.unshift(n) }
  })
  return clone(n)
}
// DELETE /organizer/notes/{id}
export const deleteNote = async (id) => { await quick(); store.set(s => { s.notes = s.notes.filter(n => n.id !== id) }); return { ok: true } }

/* ── Tasks ── */
// GET /organizer/tasks
export const getTasks = async () => { await quick(); return clone(S().tasks) }
// POST /organizer/tasks
export const saveTask = async (task) => {
  await quick()
  const t = { done: false, createdAt: new Date().toISOString(), ...task }
  store.set(s => {
    if (t.id) { const i = s.tasks.findIndex(x => x.id === t.id); if (i >= 0) s.tasks[i] = t; else s.tasks.push(t) }
    else { t.id = uid('t'); s.tasks.push(t) }
  })
  return clone(t)
}
// PATCH /organizer/tasks/{id}   { done }
export const toggleTask = async (id) => {
  await quick()
  let t
  store.set(s => { t = s.tasks.find(x => x.id === id); t.done = !t.done })
  return clone(t)
}
// DELETE /organizer/tasks/{id}
export const deleteTask = async (id) => { await quick(); store.set(s => { s.tasks = s.tasks.filter(t => t.id !== id) }); return { ok: true } }
// DELETE /organizer/tasks/completed
export const clearCompleted = async () => { await quick(); let n = 0; store.set(s => { n = s.tasks.filter(t => t.done).length; s.tasks = s.tasks.filter(t => !t.done) }); return { removed: n } }

/* ── Calendar ── */
// GET /organizer/events?month=YYYY-MM
export const getEvents = async (month) => { await quick(); return clone(S().events.filter(e => !month || e.date.startsWith(month))) }
// POST /organizer/events
export const saveEvent = async (ev) => {
  await quick()
  const e = { ...ev }
  store.set(s => {
    if (e.id) { const i = s.events.findIndex(x => x.id === e.id); if (i >= 0) s.events[i] = e; else s.events.push(e) }
    else { e.id = uid('e'); s.events.push(e) }
  })
  return clone(e)
}
// DELETE /organizer/events/{id}
export const deleteEvent = async (id) => { await quick(); store.set(s => { s.events = s.events.filter(e => e.id !== id) }); return { ok: true } }
