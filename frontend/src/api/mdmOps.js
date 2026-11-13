import api from './axios'

/* ─────────────────────────────────────────────────────────────────────────────
   MDM Ops API — LIVE backend.
   Reports, Users/Roles, Device Groups, on-demand Remote Wipe, Geofence.
   Endpoints: /easyreach/mdm/reports|users|groups|devices/{id}/wipe|geofence
   ───────────────────────────────────────────────────────────────────────────── */

// GET /easyreach/mdm/reports/summary
export const getMdmReports = async () => {
  const res = await api.get('/easyreach/mdm/reports/summary')
  return res.data
}

/* ── Users / Roles ── */
// GET /easyreach/mdm/users
export const getMdmUsers = async () => {
  const res = await api.get('/easyreach/mdm/users')
  return res.data   // { data: [...], roles: [...] }
}

// PATCH /easyreach/mdm/users/{id}/role
export const setUserRole = async (userId, role) => {
  const res = await api.patch(`/easyreach/mdm/users/${userId}/role`, { role })
  return res.data.data
}

/* ── Device Groups ── */
// GET /easyreach/mdm/groups
export const getGroups = async () => {
  const res = await api.get('/easyreach/mdm/groups')
  return res.data.data || []
}

// POST /easyreach/mdm/groups
export const createGroup = async ({ name, description, schoolId, deviceIds }) => {
  const res = await api.post('/easyreach/mdm/groups', { name, description, schoolId: schoolId || null, deviceIds: deviceIds || [] })
  return res.data.data
}

// POST /easyreach/mdm/groups/{id}/members
export const setGroupMembers = async (groupId, deviceIds) => {
  const res = await api.post(`/easyreach/mdm/groups/${groupId}/members`, { deviceIds: deviceIds || [] })
  return res.data.data
}

// DELETE /easyreach/mdm/groups/{id}
export const deleteGroup = async (groupId) => {
  const res = await api.delete(`/easyreach/mdm/groups/${groupId}`)
  return res.data
}

// POST /easyreach/mdm/groups/{id}/wipe
export const wipeGroup = async (groupId, reason) => {
  const res = await api.post(`/easyreach/mdm/groups/${groupId}/wipe`, { reason: reason || null })
  return res.data
}

/* ── On-demand Remote Wipe (single device) ── */
// POST /easyreach/mdm/devices/{id}/wipe
export const wipeDevice = async (deviceId, reason) => {
  const res = await api.post(`/easyreach/mdm/devices/${deviceId}/wipe`, { reason: reason || null })
  return res.data
}

/* ── Geofence ── */
// GET /easyreach/mdm/geofence
export const getGeofence = async () => {
  const res = await api.get('/easyreach/mdm/geofence')
  return res.data   // { data: [...configs], events: [...] }
}

// POST /easyreach/mdm/geofence
export const setGeofence = async (cfg) => {
  const res = await api.post('/easyreach/mdm/geofence', cfg)
  return res.data.data
}
