/* ─────────────────────────────────────────────────────────────────────────────
   FortiMates — API helper (LIVE).

   Wired to the ISF Infra backend FortiMates module at /easyreach/fortimates/*.
   Uses the shared axios instance (carries the ISF JWT + base URL), so every
   FortiMates call is authenticated the same way as the rest of the app.
   ───────────────────────────────────────────────────────────────────────────── */

import api from '../../../api/axios'

const FM = '/easyreach/fortimates'

// GET — path is relative to the FortiMates backend, e.g. '/admins', '/mails?limit=300'
export async function apiGet(path = '') {
  const res = await api.get(FM + String(path))
  return res.data
}

// POST — '/auth/login' is special-cased onto the ISF auth so the FortiMates
// login page actually signs the user in; everything else hits the FM backend.
export async function apiPost(path, body) {
  const p = String(path)
  if (p === '/auth/login') {
    const params = new URLSearchParams()
    params.append('username', body?.email || '')
    params.append('password', body?.pass || body?.password || '')
    const res = await api.post('/easyreach/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    if (res.data?.access_token) localStorage.setItem('token', res.data.access_token)
    return { ok: true, data: { user: { email: body?.email || '' } } }
  }
  const res = await api.post(FM + p, body)
  return res.data
}

export async function apiPut(path, body) {
  const res = await api.put(FM + String(path), body)
  return res.data
}

export async function apiDelete(path) {
  const res = await api.delete(FM + String(path))
  return res.data
}

// Upload — multipart; field name 'file'. Extra fields in `fields` are appended.
export async function apiUpload(path, file, onProgress, fields) {
  const fd = new FormData()
  fd.append('file', file)
  if (fields) Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
  const res = await api.post(FM + String(path), fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100)) },
  })
  return res.data
}

// Open a protected file — fetch with auth (JWT) then open the blob in a new tab.
export async function openProtectedFile(path) {
  try {
    const res = await api.get(FM + String(path), { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (e) {
    console.error('openProtectedFile failed', e)
  }
}

export default { apiGet, apiPost, apiPut, apiDelete, apiUpload, openProtectedFile }
