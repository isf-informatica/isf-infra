import api from './axios'

export const getAllSchools = async () => {
  const res = await api.get('/easyreach/schools/')
  return res.data
}

export const getSchool = async (id) => {
  const res = await api.get(`/easyreach/schools/${id}`)
  return res.data
}

export const createSchool = async (data) => {
  const res = await api.post('/easyreach/schools/', data)
  return res.data
}

export const updateSchool = async (id, data) => {
  const res = await api.put(`/easyreach/schools/${id}`, data)
  return res.data
}

export const deleteSchool = async (id) => {
  const res = await api.delete(`/easyreach/schools/${id}`)
  return res.data
}

export const getSchoolLogs = async (id) => {
  const res = await api.get(`/easyreach/schools/${id}/logs`)
  return res.data
}

// ── Organization / Event support ──
export const ORG_KINDS = ['school', 'college', 'institute', 'event', 'program', 'other']

// Set an institution's type + event details (location, start/end, auto-expire)
export const updateOrg = async (id, data) => {
  const res = await api.patch(`/easyreach/schools/${id}/org`, data)
  return res.data
}

// Quick / bulk device enrolment for an org or event
export const bulkAddDevices = async (id, devices) => {
  const res = await api.post(`/easyreach/schools/${id}/devices/bulk`, { devices })
  return res.data
}

// Org summary — counts by kind + active events
export const getOrgSummary = async () => {
  const res = await api.get('/easyreach/org/summary')
  return res.data
}

export const generateConfig = async (id) => {
  const res = await api.get(`/easyreach/config/generate/${id}`, {
    responseType: 'blob'
  })
  return res.data
}