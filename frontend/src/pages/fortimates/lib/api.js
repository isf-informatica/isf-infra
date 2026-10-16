/* ─────────────────────────────────────────────────────────────────────────────
   FortiMates — API helper (DEMO STUB).

   ⚠️ The original FortiMates developer keeps the real lib/api.js on their own
   machine; it was git-ignored (the repo's .gitignore has a `lib/` rule) and so
   never reached GitHub, which broke the build for everyone else.

   This file is a self-contained DEMO replacement that serves the mock data in
   ./data/mockData.js so FortiMates builds and renders without a backend. When
   the real backend is wired, replace this file with the production version that
   calls FM_API_BASE (see ../config.js). The widgets already null-guard every
   field, so unmatched paths safely return empty data.
   ───────────────────────────────────────────────────────────────────────────── */

import {
  requestsQueue, kycList, callTracker, adminUsers, mailLog, mailTracker, mailSplit,
} from '../data/mockData.js'

const delay = (ms = 350) => new Promise(r => setTimeout(r, ms + Math.random() * 300))

// Build the mail list shape the tables expect, derived from mockData.
const mails = (limit = 300) => mailLog.slice(0, limit).map((m, i) => ({
  ...m, subject: mailTracker[i % mailTracker.length]?.subject || 'Notification',
  status: mailTracker[i % mailTracker.length]?.status || 'Delivered',
  risk: mailTracker[i % mailTracker.length]?.risk || 'Low',
}))

// GET — matched by path against the demo dataset.
export async function apiGet(path = '') {
  await delay(200)
  const p = String(path)
  if (p.startsWith('/admins')) return adminUsers
  if (p.startsWith('/calls')) return callTracker
  if (p.startsWith('/kyc')) return kycList
  if (p.startsWith('/mails/sync-status')) return { syncing: false, last_sync: new Date().toISOString() }
  if (p.startsWith('/mails/stats')) return { split: mailSplit, total: mailLog.length }
  if (p.startsWith('/mails')) {
    const limit = Number((p.match(/limit=(\d+)/) || [])[1]) || 300
    return mails(limit)
  }
  if (p.match(/^\/requests\/.+/)) {
    const r = requestsQueue[0]
    return { ...r, id: p.split('/').pop(), status: 'pending', documents: [], notes: '' }
  }
  if (p.startsWith('/requests')) return requestsQueue.map((r, i) => ({ id: `req_${i + 1}`, status: 'pending', ...r }))
  if (p.startsWith('/settings')) return { company: 'FortiMates', currency: 'INR', kyc_required: true }
  return []
}

// Writes — resolve as a no-op success in demo mode.
export async function apiPost(_path, body) { await delay(400); return { ok: true, id: `demo_${Date.now()}`, ...(body || {}) } }
export async function apiPut(_path, body) { await delay(400); return { ok: true, ...(body || {}) } }
export async function apiDelete() { await delay(300); return { ok: true } }

// Upload — pretend-upload a file and return a demo URL.
export async function apiUpload(_path, file, onProgress) {
  for (let p = 0; p <= 100; p += 20) { await delay(120); onProgress?.(p) }
  return { ok: true, url: `demo://uploads/${file?.name || 'file'}`, name: file?.name || 'file' }
}

// Open a protected file — in demo mode just open a blank tab.
export function openProtectedFile(url) {
  try { window.open(url?.startsWith('http') ? url : 'about:blank', '_blank', 'noopener') } catch { /* ignore */ }
}

export default { apiGet, apiPost, apiPut, apiDelete, apiUpload, openProtectedFile }
