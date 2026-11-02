import api from './axios'
import { toCsvBlob } from './mdmDemoStore'
/* ─────────────────────────────────────────────────────────────────────────────
   Policy Management API layer — LIVE (EasyReach backend /easyreach/mdm/policies).
   Function names/return shapes are the same as the old demo layer, so
   PolicyManagementView.jsx barely changes. Backend wraps lists/items in
   { data: ... } — unwrapped here.
   Push now targets real institutions: every Windows PC (agent installed) in
   the selected schools gets an APPLY_POLICY command; rollout progress comes
   from the agents' results.
   ───────────────────────────────────────────────────────────────────────────── */
export const DEFAULT_SETTINGS = () => ({
  restrictions: { camera: true, usbStorage: true, bluetooth: true, screenshot: true, factoryReset: false, unknownSources: false, developerOptions: false, hotspot: false },
  security: { screenLock: true, pinLength: 4, autoLockMins: 5, maxFailedAttempts: 10, encryptExternal: false },
  network: { wifiFencing: false, ssids: [], alertOnMismatch: true },
  timeFencing: { enabled: false, start: '08:00', end: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], afterHours: 'alert' },
  geofence: { enabled: false, radiusM: 100, intervalMins: 15 },
  updates: { osWindow: '22:00–05:00', autoUpdateApps: true },
})

const B = '/easyreach/mdm/policies'
const d = (res) => res.data?.data ?? res.data

// GET /easyreach/mdm/policies/summary
export const getPolicySummary = async () => (await api.get(`${B}/summary`)).data

// GET /easyreach/mdm/policies/targets  → [{ id, name, devices }]  (devices = real Windows PCs with agent)
export const getPolicyTargets = async () => d(await api.get(`${B}/targets`))

// GET /easyreach/mdm/policies
export const getPolicies = async () => d(await api.get(B))

// POST /easyreach/mdm/policies   |   PUT /easyreach/mdm/policies/{id}
export const savePolicy = async (policy) => {
  const body = { name: policy.name, desc: policy.desc, platform: policy.platform, settings: policy.settings }
  return d(policy.id ? await api.put(`${B}/${policy.id}`, body) : await api.post(B, body))
}

// POST /easyreach/mdm/policies/{id}/duplicate
export const duplicatePolicy = async (id) => d(await api.post(`${B}/${id}/duplicate`))

// DELETE /easyreach/mdm/policies/{id}
export const deletePolicy = async (id) => (await api.delete(`${B}/${id}`)).data

// POST /easyreach/mdm/policies/{id}/push   { targetLabel, deviceCount, schedule, institution_ids }
export const pushPolicy = async (id, { targetLabel, deviceCount, schedule = 'now', institutionIds }) =>
  d(await api.post(`${B}/${id}/push`, { targetLabel, deviceCount, schedule, institution_ids: institutionIds }))

// GET /easyreach/mdm/policies/rollouts
export const getRollouts = async () => d(await api.get(`${B}/rollouts`))

// POST /easyreach/mdm/policies/rollouts/{id}/retry
export const retryRollout = async (id) => (await api.post(`${B}/rollouts/${id}/retry`)).data

// GET /easyreach/mdm/policies/compliance
export const getViolations = async () => d(await api.get(`${B}/compliance`))

// POST /easyreach/mdm/policies/compliance/{id}/remediate   { action: 'repush' | 'lock' }
export const remediate = async (violationId, action) =>
  (await api.post(`${B}/compliance/${violationId}/remediate`, { action })).data

// GET /easyreach/mdm/policies/audit
export const getAuditLog = async () => d(await api.get(`${B}/audit`))

// Compliance CSV — built in the browser from the live violation list
export const exportCompliance = async () => {
  const rows = await getViolations()
  return toCsvBlob(['Device', 'Institution', 'Policy', 'Issue', 'Severity', 'Detected at'],
    rows.map(v => [v.device, v.school, v.policy, v.reason, v.severity, new Date(v.at).toLocaleString('en-IN')]))
}
