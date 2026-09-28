// src/api/license.js
// Same pattern as ../api/auth.js — talks to the FastAPI router mounted at /easyreach.
import useAuthStore from '../store/authStore'

const BASE = 'https://dolphin-app-33jp4.ondigitalocean.app/easyreach'

function authHeaders() {
  // Login.jsx calls setAuth({...}, access_token) — the store may expose the
  // token as `token` or `accessToken` depending on how authStore.js was written.
  // This covers both, plus a localStorage fallback, so nothing breaks either way.
  const state = typeof useAuthStore.getState === 'function' ? useAuthStore.getState() : {}
  const token = state.token || state.accessToken || localStorage.getItem('easyreach_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body.detail || message
    } catch { /* no json body */ }
    throw new Error(message)
  }
  if (res.status === 204) return null
  return res.json()
}

export const getLicenseStats  = () => request('/licenses/stats')
export const getLicenses      = () => request('/licenses/')
export const getLicense       = (id) => request(`/licenses/${id}`)
export const createLicense    = (data) => request('/licenses/', { method: 'POST', body: JSON.stringify(data) })
export const updateLicense    = (id, data) => request(`/licenses/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteLicense    = (id) => request(`/licenses/${id}`, { method: 'DELETE' })
export const assignLicense    = (id, schoolId) => request(`/licenses/${id}/assign`, { method: 'POST', body: JSON.stringify({ school_id: schoolId }) })
export const unassignLicenseCompat = (id) => request(`/licenses/${id}/unassign`, { method: 'POST' })
export const getUsageLogs     = () => request('/licenses/usage/logs')
export const getViolations    = () => request('/licenses/violations/')
export const resolveViolation = (id, remarks) => request(`/licenses/violations/${id}/resolve`, { method: 'POST', body: JSON.stringify({ remarks }) })
export const getSchoolsList   = () => request('/schools/')