import axios from 'axios'

// Default = live backend, so login works for everyone after a fresh pull.
// To use a local backend, create frontend/.env.local (git-ignored) with:
//   VITE_API_URL=http://localhost:8000
// then restart `npm run dev`.
const LIVE_API_URL = 'https://dolphin-app-33jp4.ondigitalocean.app'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || LIVE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api