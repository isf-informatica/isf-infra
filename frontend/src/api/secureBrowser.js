import api from './axios'
import { toCsvBlob } from './mdmDemoStore'
/* ─────────────────────────────────────────────────────────────────────────────
   Secure Browser API layer — LIVE (EasyReach backend /easyreach/mdm/browser).
   Same function names/shapes as the old demo layer. Push sends an APPLY_BROWSER
   command to every Windows PC (agent installed) in the selected institutions;
   the agent writes Chrome + Edge policies (block/allow lists, SafeSearch,
   YouTube restricted, private window, downloads, printing, homepage).
   ───────────────────────────────────────────────────────────────────────────── */
export const CATEGORIES = [
  { key: 'adult', label: 'Adult content', icon: 'ti-eye-off', sites: 7, locked: true },
  { key: 'gambling', label: 'Gambling & betting', icon: 'ti-cards', sites: 8 },
  { key: 'social', label: 'Social media', icon: 'ti-brand-instagram', sites: 10 },
  { key: 'gaming', label: 'Online games', icon: 'ti-device-gamepad-2', sites: 9 },
  { key: 'streaming', label: 'Video streaming & OTT', icon: 'ti-movie', sites: 8 },
  { key: 'chat', label: 'Chat & messaging', icon: 'ti-message-circle', sites: 6 },
  { key: 'proxy', label: 'Proxy & VPN', icon: 'ti-shield-x', sites: 8 },
  { key: 'piracy', label: 'Piracy & torrents', icon: 'ti-download-off', sites: 8 },
  { key: 'shopping', label: 'Shopping', icon: 'ti-shopping-cart', sites: 7 },
  { key: 'dating', label: 'Dating', icon: 'ti-heart', sites: 6 },
]

const B = '/easyreach/mdm/browser'
const d = (res) => res.data?.data ?? res.data

// GET /easyreach/mdm/browser/summary
export const getBrowserSummary = async () => (await api.get(`${B}/summary`)).data

// GET /easyreach/mdm/browser/targets  → [{ id, name, devices }]  (real Windows PCs with agent)
export const getBrowserTargets = async () => d(await api.get(`${B}/targets`))

// GET /easyreach/mdm/browser/config
export const getConfig = async () => d(await api.get(`${B}/config`))

// PATCH /easyreach/mdm/browser/config
export const updateConfig = async (patch) => d(await api.patch(`${B}/config`, patch))
export const setCategory = async (key, on) => d(await api.patch(`${B}/config`, { categories: { [key]: on } }))

// POST /easyreach/mdm/browser/push   { targetLabel, deviceCount, institution_ids }
export const pushConfig = async ({ targetLabel, deviceCount, institutionIds }) =>
  d(await api.post(`${B}/push`, { targetLabel, deviceCount, institution_ids: institutionIds }))

// GET /easyreach/mdm/browser/push-status
export const getRollout = async () => d(await api.get(`${B}/push-status`))

// GET /easyreach/mdm/browser/rules  → { rules, keywords }
export const getRules = async () => d(await api.get(`${B}/rules`))

// POST /easyreach/mdm/browser/rules
export const addRule = async ({ type, domain, scope, note }) => d(await api.post(`${B}/rules`, { type, domain, scope, note }))

// DELETE /easyreach/mdm/browser/rules/{id}
export const deleteRule = async (id) => (await api.delete(`${B}/rules/${id}`)).data

// PUT /easyreach/mdm/browser/keywords
export const setKeywords = async (keywords) => d(await api.put(`${B}/keywords`, { keywords }))

// GET /easyreach/mdm/browser/activity
export const getActivity = async () => d(await api.get(`${B}/activity`))

// CSV built in the browser from the rows on screen
export const exportActivity = async (rows) =>
  toCsvBlob(['Time', 'URL / search', 'Category', 'Device', 'Institution', 'Off-hours', 'Action'],
    rows.map(a => [new Date(a.at).toLocaleString('en-IN'), a.url, a.category, a.device, a.school, a.offHours ? 'Yes' : 'No', a.action]))
