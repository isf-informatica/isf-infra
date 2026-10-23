import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MdmPage, C, Card, CardHeader, Btn, IconBtn, Loader, Empty, Modal, Field, Input, Select, Chips,
  Kpi, Pill, PILL, useToasts, timeAgo, fmt, downloadBlob,
} from '../../components/mdm/MdmKit'
import {
  CATEGORIES, LOCATIONS, ASSET_STATUS, DEPRECIATION, depreciatedValue, warrantyOf,
  getAssetSummary, getAssets, createAsset, updateAsset, deleteAsset, runDepreciation, exportAssets,
  getLiabilities, createLiability, deleteLiability, getEquity, createEquity, deleteEquity,
  getBalanceSheet, getAssetAudit,
} from '../../api/assets'

/* Asset Manager — ported from isf-api/asset_management + mbse manageAssets.php,
   rebuilt in the isf-infra MdmKit style (same shell as VAPT / DRM / Signage). */

const ACCENT = '#7C3AED'
const THEME = {
  accent: ACCENT, accentDeep: '#6D28D9', accentBg: '#F5F3FF', accentBorder: '#DDD6FE',
  gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { key: 'assets', label: 'Assets', icon: 'ti-packages' },
  { key: 'balance', label: 'Balance sheet', icon: 'ti-scale' },
  { key: 'activity', label: 'Activity', icon: 'ti-history' },
]

const inr = (n) => `₹${fmt(Math.round(Number(n) || 0))}`
const WARRANTY_META = {
  valid: PILL.success('ti-shield-check'),
  expiring: PILL.warning('ti-clock-exclamation'),
  expired: PILL.danger('ti-shield-x'),
  none: PILL.neutral('ti-minus'),
}
const WARRANTY_LABEL = { valid: 'In warranty', expiring: 'Expiring soon', expired: 'Expired', none: 'No warranty' }

export default function AssetView() {
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const { toasts, toast } = useToasts()
  const refresh = useCallback(() => getAssetSummary().then(setSummary).catch(() => {}), [])
  useEffect(() => { refresh() }, [refresh])

  return (
    <MdmPage {...THEME} icon="ti-packages" title="Asset Manager"
      subtitle="Track every physical asset across institutions — warranty, depreciation and book value in one place"
      tabs={TABS} tab={tab} onTab={setTab} toasts={toasts}
      activeKey="assets" backPath="/home" backLabel="Home"
      badges={{ assets: summary?.warrantyExpiring?.length || 0 }}
      status={summary ? `${summary.total} assets · ${inr(summary.value)} book value` : 'connecting…'}>
      {tab === 'overview' && <OverviewTab summary={summary} goTo={setTab} toast={toast} onChange={refresh} />}
      {tab === 'assets' && <AssetsTab toast={toast} onChange={refresh} />}
      {tab === 'balance' && <BalanceTab toast={toast} />}
      {tab === 'activity' && <ActivityTab />}
    </MdmPage>
  )
}

/* ───────── Overview ───────── */

function OverviewTab({ summary, goTo, toast, onChange }) {
  const [running, setRunning] = useState(false)
  if (!summary) return <Loader label="Loading assets…" />
  const maxCat = Math.max(1, ...summary.byCategory.map(c => c[1]))
  const maxLoc = Math.max(1, ...summary.byLocation.map(c => c[1]))
  const pctLeft = summary.cost ? Math.round((summary.value / summary.cost) * 100) : 100

  const recalc = async () => {
    setRunning(true)
    const r = await runDepreciation()
    setRunning(false); onChange()
    toast(`Depreciation updated — ${r.changed} asset${r.changed === 1 ? '' : 's'} changed`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Total assets" value={summary.total} sub={`${fmt(summary.units)} units in use`} icon="ti-packages" color={ACCENT} />
        <Kpi label="Book value" value={inr(summary.value)} sub={`of ${inr(summary.cost)} cost`} icon="ti-currency-rupee" color="#2563EB" />
        <Kpi label="In maintenance" value={summary.maintenance} sub={`${summary.active} active`} icon="ti-tool" color={C.warning} />
        <Kpi label="Warranty alerts" value={summary.warrantyExpiring.length} sub={`${summary.warrantyExpired} already expired`} icon="ti-shield-exclamation" color={C.red} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="p-5 flex flex-col">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>Depreciation</div>
          <div className="text-[30px] font-extrabold leading-none" style={{ color: C.textPrimary }}>{inr(summary.depreciated)}</div>
          <div className="text-[12px] mt-1.5 mb-4" style={{ color: C.textSecondary }}>written off so far · {pctLeft}% value remaining</div>
          <div className="h-2.5 rounded-full overflow-hidden mb-4" style={{ background: C.surfaceAlt }}>
            <div className="h-2.5 rounded-full" style={{ width: `${pctLeft}%`, background: ACCENT, transition: 'width 500ms ease' }} />
          </div>
          <div className="text-[11.5px] mb-4 flex-1" style={{ color: C.textMuted }}>Last run {summary.lastDepreciationRun ? timeAgo(summary.lastDepreciationRun) : 'never'}</div>
          <Btn variant="accent" icon="ti-calculator" loading={running} onClick={recalc}>Recalculate now</Btn>
        </Card>

        <Card className="xl:col-span-2 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: C.textMuted }}>Book value by category</div>
          <div className="flex flex-col gap-3">
            {summary.byCategory.length === 0 ? <Empty>No assets yet.</Empty> : summary.byCategory.map(([cat, v]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-32 text-[12px] font-semibold shrink-0 truncate" style={{ color: C.textPrimary }}>{cat}</span>
                <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: C.surfaceAlt }}>
                  <div className="h-5 rounded-lg" style={{ width: `${Math.max(3, (v / maxCat) * 100)}%`, background: ACCENT, opacity: 0.85, transition: 'width 500ms ease' }} />
                </div>
                <span className="w-28 text-right text-[12px] shrink-0" style={{ color: C.textSecondary }}>{inr(v)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Warranty expiring in 60 days" right={<Btn icon="ti-arrow-right" onClick={() => goTo('assets')}>All assets</Btn>} />
          {summary.warrantyExpiring.length === 0 ? <Empty icon="ti-shield-check">No warranties expiring soon.</Empty> : summary.warrantyExpiring.map(a => (
            <div key={a.asset_id} className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: THEME.accentBg }}>
                <i className="ti ti-clock-exclamation text-[16px]" style={{ color: ACCENT }} aria-hidden="true"></i>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{a.name}</div>
                <div className="text-[11px] mt-0.5 truncate" style={{ color: C.textMuted }}>{a.location} · {a.brand}</div>
              </div>
              <span className="text-[11.5px] shrink-0" style={{ color: C.warning }}>{new Date(a.warranty_expiry).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            </div>
          ))}
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Units by location" />
          <div className="p-5 flex flex-col gap-3">
            {summary.byLocation.map(([loc, n]) => (
              <div key={loc}>
                <div className="flex justify-between gap-3 text-[12px] mb-1.5"><span className="font-semibold truncate" style={{ color: C.textPrimary }}>{loc}</span><span className="shrink-0" style={{ color: C.textSecondary }}>{fmt(n)}</span></div>
                <div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${(n / maxLoc) * 100}%`, background: ACCENT }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ───────── Assets ───────── */

function AssetsTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [loc, setLoc] = useState('all')
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState(null) // null | 'new' | asset
  const [busy, setBusy] = useState(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(() => getAssets().then(setList), [])
  useEffect(() => { load() }, [load])

  const counts = useMemo(() => {
    const c = { all: list?.length || 0 }
    Object.keys(ASSET_STATUS).forEach(k => { c[k] = list?.filter(a => a.status === k).length || 0 })
    return c
  }, [list])

  const shown = (list || []).filter(a => (cat === 'all' || a.category === cat) && (loc === 'all' || a.location === loc) && (status === 'all' || a.status === status)
    && (!q.trim() || `${a.name} ${a.brand} ${a.asset_id}`.toLowerCase().includes(q.trim().toLowerCase())))

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.name}"? This cannot be undone.`)) return
    setBusy(a.asset_id)
    await deleteAsset(a.asset_id)
    setList(l => l.filter(x => x.asset_id !== a.asset_id))
    setBusy(null); onChange(); toast(`Deleted — ${a.name}`)
  }
  const doExport = async () => { setExporting(true); downloadBlob(await exportAssets(shown), `assets-${new Date().toISOString().slice(0, 10)}.csv`); setExporting(false); toast('Assets exported') }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, brand, ID"
              className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-52" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
          </div>
          <Select value={cat} onChange={e => setCat(e.target.value)}><option value="all">All categories</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</Select>
          <Select value={loc} onChange={e => setLoc(e.target.value)}><option value="all">All locations</option>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</Select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Chips options={[['all', 'All'], ...Object.entries(ASSET_STATUS).map(([k, m]) => [k, m.label])]} value={status} onChange={setStatus} counts={counts} />
          <Btn icon="ti-file-spreadsheet" loading={exporting} onClick={doExport}>Export</Btn>
          <Btn variant="accent" icon="ti-plus" onClick={() => setEditing('new')}>Add asset</Btn>
        </div>
      </div>
      {!list ? <Loader label="Loading assets…" /> : shown.length === 0 ? <Empty icon="ti-packages">No assets match.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 980 }}>
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                <th className="px-5 py-2.5">Asset</th><th className="px-3 py-2.5">Location</th><th className="px-3 py-2.5">Qty</th>
                <th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Warranty</th>
                <th className="px-3 py-2.5 text-right">Cost</th><th className="px-3 py-2.5 text-right">Book value</th><th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(a => {
                const w = warrantyOf(a)
                return (
                  <tr key={a.asset_id} className="mk-row cursor-pointer" style={{ borderTop: `1px solid ${C.border}` }} onClick={() => setEditing(a)}>
                    <td className="px-5 py-3">
                      <div className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>{a.name}</div>
                      <div className="text-[11px]" style={{ color: C.textMuted }}><span className="mono">#{a.asset_id}</span> · {a.category} · {a.brand}</div>
                    </td>
                    <td className="px-3 py-3 text-[12px]" style={{ color: C.textSecondary }}>{a.location}</td>
                    <td className="px-3 py-3 text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{a.quantity}</td>
                    <td className="px-3 py-3"><Pill small meta={ASSET_STATUS[a.status] || PILL.neutral()} /></td>
                    <td className="px-3 py-3"><Pill small meta={WARRANTY_META[w]}>{WARRANTY_LABEL[w]}</Pill></td>
                    <td className="px-3 py-3 text-right text-[12px]" style={{ color: C.textSecondary }}>{inr(a.acquisition_cost)}</td>
                    <td className="px-3 py-3 text-right text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{inr(a.current_value)}</td>
                    <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex gap-1.5">
                        <IconBtn icon="ti-pencil" title="Edit" onClick={() => setEditing(a)} />
                        <IconBtn icon="ti-trash" title="Delete" danger loading={busy === a.asset_id} onClick={() => remove(a)} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <AssetModal asset={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
          onSaved={(a, isNew) => {
            setList(l => isNew ? [a, ...l] : l.map(x => x.asset_id === a.asset_id ? a : x))
            setEditing(null); onChange(); toast(isNew ? `Asset added — ${a.name}` : `Saved — ${a.name}`)
          }} />
      )}
    </Card>
  )
}

const EMPTY_ASSET = {
  name: '', category: CATEGORIES[0], brand: '', location: LOCATIONS[0], status: 'active',
  purchase_date: new Date().toISOString().slice(0, 10), warranty_expiry: '', description: '',
  quantity: 1, acquisition_cost: '', depreciation_method: 'straight-line', depreciation_rate: 20,
}

function AssetModal({ asset, onClose, onSaved }) {
  const [f, setF] = useState(asset ? { ...EMPTY_ASSET, ...asset } : EMPTY_ASSET)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  const preview = depreciatedValue({ ...f, acquisition_cost: Number(f.acquisition_cost) || 0 })
  const valid = f.name.trim() && f.brand.trim() && Number(f.quantity) > 0

  const save = async () => {
    setBusy(true)
    const payload = { ...f, quantity: Number(f.quantity) || 1, acquisition_cost: Number(f.acquisition_cost) || 0, depreciation_rate: Number(f.depreciation_rate) || 0 }
    const saved = asset ? await updateAsset(asset.asset_id, payload) : await createAsset(payload)
    onSaved(saved, !asset)
  }

  return (
    <Modal title={asset ? `Edit asset #${asset.asset_id}` : 'Add asset'} onClose={onClose} width={640}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Name"><Input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Dell OptiPlex 7090" /></Field>
        <Field label="Brand"><Input value={f.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Dell" /></Field>
        <Field label="Category"><Select value={f.category} onChange={e => set('category', e.target.value)} className="w-full">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Location"><Select value={f.location} onChange={e => set('location', e.target.value)} className="w-full">{LOCATIONS.map(l => <option key={l}>{l}</option>)}</Select></Field>
        <Field label="Status"><Select value={f.status} onChange={e => set('status', e.target.value)} className="w-full">{Object.entries(ASSET_STATUS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</Select></Field>
        <Field label="Quantity"><Input type="number" min="1" value={f.quantity} onChange={e => set('quantity', e.target.value)} /></Field>
        <Field label="Purchase date"><Input type="date" value={f.purchase_date || ''} onChange={e => set('purchase_date', e.target.value)} /></Field>
        <Field label="Warranty expiry"><Input type="date" value={f.warranty_expiry || ''} onChange={e => set('warranty_expiry', e.target.value)} /></Field>
        <Field label="Acquisition cost (₹)"><Input type="number" min="0" value={f.acquisition_cost} onChange={e => set('acquisition_cost', e.target.value)} placeholder="0" /></Field>
        <Field label="Depreciation method"><Select value={f.depreciation_method} onChange={e => set('depreciation_method', e.target.value)} className="w-full">{Object.entries(DEPRECIATION).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</Select></Field>
        {f.depreciation_method !== 'none' && <Field label="Depreciation rate (% per year)"><Input type="number" min="0" max="100" value={f.depreciation_rate} onChange={e => set('depreciation_rate', e.target.value)} /></Field>}
      </div>
      <Field label="Description (optional)">
        <textarea value={f.description || ''} onChange={e => set('description', e.target.value)} rows={2}
          className="mk-input w-full text-[13px] px-3 py-2 rounded-xl" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface, color: C.textPrimary }} />
      </Field>
      <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
        <span className="text-[12px]" style={{ color: C.textSecondary }}>Current book value ({DEPRECIATION[f.depreciation_method]?.desc.toLowerCase()})</span>
        <span className="text-[15px] font-extrabold" style={{ color: THEME.accentDeep }}>{inr(preview)}</span>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-device-floppy" loading={busy} disabled={!valid} onClick={save}>{asset ? 'Save changes' : 'Add asset'}</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Balance sheet ───────── */

function BalanceTab({ toast }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [sheet, setSheet] = useState(null)
  const [liabs, setLiabs] = useState(null)
  const [equity, setEquity] = useState(null)
  const [adding, setAdding] = useState(null) // 'liability' | 'equity'

  const loadSheet = useCallback(() => getBalanceSheet(date).then(setSheet), [date])
  useEffect(() => { loadSheet() }, [loadSheet])
  const loadLists = useCallback(() => { getLiabilities().then(setLiabs); getEquity().then(setEquity) }, [])
  useEffect(() => { loadLists() }, [loadLists])

  const after = (msg) => { setAdding(null); loadLists(); loadSheet(); toast(msg) }

  const totalAssets = sheet ? sheet.assets.fixed_assets + sheet.assets.current_assets : 0
  const totalLiab = sheet ? sheet.liabilities.current_liabilities + sheet.liabilities.long_term_liabilities : 0
  const diff = sheet ? totalAssets - totalLiab - sheet.equity : 0

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader title="Balance sheet" sub="Fixed assets at depreciated value"
          right={<div className="flex items-center gap-2"><span className="text-[12px]" style={{ color: C.textSecondary }}>As of</span><Input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 160 }} /></div>} />
        {!sheet ? <Loader /> : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Assets</div>
              <Row k="Fixed assets" v={sheet.assets.fixed_assets} />
              <Row k="Current assets" v={sheet.assets.current_assets} />
              <Row k="Total assets" v={totalAssets} bold />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Liabilities & equity</div>
              <Row k="Current liabilities" v={sheet.liabilities.current_liabilities} />
              <Row k="Long-term liabilities" v={sheet.liabilities.long_term_liabilities} />
              <Row k="Equity" v={sheet.equity} />
              <Row k="Total liabilities & equity" v={totalLiab + sheet.equity} bold />
            </div>
            <div className="md:col-span-2 rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: Math.abs(diff) < 1 ? C.successBg : C.warningBg, border: `1px solid ${Math.abs(diff) < 1 ? C.successBorder : C.warningBorder}` }}>
              <span className="text-[12px] font-semibold" style={{ color: Math.abs(diff) < 1 ? C.success : C.warning }}>
                <i className={`ti ${Math.abs(diff) < 1 ? 'ti-circle-check' : 'ti-alert-triangle'} mr-1`} aria-hidden="true"></i>
                {Math.abs(diff) < 1 ? 'Balanced' : 'Difference (assets − liabilities − equity)'}
              </span>
              <span className="text-[13px] font-extrabold" style={{ color: C.textPrimary }}>{inr(diff)}</span>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <LedgerCard title="Liabilities" list={liabs} idKey="liability_id" dateKey="due_date" dateLabel="Due"
          tag={(l) => <Pill small meta={l.is_current ? PILL.warning('ti-clock') : PILL.neutral('ti-calendar')}>{l.is_current ? 'Current' : 'Long-term'}</Pill>}
          onAdd={() => setAdding('liability')}
          onDelete={async (l) => { await deleteLiability(l.liability_id); after(`Removed — ${l.description}`) }} />
        <LedgerCard title="Equity" list={equity} idKey="equity_id" dateKey="recorded_date" dateLabel="Recorded"
          onAdd={() => setAdding('equity')}
          onDelete={async (e) => { await deleteEquity(e.equity_id); after(`Removed — ${e.description}`) }} />
      </div>

      {adding && <LedgerModal kind={adding} onClose={() => setAdding(null)}
        onSaved={(row) => after(`${adding === 'liability' ? 'Liability' : 'Equity'} added — ${row.description}`)} />}
    </div>
  )
}

function Row({ k, v, bold }) {
  return (
    <div className="flex items-center justify-between py-2 text-[12.5px]" style={{ borderBottom: `1px solid ${C.border}` }}>
      <span style={{ color: bold ? C.textPrimary : C.textSecondary, fontWeight: bold ? 700 : 500 }}>{k}</span>
      <span style={{ color: C.textPrimary, fontWeight: bold ? 800 : 600 }}>{inr(v)}</span>
    </div>
  )
}

function LedgerCard({ title, list, idKey, dateKey, dateLabel, tag, onAdd, onDelete }) {
  const total = (list || []).reduce((t, r) => t + r.amount, 0)
  return (
    <Card>
      <CardHeader title={title} sub={list ? `${list.length} entries · ${inr(total)}` : ' '} right={<Btn variant="accent" icon="ti-plus" onClick={onAdd}>Add</Btn>} />
      {!list ? <Loader /> : list.length === 0 ? <Empty>No entries.</Empty> : list.map(r => (
        <div key={r[idKey]} className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{r.description}</div>
            <div className="text-[11px] mt-0.5 flex items-center gap-2" style={{ color: C.textMuted }}>
              {r[dateKey] ? `${dateLabel} ${new Date(r[dateKey]).toLocaleDateString('en-IN', { dateStyle: 'medium' })}` : 'No date'}
              {tag?.(r)}
            </div>
          </div>
          <span className="text-[13px] font-bold shrink-0" style={{ color: C.textPrimary }}>{inr(r.amount)}</span>
          <IconBtn icon="ti-trash" danger title="Delete" onClick={() => onDelete(r)} />
        </div>
      ))}
    </Card>
  )
}

function LedgerModal({ kind, onClose, onSaved }) {
  const isL = kind === 'liability'
  const [f, setF] = useState({ description: '', amount: '', date: '', is_current: true })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  const save = async () => {
    setBusy(true)
    const row = isL
      ? await createLiability({ description: f.description, amount: f.amount, due_date: f.date || null, is_current: f.is_current })
      : await createEquity({ description: f.description, amount: f.amount, recorded_date: f.date || null })
    onSaved(row)
  }
  return (
    <Modal title={isL ? 'Add liability' : 'Add equity'} onClose={onClose} width={480}>
      <Field label="Description"><Input value={f.description} onChange={e => set('description', e.target.value)} /></Field>
      <Field label="Amount (₹)"><Input type="number" min="0" value={f.amount} onChange={e => set('amount', e.target.value)} /></Field>
      <Field label={isL ? 'Due date' : 'Recorded date'}><Input type="date" value={f.date} onChange={e => set('date', e.target.value)} /></Field>
      {isL && <Field label="Type"><Select value={f.is_current ? '1' : '0'} onChange={e => set('is_current', e.target.value === '1')} className="w-full"><option value="1">Current (due within a year)</option><option value="0">Long-term</option></Select></Field>}
      <div className="flex justify-end gap-2 pt-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-device-floppy" loading={busy} disabled={!f.description.trim() || !(Number(f.amount) > 0)} onClick={save}>Save</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Activity ───────── */

function ActivityTab() {
  const [audit, setAudit] = useState(null)
  useEffect(() => { getAssetAudit().then(setAudit) }, [])
  return (
    <Card>
      <CardHeader title="Activity log" sub="Asset changes, status updates and depreciation runs" />
      {!audit ? <Loader /> : audit.length === 0 ? <Empty>No activity yet.</Empty> : audit.map(a => (
        <div key={a.log_id} className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: C.surfaceAlt, color: C.textPrimary }}>{a.performed_by[0]}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px]" style={{ color: C.textPrimary }}><b>{a.performed_by}</b> · {a.action}</div>
            {a.asset_id && <div className="text-[11.5px] mono" style={{ color: C.textMuted }}>Asset #{a.asset_id}</div>}
          </div>
          <span className="text-[11px] shrink-0" style={{ color: C.textMuted }}>{timeAgo(a.timestamp)}</span>
        </div>
      ))}
    </Card>
  )
}
