/**
 * FortiMates module config (integrated inside EasyReach / ISF Infra).
 *
 * FM_BASE      – the route FortiMates lives under. Must match the ISF Sidebar
 *                entry path ('/modules/fortimates') and the route in App.jsx.
 * FM_EXIT_PATH – where "Back to ISF Infra" goes (EasyReach home).
 * FM_API_BASE  – prefix for calls to the old FortiMates CodeIgniter 3 backend.
 *                Local dev: '/fm-api' (Vite proxy → http://localhost/fortimates.com).
 *                Production: set VITE_FM_API_BASE=https://fortimates.com in .env.production
 */
export const FM_BASE = '/modules/fortimates'   // FortiMates landing page (first page)
export const FM_DASH = `${FM_BASE}/dashboard`  // admin dashboard
export const FM_LOGIN = `${FM_BASE}/login`
export const FM_REGISTER = `${FM_BASE}/register`
export const FM_FORGOT = `${FM_BASE}/forgot-password`
export const FM_EXIT_PATH = '/home'
export const FM_API_BASE = import.meta.env.VITE_FM_API_BASE ?? '/fm-api'
