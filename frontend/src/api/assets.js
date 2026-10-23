import { latency, uid, minsAgo, clone, currentUser, createStore, toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Asset Manager API layer.

   Ported from:
     • isf-api/asset_management/main.py   (FastAPI — el_assets, el_liabilities,
       el_equity, el_audit_logs, balance sheet, depreciation)
     • easylearnv3 (mbse branch) app/Views/Easylearn/manageAssets.php

   ⚠️ DEMO MODE — the isf-infra backend has no asset endpoints yet. Each
   function keeps the same async signature a real call would have; replace
   the body with the commented endpoint above it (isf-api paths) when wired
   in. The page (pages/assets/AssetView.jsx) does not need any change.
   Reset demo data: localStorage.removeItem('easyreach_assets_store_v1')
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

const dateIso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10)

/* Same formula as isf-api update_depreciation(). */
export function depreciatedValue(a, asOf = new Date()) {
  const cost = Number(a.acquisition_cost) || 0
  if (!cost || !a.purchase_date || !a.depreciation_method || a.depreciation_method === 'none') return cost
  const years = Math.max(0, (asOf - new Date(a.purchase_date)) / (365 * 86400000))
  const rate = (Number(a.depreciation_rate) || 0) / 100
  if (a.depreciation_method === 'straight-line') return Math.max(0, Math.round(cost - cost * rate * years))
  if (a.depreciation_method === 'reducing-balance') return Math.round(cost * (1 - rate) ** years)
  return cost
}

const seed = () => {
  const rows = [
    ['Dell OptiPlex 7090 Desktop', 'IT Equipment', 'Dell', 'MBSE School', 'active', 820, 60, 42, 58000, 'straight-line', 20],
    ['HP LaserJet Pro M404dn', 'IT Equipment', 'HP', 'MBSE School', 'maintenance', 540, 10, 3, 24500, 'straight-line', 20],
    ['Interactive Flat Panel 75"', 'AV / Smart Class', 'BenQ', 'MBSE School', 'active', 410, 680, 12, 185000, 'reducing-balance', 15],
    ['Student Desk & Bench (pair)', 'Furniture', 'Godrej', 'MET School Nashik', 'active', 1460, 0, 240, 6800, 'straight-line', 10],
    ['Cisco Catalyst 2960 Switch', 'Networking', 'Cisco', 'Pimpri Chinchwad University', 'active', 900, 195, 8, 72000, 'reducing-balance', 25],
    ['Physics Lab Kit (Optics)', 'Lab Equipment', 'Labtronics', 'Pimpri Chinchwad University', 'active', 300, 400, 15, 32000, 'straight-line', 12],
    ['School Bus 42-seater', 'Vehicles', 'Tata Motors', 'MBSE School', 'active', 1100, 360, 2, 2450000, 'reducing-balance', 15],
    ['Diesel Generator 62.5 kVA', 'Electrical', 'Kirloskar', 'ISF Head Office', 'active', 1700, -30, 1, 640000, 'straight-line', 8],
    ['Lenovo ThinkPad E14', 'IT Equipment', 'Lenovo', 'ISF Head Office', 'active', 200, 530, 18, 62000, 'straight-line', 25],
    ['Projector EB-X51', 'AV / Smart Class', 'Epson', 'MET School Nashik', 'inactive', 1500, -400, 6, 38000, 'straight-line', 20],
    ['Basketball Stand (Hydraulic)', 'Sports', 'Nivia', 'MBSE School', 'active', 640, 90, 2, 145000, 'none', 0],
    ['Old CRT Monitors', 'IT Equipment', 'Samsung', 'MET School Nashik', 'disposed', 3200, -2500, 20, 9000, 'straight-line', 20],
  ]
  const assets = rows.map(([name, category, brand, location, status, boughtDaysAgo, warrantyDays, quantity, cost, method, rate], i) => {
    const a = {
      asset_id: 1001 + i, name, category, brand, location, status,
      purchase_date: dateIso(boughtDaysAgo), warranty_expiry: dateIso(-warrantyDays),
      description: '', quantity, acquisition_cost: cost, depreciation_method: method, depreciation_rate: rate,
    }
    a.current_value = depreciatedValue(a)
    return a
  })
  return {
    assets,
    liabilities: [
      { liability_id: 1, description: 'Bus purchase loan — HDFC', amount: 1180000, due_date: dateIso(-900), is_current: false },
      { liability_id: 2, description: 'Vendor payable — BenQ smart panels', amount: 370000, due_date: dateIso(-25), is_current: true },
      { liability_id: 3, description: 'AMC dues — Kirloskar generator', amount: 42000, due_date: dateIso(-12), is_current: true },
    ],
    equity: [
      { equity_id: 1, description: 'Trust corpus fund', amount: 4500000, recorded_date: dateIso(1800) },
      { equity_id: 2, description: 'Retained surplus FY 2025-26', amount: 860000, recorded_date: dateIso(200) },
    ],
    audit: [
      { log_id: 'al_1', asset_id: 1002, action: 'Status → In maintenance', performed_by: 'Shyam', timestamp: minsAgo(60 * 20) },
      { log_id: 'al_2', asset_id: 1009, action: 'Asset added', performed_by: 'Yash', timestamp: minsAgo(60 * 24 * 3) },
      { log_id: 'al_3', asset_id: 1012, action: 'Status → Disposed', performed_by: 'Admin', timestamp: minsAgo(60 * 24 * 9) },
    ],
    lastDepreciationRun: minsAgo(60 * 24 * 6),
  }
}

const store = createStore('easyreach_assets_store_v1', seed)
const S = () => store.get()
const log = (asset_id, action) => store.set(s => { s.audit.unshift({ log_id: uid('al'), asset_id, action, performed_by: currentUser(), timestamp: new Date().toISOString() }) })

const warrantyState = (a) => {
  if (!a.warranty_expiry) return 'none'
  const days = (new Date(a.warranty_expiry) - Date.now()) / 86400000
  return days < 0 ? 'expired' : days <= 60 ? 'expiring' : 'valid'
}
export const warrantyOf = warrantyState

/* ── Summary ── */
// (aggregated from GET /asset/api/assets + /asset/api/balance-sheet)
export const getAssetSummary = async () => {
  await latency()
  const s = S()
  const live = s.assets.filter(a => a.status !== 'disposed')
  const byCategory = {}
  live.forEach(a => { byCategory[a.category] = (byCategory[a.category] || 0) + (Number(a.current_value) || 0) })
  const byLocation = {}
  live.forEach(a => { byLocation[a.location] = (byLocation[a.location] || 0) + Number(a.quantity || 1) })
  const cost = live.reduce((t, a) => t + Number(a.acquisition_cost || 0), 0)
  const value = live.reduce((t, a) => t + Number(a.current_value || 0), 0)
  return {
    total: s.assets.length,
    units: live.reduce((t, a) => t + Number(a.quantity || 1), 0),
    active: s.assets.filter(a => a.status === 'active').length,
    maintenance: s.assets.filter(a => a.status === 'maintenance').length,
    cost, value, depreciated: cost - value,
    warrantyExpiring: live.filter(a => warrantyState(a) === 'expiring'),
    warrantyExpired: live.filter(a => warrantyState(a) === 'expired').length,
    byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
    byLocation: Object.entries(byLocation).sort((a, b) => b[1] - a[1]),
    lastDepreciationRun: s.lastDepreciationRun,
  }
}

/* ── Assets ── */
// GET /asset/api/assets
export const getAssets = async () => { await latency(); return clone(S().assets) }

// POST /asset/api/assets
export const createAsset = async (data) => {
  await latency(400, 700)
  const a = { ...data, asset_id: Math.max(1000, ...S().assets.map(x => x.asset_id)) + 1 }
  a.current_value = depreciatedValue(a)
  store.set(s => { s.assets.unshift(a) })
  log(a.asset_id, 'Asset added')
  return clone(a)
}

// PUT /asset/api/assets/{asset_id}
export const updateAsset = async (id, data) => {
  await latency(400, 700)
  let a, prevStatus
  store.set(s => {
    a = s.assets.find(x => x.asset_id === id)
    prevStatus = a.status
    Object.assign(a, data)
    a.current_value = depreciatedValue(a)
  })
  log(id, prevStatus !== a.status ? `Status → ${ASSET_STATUS[a.status]?.label || a.status}` : 'Asset updated')
  return clone(a)
}

// DELETE /asset/api/assets/{asset_id}
export const deleteAsset = async (id) => {
  await latency(300, 600)
  store.set(s => { s.assets = s.assets.filter(x => x.asset_id !== id) })
  log(id, 'Asset deleted')
  return { ok: true }
}

// GET /asset/api/update-depreciation
export const runDepreciation = async () => {
  await latency(700, 1200)
  let changed = 0
  store.set(s => {
    s.assets.forEach(a => {
      const v = depreciatedValue(a)
      if (v !== a.current_value) { a.current_value = v; changed++ }
    })
    s.lastDepreciationRun = new Date().toISOString()
  })
  log(null, `Depreciation recalculated (${changed} assets changed)`)
  return { changed, at: S().lastDepreciationRun }
}

export const exportAssets = async (rows) => {
  await latency(300, 600)
  return toCsvBlob(['ID', 'Name', 'Category', 'Brand', 'Location', 'Status', 'Qty', 'Purchase date', 'Warranty expiry', 'Cost (INR)', 'Method', 'Rate %', 'Current value (INR)'],
    rows.map(a => [a.asset_id, a.name, a.category, a.brand, a.location, ASSET_STATUS[a.status]?.label, a.quantity, a.purchase_date, a.warranty_expiry, a.acquisition_cost, a.depreciation_method, a.depreciation_rate, a.current_value]))
}

/* ── Liabilities ── */
// GET /asset/api/liabilities
export const getLiabilities = async () => { await latency(200, 400); return clone(S().liabilities) }
// POST /asset/api/liabilities
export const createLiability = async (data) => {
  await latency(300, 600)
  const l = { ...data, amount: Number(data.amount), liability_id: Math.max(0, ...S().liabilities.map(x => x.liability_id)) + 1 }
  store.set(s => { s.liabilities.push(l) })
  log(null, `Liability added — ${l.description}`)
  return clone(l)
}
// DELETE /asset/api/liabilities/{liability_id}
export const deleteLiability = async (id) => { await latency(200, 400); store.set(s => { s.liabilities = s.liabilities.filter(x => x.liability_id !== id) }); return { ok: true } }

/* ── Equity ── */
// GET /asset/api/equity
export const getEquity = async () => { await latency(200, 400); return clone(S().equity) }
// POST /asset/api/equity
export const createEquity = async (data) => {
  await latency(300, 600)
  const e = { ...data, amount: Number(data.amount), equity_id: Math.max(0, ...S().equity.map(x => x.equity_id)) + 1 }
  store.set(s => { s.equity.push(e) })
  log(null, `Equity added — ${e.description}`)
  return clone(e)
}
// DELETE /asset/api/equity/{equity_id}
export const deleteEquity = async (id) => { await latency(200, 400); store.set(s => { s.equity = s.equity.filter(x => x.equity_id !== id) }); return { ok: true } }

/* ── Balance sheet ── */
// GET /asset/api/balance-sheet?date=YYYY-MM-DD
export const getBalanceSheet = async (date) => {
  await latency()
  const s = S()
  const asOf = date ? new Date(date) : new Date()
  const fixed = s.assets.filter(a => a.status !== 'disposed').reduce((t, a) => t + depreciatedValue(a, asOf), 0)
  const current = s.liabilities.filter(l => l.is_current).reduce((t, l) => t + l.amount, 0)
  const longTerm = s.liabilities.filter(l => !l.is_current).reduce((t, l) => t + l.amount, 0)
  const equity = s.equity.reduce((t, e) => t + e.amount, 0)
  return {
    as_of_date: asOf.toISOString().slice(0, 10),
    assets: { fixed_assets: fixed, current_assets: 0 },
    liabilities: { current_liabilities: current, long_term_liabilities: longTerm },
    equity,
  }
}

/* ── Audit ── */
// GET /asset/api/audit-logs
export const getAssetAudit = async () => { await latency(200, 400); return clone(S().audit) }
