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

export const generateConfig = async (id) => {
  const res = await api.get(`/easyreach/config/generate/${id}`, {
    responseType: 'blob'
  })
  return res.data
}