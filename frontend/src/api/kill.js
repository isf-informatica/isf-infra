import api from './axios'

export const killSchool = async (schoolId, level, reason, confirmationCode) => {
  const res = await api.post(`/easyreach/kill/${schoolId}/level/${level}`, {
    reason,
    confirmation_code: confirmationCode
  })
  return res.data
}

export const restoreSchool = async (schoolId, level) => {
  const res = await api.post(`/easyreach/kill/${schoolId}/restore/${level}`, {})
  return res.data
}