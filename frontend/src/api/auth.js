import api from './axios'

export const login = async (email, password) => {
  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', password)
  const res = await api.post('/easyreach/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
  return res.data
}

export const getMe = async () => {
  const res = await api.get('/easyreach/auth/me')
  return res.data
}