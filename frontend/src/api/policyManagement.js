import { latency, uid, minsAgo, clone, currentUser, createStore, tickRollouts, toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Policy Management API layer.

   ⚠️ DEMO MODE — backend endpoints do not exist yet. Replace each function body
   with the commented `api.*` call above it when the backend is ready; the page
   (PolicyManagementView.jsx) does not need any change.
   Reset demo data: localStorage.removeItem('easyreach_policy_store_v1')
   ───────────────────────────────────────────────────────────────────────────── */

export const DEFAULT_SETTINGS = () => ({
  restrictions: { camera: true, usbStorage: true, bluetooth: true, screenshot: true, factoryReset: false, unknownSources: false, developerOptions: false, hotspot: false },
  security: { screenLock: true, pinLength: 4, autoLockMins: 5, maxFailedAttempts: 10, encryptExternal: false },
  network: { wifiFencing: false, ssids: [], alertOnMismatch: true },
  timeFencing: { enabled: false, start: '08:00', end: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], afterHours: 'alert' },
  geofence: { enabled: false, radiusM: 100, intervalMins: 15 },
  updates: { osWindow: '22:00–05:00', autoUpdateApps: true },
})

const seed = () => {
  const classroom = DEFAULT_SETTINGS()
  classroom.restrictions = { ...classroom.restrictions, camera: true, usbStorage: false, factoryReset: false, unknownSources: false }
  classroom.network = { wifiFencing: true, ssids: ['iDream', 'iDream_5G'], alertOnMismatch: true }
  classroom.timeFencing = { ...classroom.timeFencing, enabled: true, afterHours: 'alert' }
  classroom.geofence = { enabled: true, radiusM: 100, intervalMins: 15 }

  const exam = DEFAULT_SETTINGS()
  exam.restrictions = { camera: false, usbStorage: false, bluetooth: false, screenshot: false, factoryReset: false, unknownSources: false, developerOptions: false, hotspot: false }
  exam.security = { screenLock: true, pinLength: 6, autoLockMins: 2, maxFailedAttempts: 5, encryptExternal: true }
  exam.network = { wifiFencing: true, ssids: ['EXAM_LAB_SECURE'], alertOnMismatch: true }
  exam.timeFencing = { enabled: true, start: '09:00', end: '13:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], afterHours: 'lock' }

  const teacher = DEFAULT_SETTINGS()
  teacher.restrictions = { ...teacher.restrictions, usbStorage: true, hotspot: true }
  teacher.security = { ...teacher.security, encryptExternal: true }

  const panel = DEFAULT_SETTINGS()
  panel.restrictions = { ...panel.restrictions, camera: false, bluetooth: false, usbStorage: true }
  panel.timeFencing = { ...panel.timeFencing, enabled: true, afterHours: 'lock' }

  return {
    policies: [
      { id: 'pol_01', name: 'Classroom Tablet — Standard', desc: 'Default policy for student tablets in classrooms', platform: 'android', version: 7, status: 'active', targets: 'All institutions', devices: 412, compliant: 398, updatedAt: minsAgo(60 * 30), updatedBy: 'Yash', settings: classroom },
      { id: 'pol_02', name: 'Exam Lab Lockdown', desc: 'Maximum restriction during exams — camera, Bluetooth & USB off', platform: 'android', version: 3, status: 'active', targets: 'MBSE School', devices: 64, compliant: 64, updatedAt: minsAgo(60 * 50), updatedBy: 'Shyam', settings: exam },
      { id: 'pol_03', name: 'Interactive Panel (IFP)', desc: 'Smart boards — locked after school hours', platform: 'android', version: 4, status: 'active', targets: 'Pimpri Chinchwad University +1', devices: 58, compliant: 53, updatedAt: minsAgo(60 * 76), updatedBy: 'Yash', settings: panel },
      { id: 'pol_04', name: 'Teacher Laptop', desc: 'Windows laptops — USB allowed, storage encrypted', platform: 'windows', version: 2, status: 'active', targets: 'All institutions', devices: 96, compliant: 91, updatedAt: minsAgo(60 * 120), updatedBy: 'Shyam', settings: teacher },
      { id: 'pol_05', name: 'Lab PCs — Summer Camp', desc: 'Draft — relaxed restrictions for vacation programme', platform: 'windows', version: 1, status: 'draft', targets: '—', devices: 0, compliant: 0, updatedAt: minsAgo(60 * 5), updatedBy: 'Yash', settings: DEFAULT_SETTINGS() },
    ],
    rollouts: [
      { id: 'ro_01', policyId: 'pol_01', policy: 'Classroom Tablet — Standard', version: 7, target: 'All institutions', total: 412, done: 409, failed: 3, pending: 0, status: 'completed', startedAt: minsAgo(60 * 30), by: 'Yash' },
      { id: 'ro_02', policyId: 'pol_02', policy: 'Exam Lab Lockdown', version: 3, target: 'MBSE School', total: 64, done: 64, failed: 0, pending: 0, status: 'completed', startedAt: minsAgo(60 * 50), by: 'Shyam' },
    ],
    violations: [
      { id: 'nc_01', device: 'TAB-CLS8B-022', school: 'MBSE School', policy: 'Classroom Tablet — Standard', reason: 'Connected to unauthorised Wi-Fi "JioFiber-5G"', severity: 'high', at: minsAgo(12) },
      { id: 'nc_02', device: 'IFP-LAB2-04', school: 'Pimpri Chinchwad University', policy: 'Interactive Panel (IFP)', reason: 'Used after working hours (19:42)', severity: 'medium', at: minsAgo(55) },
      { id: 'nc_03', device: 'TAB-CLS9A-011', school: 'MET School Nashik', policy: 'Classroom Tablet — Standard', reason: 'Outside geofence — 412 m from institute', severity: 'high', at: minsAgo(80) },
      { id: 'nc_04', device: 'LT-TCH-0193', school: 'MBSE School', policy: 'Teacher Laptop', reason: 'External drive not encrypted', severity: 'medium', at: minsAgo(140) },
      { id: 'nc_05', device: 'TAB-CLS10C-031', school: 'MBSE School', policy: 'Classroom Tablet — Standard', reason: 'Policy v6 — pending update to v7 (device offline)', severity: 'low', at: minsAgo(300) },
      { id: 'nc_06', device: 'IFP-AUD-01', school: 'MET School Nashik', policy: 'Interactive Panel (IFP)', reason: 'Screen lock disabled by local user', severity: 'high', at: minsAgo(420) },
    ],
    audit: [
      { id: 'au_01', at: minsAgo(60 * 5), by: 'Yash', action: 'Created draft', target: 'Lab PCs — Summer Camp' },
      { id: 'au_02', at: minsAgo(60 * 30), by: 'Yash', action: 'Pushed v7 to All institutions', target: 'Classroom Tablet — Standard' },
      { id: 'au_03', at: minsAgo(60 * 31), by: 'Yash', action: 'Enabled Wi-Fi fencing (iDream, iDream_5G)', target: 'Classroom Tablet — Standard' },
      { id: 'au_04', at: minsAgo(60 * 50), by: 'Shyam', action: 'Pushed v3 to MBSE School', target: 'Exam Lab Lockdown' },
      { id: 'au_05', at: minsAgo(60 * 76), by: 'Yash', action: 'Changed after-hours action to Lock', target: 'Interactive Panel (IFP)' },
    ],
  }
}

const store = createStore('easyreach_policy_store_v1', seed)
const S = () => store.get()

const audit = (action, target) => store.set(s => { s.audit.unshift({ id: uid('au'), at: new Date().toISOString(), by: currentUser(), action, target }) })

// GET /easyreach/mdm/policies/summary
export const getPolicySummary = async () => {
  await latency()
  const active = S().policies.filter(p => p.status === 'active')
  const devices = active.reduce((s, p) => s + p.devices, 0)
  const compliant = active.reduce((s, p) => s + p.compliant, 0)
  return {
    activePolicies: active.length,
    drafts: S().policies.length - active.length,
    devices, compliant,
    compliancePct: devices ? Math.round((compliant / devices) * 1000) / 10 : 100,
    openViolations: S().violations.length,
    running: S().rollouts.filter(r => r.status === 'running').length,
  }
}

// GET /easyreach/mdm/policies
export const getPolicies = async () => { await latency(); return clone(S().policies) }

// POST /easyreach/mdm/policies   |   PUT /easyreach/mdm/policies/{id}
export const savePolicy = async (policy) => {
  await latency(500, 900)
  let saved
  store.set(s => {
    if (policy.id) {
      const p = s.policies.find(x => x.id === policy.id)
      Object.assign(p, { name: policy.name, desc: policy.desc, platform: policy.platform, settings: policy.settings, version: p.version + 1, updatedAt: new Date().toISOString(), updatedBy: currentUser() })
      saved = p
    } else {
      saved = { id: uid('pol'), name: policy.name, desc: policy.desc, platform: policy.platform, version: 1, status: 'draft', targets: '—', devices: 0, compliant: 0, updatedAt: new Date().toISOString(), updatedBy: currentUser(), settings: policy.settings }
      s.policies.unshift(saved)
    }
  })
  audit(policy.id ? `Edited — now v${saved.version}` : 'Created draft', saved.name)
  return clone(saved)
}

// POST /easyreach/mdm/policies/{id}/duplicate
export const duplicatePolicy = async (id) => {
  await latency()
  let copy
  store.set(s => {
    const p = s.policies.find(x => x.id === id)
    copy = { ...clone(p), id: uid('pol'), name: `${p.name} (copy)`, version: 1, status: 'draft', targets: '—', devices: 0, compliant: 0, updatedAt: new Date().toISOString(), updatedBy: currentUser() }
    s.policies.unshift(copy)
  })
  audit('Duplicated', copy.name)
  return clone(copy)
}

// DELETE /easyreach/mdm/policies/{id}   (unenroll devices → fall back to default)
export const deletePolicy = async (id) => {
  await latency()
  let name
  store.set(s => { name = s.policies.find(p => p.id === id)?.name; s.policies = s.policies.filter(p => p.id !== id) })
  audit('Deleted policy — devices reverted to default', name)
  return { ok: true }
}

// POST /easyreach/mdm/policies/{id}/push   { institution_ids: [] }
export const pushPolicy = async (id, { targetLabel, deviceCount, schedule = 'now' }) => {
  await latency(700, 1200)
  let ro
  store.set(s => {
    const p = s.policies.find(x => x.id === id)
    p.status = 'active'
    p.targets = targetLabel
    if (schedule !== 'night') { p.devices = deviceCount; p.compliant = Math.min(p.compliant, deviceCount) }
    ro = { id: uid('ro'), policyId: p.id, policy: p.name, version: p.version, target: targetLabel, total: deviceCount, done: 0, failed: 0, pending: deviceCount, status: schedule === 'night' ? 'scheduled' : 'running', startedAt: new Date().toISOString(), by: currentUser() }
    s.rollouts.unshift(ro)
  })
  audit(`${schedule === 'night' ? 'Scheduled (22:00)' : 'Pushed'} v${ro.version} to ${targetLabel}`, ro.policy)
  return clone(ro)
}

// GET /easyreach/mdm/policies/rollouts
export const getRollouts = async () => {
  await latency(200, 400)
  store.set(s => {
    // devices on the previous version stay compliant; compliance only rises as agents confirm
    tickRollouts(s.rollouts)
    s.rollouts.forEach(r => {
      const p = s.policies.find(x => x.id === r.policyId)
      if (p && r.status !== 'scheduled') p.compliant = Math.min(p.devices, Math.max(p.compliant, r.done))
    })
  })
  return clone(S().rollouts).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
}

// POST /easyreach/mdm/policies/rollouts/{id}/retry
export const retryRollout = async (id) => {
  await latency()
  store.set(s => { const r = s.rollouts.find(x => x.id === id); if (r && r.failed) { r.pending += r.failed; r.failed = 0; r.status = 'running' } })
  return { ok: true }
}

// GET /easyreach/mdm/policies/compliance
export const getViolations = async () => { await latency(); return clone(S().violations) }

// POST /easyreach/mdm/policies/compliance/{id}/remediate   (re-push policy / lock device)
export const remediate = async (violationId, action) => {
  await latency(800, 1400)
  let v
  store.set(s => {
    v = s.violations.find(x => x.id === violationId)
    s.violations = s.violations.filter(x => x.id !== violationId)
    const p = s.policies.find(x => x.name === v?.policy)
    if (p) p.compliant = Math.min(p.devices, p.compliant + 1)
  })
  audit(action === 'lock' ? `Locked device ${v?.device}` : `Re-applied policy on ${v?.device}`, v?.policy)
  return { ok: true }
}

// GET /easyreach/mdm/policies/audit
export const getAuditLog = async () => { await latency(); return clone(S().audit) }

// GET /easyreach/mdm/policies/compliance/export
export const exportCompliance = async () => {
  await latency(400, 700)
  return toCsvBlob(['Device', 'Institution', 'Policy', 'Issue', 'Severity', 'Detected at'],
    S().violations.map(v => [v.device, v.school, v.policy, v.reason, v.severity, new Date(v.at).toLocaleString('en-IN')]))
}
