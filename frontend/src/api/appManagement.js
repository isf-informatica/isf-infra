import api from './axios'
import { getAllSchools } from './schools'

/* ─────────────────────────────────────────────────────────────────────────────
   App Management API layer — LIVE (EasyReach backend /easyreach/mdm/...).

   Real devices = Windows PCs with the EasyReach PC agent:
     • Inventory — agents report installed programs (registry) on "Sync"
     • Blacklist rules — pushed to PCs right away; the agent stops a blocked
       app within ~5 s and (for "Block + silent uninstall") removes it when the
       program has a silent uninstaller (MSI / QuietUninstallString)
     • Push apps — EXE / MSI uploaded to InfraPoint, each PC downloads it,
       checks SHA-256 and installs silently; results update the deployment
     • Usage — agents report how long each app was running (working / off hours)
   Android (APK) has no agent yet: those deployments reach 0 devices.
   Same function names/shapes as the old demo layer.
   ───────────────────────────────────────────────────────────────────────────── */

const FALLBACK_SCHOOLS = [
  { id: 1, name: 'MBSE School' },
  { id: 2, name: 'Pimpri Chinchwad University' },
  { id: 3, name: 'MET School Nashik' },
]

const B = '/easyreach/mdm'
const d = (res) => res.data?.data ?? res.data
const fail = (e, msg) => new Error(e?.response?.data?.detail || msg, { cause: e })

/* ── Institutions (also used by Signage / Content / DRM pages) ── */
// GET /easyreach/schools/
export const getInstitutions = async () => {
  try {
    const data = await getAllSchools()
    if (Array.isArray(data) && data.length) return data.map(s => ({ id: s.id, name: s.name }))
  } catch { /* fall back */ }
  return FALLBACK_SCHOOLS
}

// GET /easyreach/mdm/apps/targets  → [{ id, name, devices }]  (real Windows PCs with agent)
export const getAppTargets = async () => d(await api.get(`${B}/apps/targets`))

/* ── Overview ── */
// GET /easyreach/mdm/apps/summary
export const getAppSummary = async () => (await api.get(`${B}/apps/summary`)).data

/* ── Inventory ── */
// GET /easyreach/mdm/apps
export const getAppInventory = async () => d(await api.get(`${B}/apps`))

// POST /easyreach/mdm/apps/sync   → every PC agent re-reports installed apps (within ~30 s if online)
export const syncInventory = async () => {
  try { return (await api.post(`${B}/apps/sync`)).data } catch (e) { throw fail(e, 'Could not request inventory') }
}

// PATCH /easyreach/mdm/apps/{id}/status   { status: 'allowed' | 'blocked' | 'review' }
export const setAppStatus = async (appId, status) => {
  try { return (await api.patch(`${B}/apps/${appId}/status`, { status })).data } catch (e) { throw fail(e, 'Could not change app status') }
}

/* ── Blacklist / Whitelist rules ── */
// GET /easyreach/mdm/app-rules  → { mode, rules }
export const getAppRules = async () => d(await api.get(`${B}/app-rules`))

// PUT /easyreach/mdm/app-rules/mode   { mode: 'blacklist' | 'whitelist' }
export const setEnforcementMode = async (mode) => {
  try { return (await api.put(`${B}/app-rules/mode`, { mode })).data } catch (e) { throw fail(e, 'Could not change mode') }
}

// POST /easyreach/mdm/app-rules
export const createAppRule = async (rule) => {
  try { return d(await api.post(`${B}/app-rules`, rule)) } catch (e) { throw fail(e, 'Could not save rule') }
}

// DELETE /easyreach/mdm/app-rules/{id}
export const deleteAppRule = async (ruleId) => (await api.delete(`${B}/app-rules/${ruleId}`)).data

/* ── Violations / alerts ── */
// GET /easyreach/mdm/app-violations
export const getViolations = async () => d(await api.get(`${B}/app-violations`))

/* ── Push / deploy custom apps ── */
// GET /easyreach/mdm/app-deployments
export const getDeployments = async () => d(await api.get(`${B}/app-deployments`))

// POST /easyreach/mdm/app-packages   (multipart upload, real progress)   onProgress(0..100)
export const uploadPackage = async (file, onProgress) => {
  const fd = new FormData()
  fd.append('file', file)
  try {
    return (await api.post(`${B}/app-packages`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (ev) => { if (ev.total) onProgress?.(Math.min(99, Math.round((ev.loaded / ev.total) * 100))) },
    })).data
  } catch (e) { throw fail(e, 'Upload failed') } finally { onProgress?.(100) }
}

// POST /easyreach/mdm/app-deployments
export const createDeployment = async (payload) => {
  try { return d(await api.post(`${B}/app-deployments`, payload)) } catch (e) { throw fail(e, 'Could not start deployment') }
}

// POST /easyreach/mdm/app-deployments/{id}/retry   (failed PCs get the install again)
export const retryDeployment = async (depId) => d(await api.post(`${B}/app-deployments/${depId}/retry`))

/* ── Usage analytics ── */
// GET /easyreach/mdm/app-usage?period=daily|monthly|yearly&school_id=
export const getAppUsage = async (period = 'daily', schoolId = 'all') =>
  d(await api.get(`${B}/app-usage`, { params: { period, school_id: schoolId === 'all' ? undefined : schoolId } }))

// CSV built in the browser from the rows on screen
export const exportUsageReport = async (rows) => {
  const header = ['App', 'Platform', 'Devices', 'Working hours (hrs)', 'Non-working hours (hrs)', 'Total (hrs)', 'Off-hours %']
  const lines = rows.map(r => {
    const t = r.workingHrs + r.offHrs
    return [r.name, r.platform, r.devices, r.workingHrs, r.offHrs, +t.toFixed(1), t ? ((r.offHrs / t) * 100).toFixed(1) : 0]
  })
  const csv = [header, ...lines].map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  return new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
}
