// src/api/serviceDesk.js
// NOTE: API_BASE must be the same backend base URL that src/api/auth.js uses
// (the DigitalOcean URL that ends with /easyreach).
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://dolphin-app-33jp4.ondigitalocean.app/easyreach'

async function request(path, token, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  })
  if (!res.ok) {
    let msg = 'Something went wrong. Please try again.'
    try {
      const j = await res.json()
      if (typeof j.detail === 'string') msg = j.detail
      else if (Array.isArray(j.detail)) msg = j.detail.map((d) => d.msg).join(', ')
    } catch { /* keep default message */ }
    throw new Error(msg)
  }
  return res
}

// JSON body helper (POST / DELETE with payload)
const sendJson = async (path, token, method, body) =>
  (await request(path, token, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })).json()

// ?a=1&b=2 — skips empty values
const qs = (obj = {}) => {
  const p = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v != null) p.set(k, v) })
  const s = p.toString()
  return s ? `?${s}` : ''
}

/* ───────────── Requester ───────────── */
export const getDepartments = async (token) => (await request('/service-desk/departments', token)).json()

export const getMyTickets = async (token) => (await request('/service-desk/my-tickets', token)).json()

export const getAttachments = async (token, ticketId) =>
  (await request(`/service-desk/tickets/${ticketId}/attachments`, token)).json()

export const raiseTicket = async (token, { departmentId, subject, description, priority, files }) => {
  const fd = new FormData()
  fd.append('target_department_id', departmentId)
  fd.append('subject', subject)
  fd.append('description', description)
  fd.append('priority', priority)
  files.forEach((f) => fd.append('attachments', f))
  return (await request('/service-desk/tickets', token, { method: 'POST', body: fd })).json()
}

// Files sit behind auth, so fetch them as a blob and hand back an object URL.
export const getAttachmentBlobUrl = async (token, attachmentId) => {
  const blob = await (await request(`/service-desk/attachments/${attachmentId}/download`, token)).blob()
  return URL.createObjectURL(blob)
}

/* ───────────── Admin (head of all departments) / Master ───────────── */
export const getAllTickets = async (token, filters = {}) =>
  (await request(`/service-desk/tickets${qs(filters)}`, token)).json()

export const getStats = async (token) => (await request('/service-desk/stats', token)).json()

export const getTicketDetail = async (token, ticketId) =>
  (await request(`/service-desk/tickets/${ticketId}`, token)).json()

export const assignTicket = (token, ticketId, staffId, remarks = '') =>
  sendJson(`/service-desk/tickets/${ticketId}/assign`, token, 'POST', { staff_id: Number(staffId), remarks })

export const verifyTicket = (token, ticketId, approve, remarks = '') =>
  sendJson(`/service-desk/tickets/${ticketId}/verify`, token, 'POST', { approve: !!approve, remarks })

/* Staff management */
export const getStaff = async (token) => (await request('/service-desk/staff', token)).json()

export const addStaff = (token, { departmentId, name, email, password }) =>
  sendJson('/service-desk/staff', token, 'POST', { departmentId: Number(departmentId), name, email, password })

export const removeStaff = (token, memberId) =>
  sendJson(`/service-desk/staff/${memberId}`, token, 'DELETE')

/* ───────────── Service Desk staff ───────────── */
export const getMyTasks = async (token) => (await request('/service-desk/my-tasks', token)).json()

export const getMyDepartment = async (token) => (await request('/service-desk/my-department', token)).json()

export const completeTicket = (token, ticketId, remarks = '') =>
  sendJson(`/service-desk/tickets/${ticketId}/complete`, token, 'POST', { remarks })