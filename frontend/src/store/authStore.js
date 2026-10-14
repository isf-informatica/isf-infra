import { create } from 'zustand'

const IDLE_TIMEOUT = 60 * 60 * 1000 // 1 hour

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  _timer: null,

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    get()._resetTimer()
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    const t = get()._timer
    if (t) clearTimeout(t)
    set({ user: null, token: null, _timer: null })
  },

  _resetTimer: () => {
    const t = get()._timer
    if (t) clearTimeout(t)
    const newTimer = setTimeout(() => {
      get().logout()
      window.location.href = '/login'
    }, IDLE_TIMEOUT)
    set({ _timer: newTimer })
  },

  resetIdle: () => {
    if (get().token) get()._resetTimer()
  }
}))

// Reset on user activity
;['mousemove', 'keydown', 'click', 'scroll'].forEach(event => {
  window.addEventListener(event, () => {
    useAuthStore.getState().resetIdle()
  }, { passive: true })
})

export default useAuthStore