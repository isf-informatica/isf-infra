import api from './axios'

export const getDevices = async (schoolId) => {
  const res = await api.get(`/easyreach/schools/${schoolId}/devices`)
  return res.data
}

export const addDevice = async (schoolId, data) => {
  const res = await api.post(`/easyreach/schools/${schoolId}/devices`, data)
  return res.data
}

export const deleteDevice = async (schoolId, deviceId) => {
  const res = await api.delete(`/easyreach/schools/${schoolId}/devices/${deviceId}`)
  return res.data
}

export const getCommandResult = async (commandId) => {
  const res = await api.get(`/easyreach/agent/command-result/${commandId}`)
  return res.data
}