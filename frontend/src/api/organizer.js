import api from './axios'

/* ─────────────────────────────────────────────────────────────────────────────
   Digital Organizer API layer — LIVE (EasyReach backend /easyreach/organizer).
   Personal notes, tasks and calendar — private per login (server filters by
   owner), so the same data shows on every device you sign in from.
   Same function names/shapes as the old demo layer; OrganizerView.jsx unchanged.
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

const B = '/easyreach/organizer'
const d = (res) => res.data?.data ?? res.data
const fail = (e, msg) => new Error(e?.response?.data?.detail || msg, { cause: e })

/* ── Today ── */
// GET /easyreach/organizer/today?date=YYYY-MM-DD   (browser's local date, not server UTC)
export const getToday = async () => (await api.get(`${B}/today`, { params: { date: ymd(new Date()) } })).data

/* ── Notes ── */
// GET /easyreach/organizer/notes
export const getNotes = async () => d(await api.get(`${B}/notes`))
// POST /easyreach/organizer/notes   (id present = update)
export const saveNote = async (note) => {
  try { return d(await api.post(`${B}/notes`, note)) } catch (e) { throw fail(e, 'Could not save note') }
}
// DELETE /easyreach/organizer/notes/{id}
export const deleteNote = async (id) => (await api.delete(`${B}/notes/${id}`)).data

/* ── Tasks ── */
// GET /easyreach/organizer/tasks
export const getTasks = async () => d(await api.get(`${B}/tasks`))
// POST /easyreach/organizer/tasks   (id present = update)
export const saveTask = async (task) => {
  try { return d(await api.post(`${B}/tasks`, { ...task, due: task.due || null })) } catch (e) { throw fail(e, 'Could not save task') }
}
// POST /easyreach/organizer/tasks/{id}/toggle
export const toggleTask = async (id) => d(await api.post(`${B}/tasks/${id}/toggle`))
// DELETE /easyreach/organizer/tasks/{id}
export const deleteTask = async (id) => (await api.delete(`${B}/tasks/${id}`)).data
// POST /easyreach/organizer/tasks/clear-completed
export const clearCompleted = async () => (await api.post(`${B}/tasks/clear-completed`)).data

/* ── Calendar ── */
// GET /easyreach/organizer/events?month=YYYY-MM
export const getEvents = async (month) => d(await api.get(`${B}/events`, { params: { month: month || undefined } }))
// POST /easyreach/organizer/events   (id present = update)
export const saveEvent = async (ev) => {
  try { return d(await api.post(`${B}/events`, ev)) } catch (e) { throw fail(e, 'Could not save event') }
}
// DELETE /easyreach/organizer/events/{id}
export const deleteEvent = async (id) => (await api.delete(`${B}/events/${id}`)).data
