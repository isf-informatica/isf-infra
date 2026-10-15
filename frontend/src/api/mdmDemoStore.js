/* ─────────────────────────────────────────────────────────────────────────────
   Shared helpers for MDM demo-mode API files
   (policyManagement.js, contentPublishing.js, secureBrowser.js).

   ⚠️ DEMO MODE — these modules have no backend endpoints yet. Each API file
   keeps the same async signature a real axios call would have, so the pages
   do not change when the real endpoints are wired in.
   ───────────────────────────────────────────────────────────────────────────── */

export const latency = (min = 350, max = 900) =>
  new Promise(r => setTimeout(r, min + Math.random() * (max - min)))

export const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const minsAgo = (m) => new Date(Date.now() - m * 60000).toISOString()

export const clone = (x) => JSON.parse(JSON.stringify(x))

export const currentUser = () => {
  try { return JSON.parse(localStorage.getItem('user'))?.name || 'Admin' } catch { return 'Admin' }
}

/* Persistent store per module — survives refresh during a demo.
   Reset from browser console: localStorage.removeItem('<key>') */
export function createStore(key, seedFn) {
  let state
  try {
    const raw = localStorage.getItem(key)
    state = raw ? JSON.parse(raw) : seedFn()
  } catch {
    state = seedFn()
  }
  return {
    get: () => state,
    set: (fn) => { fn(state); try { localStorage.setItem(key, JSON.stringify(state)) } catch {} },
  }
}

/* Simulates device agents reporting back on a rollout (policy push, content
   publish, browser config push). Mutates rollout objects in place.
   A rollout = { total, done, failed, pending, status, startedAt } */
export function tickRollouts(list, onComplete) {
  let changed = false
  list.forEach(r => {
    if (r.status !== 'running') return
    const elapsed = (Date.now() - new Date(r.startedAt).getTime()) / 1000
    if (elapsed < 2) return
    const batch = Math.max(1, Math.ceil(r.total * (0.05 + Math.random() * 0.09)))
    const n = Math.min(r.pending, batch)
    const fails = Math.random() < 0.15 && n > 2 ? 1 : 0
    r.done += n - fails
    r.failed += fails
    r.pending -= n
    if (r.pending <= 0) { r.status = 'completed'; onComplete?.(r) }
    changed = true
  })
  return changed
}

// Approximate enrolled-device counts per institution for target sizing.
export const deviceCountFor = (inst) => 40 + ((String(inst.name).length * 37 + Number(inst.id || 1) * 13) % 160)

export const toCsvBlob = (header, rows) => {
  const csv = [header, ...rows].map(l => l.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  return new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
}
