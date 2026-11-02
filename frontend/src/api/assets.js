import api from './axios'
import { toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Asset Manager API layer — LIVE (EasyReach backend /easyreach/assets).

   Ported from isf-api asset_management/main.py + mbse manageAssets.php.
   Same function names/shapes as the old demo layer, so AssetView.jsx is
   unchanged. Depreciation is calculated on the server with the same formula
   as depreciatedValue() below (that one is only used for the live preview in
   the form).
   ───────────────────────────────────────────────────────────────────────────── */

export const CATEGORIES = ['IT Equipment', 'Furniture', 'Lab Equipment', 'Networking', 'AV / Smart Class', 'Vehicles', 'Electrical', 'Sports']

export const LOCATIONS = ['MBSE School', 'Pimpri Chinchwad University', 'MET School Nashik', 'ISF Head Office']

// Same values the isf-api / mbse status select uses.
export const ASSET_STATUS = {
  active: { label: 'Active', color: '#17B26A', bg: '#ECFDF5', border: '#A7E9C8', icon: 'ti-circle-check' },
  maintenance: { label: 'In maintenance', color: '#8A6816', bg: '#FBF3E0', border: '#E7D39C', icon: 'ti-tool' },
  inactive: { label: 'Inactive', color: '#5C5C57', bg: '#F2F2EE', border: '#D5D5CE', icon: 'ti-player-pause' },
  disposed: { label: 'Disposed', color: '#8A2A2A', bg: '#FBEAE9', border: '#EFC4C1', icon: 'ti-trash' },
}

export const DEPRECIATION = {
  'straight-line': { label: 'Straight line', desc: 'Same amount every year' },
  'reducing-balance': { label: 'Reducing balance', desc: 'Fixed % of the remaining value' },
  none: { label: 'No depreciation', desc: 'Value stays at cost' },
}

/* Same formula as isf-api update_depreciation(). */
export function depreciatedValue(a, asOf = new Date()) {
  const cost = Number(a.acquisition_cost) || 0
  if (!cost || !a.purchase_date || !a.depreciation_method || a.depreciation_method === 'none') return cost
  // whole days only (date part, UTC) — same as the server's (as_of - purchase_date).days / 365
  const today = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate())
  const days = Math.floor((today - new Date(String(a.purchase_date).slice(0, 10)).getTime()) / 86400000)
  const years = Math.max(0, days / 365)
  const rate = (Number(a.depreciation_rate) || 0) / 100
  const r2 = (x) => Math.round(x * 100) / 100   // server rounds to 2 decimals
  if (a.depreciation_method === 'straight-line') return Math.max(0, r2(cost - cost * rate * years))
  if (a.depreciation_method === 'reducing-balance') return r2(cost * (1 - rate) ** years)
  return cost
}

const warrantyState = (a) => {
  if (!a.warranty_expiry) return 'none'
  const days = (new Date(a.warranty_expiry) - Date.now()) / 86400000
  return days < 0 ? 'expired' : days <= 60 ? 'expiring' : 'valid'
}
export const warrantyOf = warrantyState

const B = '/easyreach/assets'
const d = (res) => res.data?.data ?? res.data
const fail = (e, msg) => new Error(e?.response?.data?.detail || msg, { cause: e })
// backend logs "Status -> maintenance" — show the same label the page uses
const prettyAction = (s) => (s || '').replace(/^Status -> (\w+)/, (_, k) => `Status → ${ASSET_STATUS[k]?.label || k}`).replace(/ - /, ' — ')

/* ── Summary ── */
// GET /easyreach/assets/summary
export const getAssetSummary = async () => (await api.get(`${B}/summary`)).data

/* ── Assets ── */
// GET /easyreach/assets
export const getAssets = async () => d(await api.get(B))

// POST /easyreach/assets
export const createAsset = async (data) => {
  try { return d(await api.post(B, data)) } catch (e) { throw fail(e, 'Could not add asset') }
}

// PUT /easyreach/assets/{asset_id}   (full asset — the form always sends every field)
export const updateAsset = async (id, data) => {
  try { return d(await api.put(`${B}/${id}`, data)) } catch (e) { throw fail(e, 'Could not update asset') }
}

// DELETE /easyreach/assets/{asset_id}
export const deleteAsset = async (id) => (await api.delete(`${B}/${id}`)).data

// POST /easyreach/assets/run-depreciation
export const runDepreciation = async () => (await api.post(`${B}/run-depreciation`)).data

export const exportAssets = async (rows) =>
  toCsvBlob(['ID', 'Name', 'Category', 'Brand', 'Location', 'Status', 'Qty', 'Purchase date', 'Warranty expiry', 'Cost (INR)', 'Method', 'Rate %', 'Current value (INR)'],
    rows.map(a => [a.asset_id, a.name, a.category, a.brand, a.location, ASSET_STATUS[a.status]?.label, a.quantity, a.purchase_date, a.warranty_expiry, a.acquisition_cost, a.depreciation_method, a.depreciation_rate, a.current_value]))

/* ── Liabilities ── */
// GET /easyreach/assets/liabilities
export const getLiabilities = async () => d(await api.get(`${B}/liabilities`))
// POST /easyreach/assets/liabilities
export const createLiability = async (data) => {
  try { return d(await api.post(`${B}/liabilities`, { ...data, amount: Number(data.amount) || 0 })) } catch (e) { throw fail(e, 'Could not add liability') }
}
// DELETE /easyreach/assets/liabilities/{liability_id}
export const deleteLiability = async (id) => (await api.delete(`${B}/liabilities/${id}`)).data

/* ── Equity ── */
// GET /easyreach/assets/equity
export const getEquity = async () => d(await api.get(`${B}/equity`))
// POST /easyreach/assets/equity
export const createEquity = async (data) => {
  try { return d(await api.post(`${B}/equity`, { ...data, amount: Number(data.amount) || 0 })) } catch (e) { throw fail(e, 'Could not add equity') }
}
// DELETE /easyreach/assets/equity/{equity_id}
export const deleteEquity = async (id) => (await api.delete(`${B}/equity/${id}`)).data

/* ── Balance sheet ── */
// GET /easyreach/assets/balance-sheet?date=YYYY-MM-DD
export const getBalanceSheet = async (date) => (await api.get(`${B}/balance-sheet`, { params: { date: date || undefined } })).data

/* ── Audit ── */
// GET /easyreach/assets/audit
export const getAssetAudit = async () => d(await api.get(`${B}/audit`)).map(r => ({ ...r, action: prettyAction(r.action) }))
