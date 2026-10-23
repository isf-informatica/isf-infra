import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MdmPage, C, Card, CardHeader, Btn, IconBtn, Loader, Empty, Modal, Field, Input, Select, Chips,
  Kpi, Pill, useToasts, timeAgo, fmt, downloadBlob,
} from '../../components/mdm/MdmKit'
import {
  ENTRY_TYPES, PAYMENT_TYPES, PAY_STATUS, suggestNarration,
  getAccountSummary, getHeads, addHead, getBooks, createBook, deleteBook, exportBooks,
  getBills, createBill, payBill, deleteBill,
  getInvoices, createInvoice, receiveInvoice, deleteInvoice, nextInvoiceNo, getAccountAudit,
} from '../../api/accounts'

/* Account Manager — ported from isf-api/accounting + mbse manageAccounts.php,
   rebuilt in the isf-infra MdmKit style (same shell as VAPT / DRM / Signage). */

const ACCENT = '#059669'
const THEME = {
  accent: ACCENT, accentDeep: '#047857', accentBg: '#ECFDF5', accentBorder: '#A7F3D0',
  gradient: 'linear-gradient(135deg, #10B981, #047857)',
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'ti-layout-dashboard' },
  { key: 'books', label: 'Books of accounts', icon: 'ti-book-2' },
  { key: 'bills', label: 'Bills', icon: 'ti-receipt' },
  { key: 'invoices', label: 'Invoices', icon: 'ti-file-invoice' },
  { key: 'activity', label: 'Activity', icon: 'ti-history' },
]

const inr = (n) => `₹${fmt(Math.round(Number(n) || 0))}`
const dt = (d) => new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' })
const today = () => new Date().toISOString().slice(0, 10)
const textareaStyle = { border: `1px solid ${C.systemBorder}`, background: C.surface, color: C.textPrimary }

export default function AccountView() {
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const { toasts, toast } = useToasts()
  const refresh = useCallback(() => getAccountSummary().then(setSummary).catch(() => {}), [])
  useEffect(() => { refresh() }, [refresh])

  return (
    <MdmPage {...THEME} icon="ti-calculator" title="Account Manager"
      subtitle="Books of accounts, vendor bills and client invoices — income, expenses and dues at a glance"
      tabs={TABS} tab={tab} onTab={setTab} toasts={toasts}
      activeKey="accounts" backPath="/home" backLabel="Home"
      badges={{ bills: summary?.unpaidBills || 0, invoices: summary?.unpaidInvoices || 0 }}
      status={summary ? `Net ${summary.net >= 0 ? '+' : '−'}${inr(Math.abs(summary.net))} · ${summary.entries} entries` : 'connecting…'}>
      {tab === 'overview' && <OverviewTab summary={summary} goTo={setTab} />}
      {tab === 'books' && <BooksTab toast={toast} onChange={refresh} />}
      {tab === 'bills' && <BillsTab toast={toast} onChange={refresh} />}
      {tab === 'invoices' && <InvoicesTab toast={toast} onChange={refresh} />}
      {tab === 'activity' && <ActivityTab />}
    </MdmPage>
  )
}

/* ───────── Overview ───────── */

function OverviewTab({ summary, goTo }) {
  if (!summary) return <Loader label="Loading accounts…" />
  const maxMonth = Math.max(1, ...summary.months.flatMap(m => [m.income, m.expense]))
  const maxHead = Math.max(1, ...summary.byHead.map(h => h[1]))
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Income" value={inr(summary.income)} sub="Total credits" icon="ti-arrow-down-left" color={C.success} />
        <Kpi label="Expenses" value={inr(summary.expense)} sub="Total debits" icon="ti-arrow-up-right" color={C.red} />
        <Kpi label="Receivables" value={inr(summary.receivables)} sub={`${summary.unpaidInvoices} invoices pending`} icon="ti-file-invoice" color="#2563EB" />
        <Kpi label="Payables" value={inr(summary.payables)} sub={`${summary.unpaidBills} bills pending`} icon="ti-receipt" color={C.warning} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <Card className="xl:col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>Income vs expense · last 6 months</div>
            <div className="flex items-center gap-3 text-[11px]" style={{ color: C.textSecondary }}>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: ACCENT }} />Income</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.red }} />Expense</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-44">
            {summary.months.map(m => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                <div className="flex-1 w-full flex items-end justify-center gap-1">
                  <div className="w-1/3 rounded-t-md" title={`Income ${inr(m.income)}`} style={{ height: `${(m.income / maxMonth) * 100}%`, minHeight: m.income ? 3 : 0, background: ACCENT, transition: 'height 500ms ease' }} />
                  <div className="w-1/3 rounded-t-md" title={`Expense ${inr(m.expense)}`} style={{ height: `${(m.expense / maxMonth) * 100}%`, minHeight: m.expense ? 3 : 0, background: C.red, transition: 'height 500ms ease' }} />
                </div>
                <span className="text-[11px]" style={{ color: C.textMuted }}>{m.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Top expense heads" right={<Btn icon="ti-arrow-right" onClick={() => goTo('books')}>Books</Btn>} />
          <div className="p-5 flex flex-col gap-3">
            {summary.byHead.length === 0 ? <Empty>No expenses yet.</Empty> : summary.byHead.slice(0, 6).map(([head, v]) => (
              <div key={head}>
                <div className="flex justify-between gap-3 text-[12px] mb-1.5"><span className="font-semibold truncate" style={{ color: C.textPrimary }}>{head}</span><span className="shrink-0" style={{ color: C.textSecondary }}>{inr(v)}</span></div>
                <div className="h-2 rounded-full" style={{ background: C.surfaceAlt }}><div className="h-2 rounded-full" style={{ width: `${(v / maxHead) * 100}%`, background: ACCENT }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ───────── Books of accounts ───────── */

function BooksTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [heads, setHeads] = useState([])
  const [type, setType] = useState('all')
  const [head, setHead] = useState('all')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(() => getBooks().then(setList), [])
  useEffect(() => { load(); getHeads().then(setHeads) }, [load])

  const counts = useMemo(() => ({ all: list?.length || 0, Income: list?.filter(b => b.category_name === 'Income').length || 0, Expense: list?.filter(b => b.category_name === 'Expense').length || 0 }), [list])
  const shown = (list || []).filter(b => (type === 'all' || b.category_name === type) && (head === 'all' || b.expense_head === head)
    && (!q.trim() || `${b.transaction_id} ${b.narration} ${b.bill_no}`.toLowerCase().includes(q.trim().toLowerCase())))
  const totDebit = shown.reduce((t, b) => t + b.debit_amount, 0)
  const totCredit = shown.reduce((t, b) => t + b.credit_amount, 0)

  const remove = async (b) => {
    if (!window.confirm(`Delete entry ${b.transaction_id}?`)) return
    setBusy(b.id); await deleteBook(b.id)
    setList(l => l.filter(x => x.id !== b.id)); setBusy(null); onChange(); toast(`Deleted — ${b.transaction_id}`)
  }
  const doExport = async () => { setExporting(true); downloadBlob(await exportBooks(shown), `books-of-accounts-${today()}.csv`); setExporting(false); toast('Entries exported') }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search ID, narration, bill"
              className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-56" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
          </div>
          <Select value={head} onChange={e => setHead(e.target.value)}><option value="all">All expense heads</option>{heads.map(h => <option key={h}>{h}</option>)}</Select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Chips options={[['all', 'All'], ['Income', 'Income'], ['Expense', 'Expense']]} value={type} onChange={setType} counts={counts} />
          <Btn icon="ti-file-spreadsheet" loading={exporting} onClick={doExport}>Export</Btn>
          <Btn variant="accent" icon="ti-plus" onClick={() => setAdding(true)}>Add entry</Btn>
        </div>
      </div>
      {!list ? <Loader label="Loading entries…" /> : shown.length === 0 ? <Empty icon="ti-book-2">No entries match.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 960 }}>
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                <th className="px-5 py-2.5">Date</th><th className="px-3 py-2.5">Transaction</th><th className="px-3 py-2.5">Expense head</th>
                <th className="px-3 py-2.5">Type</th><th className="px-3 py-2.5 text-right">Debit</th><th className="px-3 py-2.5 text-right">Credit</th><th className="px-5 py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {shown.map(b => (
                <tr key={b.id} className="mk-row" style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="px-5 py-3 text-[12px] whitespace-nowrap" style={{ color: C.textSecondary }}>{dt(b.transaction_date)}</td>
                  <td className="px-3 py-3">
                    <div className="text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{b.narration}</div>
                    <div className="text-[11px]" style={{ color: C.textMuted }}><span className="mono">{b.transaction_id}</span>{b.bill_no && ` · Bill ${b.bill_no}`}</div>
                  </td>
                  <td className="px-3 py-3 text-[12px]" style={{ color: C.textSecondary }}>{b.expense_head}</td>
                  <td className="px-3 py-3"><Pill small meta={ENTRY_TYPES[b.category_name]} /></td>
                  <td className="px-3 py-3 text-right text-[12.5px] font-semibold" style={{ color: b.debit_amount ? C.danger : C.textMuted }}>{b.debit_amount ? inr(b.debit_amount) : '—'}</td>
                  <td className="px-3 py-3 text-right text-[12.5px] font-semibold" style={{ color: b.credit_amount ? C.success : C.textMuted }}>{b.credit_amount ? inr(b.credit_amount) : '—'}</td>
                  <td className="px-5 py-3 text-right"><IconBtn icon="ti-trash" danger title="Delete" loading={busy === b.id} onClick={() => remove(b)} /></td>
                </tr>
              ))}
              <tr style={{ borderTop: `2px solid ${C.borderStrong}`, background: C.surfaceAlt }}>
                <td colSpan={4} className="px-5 py-3 text-[12px] font-bold uppercase tracking-wide" style={{ color: C.textPrimary }}>Total</td>
                <td className="px-3 py-3 text-right text-[13px] font-extrabold" style={{ color: C.danger }}>{inr(totDebit)}</td>
                <td className="px-3 py-3 text-right text-[13px] font-extrabold" style={{ color: C.success }}>{inr(totCredit)}</td>
                <td className="px-5 py-3 text-right text-[11.5px] font-bold whitespace-nowrap" style={{ color: totCredit - totDebit >= 0 ? C.success : C.danger }}>Net {inr(totCredit - totDebit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {adding && <BookModal heads={heads} onHeads={setHeads} onClose={() => setAdding(false)}
        onSaved={(row) => { setAdding(false); load(); onChange(); toast(`Entry added — ${row.transaction_id}`) }} />}
    </Card>
  )
}

function BookModal({ heads, onHeads, onClose, onSaved }) {
  const [f, setF] = useState({ category_name: 'Expense', transaction_date: today(), expense_head: heads[0] || '', amount: '', narration: '', bill_no: '', comment: '' })
  const [newHead, setNewHead] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const createHead = async () => {
    const list = await addHead(newHead)
    onHeads(list); set('expense_head', newHead.trim()); setNewHead('')
  }
  const save = async () => { setBusy(true); onSaved(await createBook(f)) }

  return (
    <Modal title="Add account entry" onClose={onClose} width={600}>
      <Field label="Type">
        <div className="flex gap-2">
          {Object.entries(ENTRY_TYPES).map(([k, m]) => (
            <button key={k} type="button" onClick={() => set('category_name', k)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold cursor-pointer"
              style={{ border: `1.5px solid ${f.category_name === k ? m.color : C.border}`, background: f.category_name === k ? m.bg : C.surface, color: f.category_name === k ? m.color : C.textSecondary }}>
              <i className={`ti ${m.icon}`} aria-hidden="true"></i>{m.label}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Transaction date"><Input type="date" value={f.transaction_date} onChange={e => set('transaction_date', e.target.value)} /></Field>
        <Field label="Amount (₹)"><Input type="number" min="0" value={f.amount} onChange={e => set('amount', e.target.value)} placeholder="0" /></Field>
        <Field label="Expense head"><Select value={f.expense_head} onChange={e => set('expense_head', e.target.value)} className="w-full">{heads.map(h => <option key={h}>{h}</option>)}</Select></Field>
        <Field label="Bill / receipt no."><Input value={f.bill_no} onChange={e => set('bill_no', e.target.value)} placeholder="Optional" /></Field>
      </div>
      <div className="flex gap-2 -mt-2 mb-4">
        <Input value={newHead} onChange={e => setNewHead(e.target.value)} placeholder="New expense head…" />
        <Btn icon="ti-plus" disabled={!newHead.trim()} onClick={createHead}>Add head</Btn>
      </div>
      <Field label="Narration">
        <div className="flex gap-2 items-start">
          <textarea value={f.narration} onChange={e => set('narration', e.target.value)} rows={2} className="mk-input w-full text-[13px] px-3 py-2 rounded-xl" style={textareaStyle} />
          <Btn icon="ti-sparkles" title="Suggest narration" onClick={() => set('narration', suggestNarration({ type: f.category_name, head: f.expense_head, amount: f.amount, date: f.transaction_date }))}>Suggest</Btn>
        </div>
      </Field>
      <Field label="Comment (optional)"><Input value={f.comment} onChange={e => set('comment', e.target.value)} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-device-floppy" loading={busy} disabled={!(Number(f.amount) > 0) || !f.expense_head || !f.narration.trim()} onClick={save}>Save entry</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Bills & invoices (shared row + payment modal) ───────── */

function PaymentModal({ title, due, onClose, onPay }) {
  const [amt, setAmt] = useState(String(due))
  const [busy, setBusy] = useState(false)
  return (
    <Modal title={title} onClose={onClose} width={420}>
      <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between" style={{ background: C.surfaceAlt }}>
        <span className="text-[12px]" style={{ color: C.textSecondary }}>Outstanding</span>
        <span className="text-[15px] font-extrabold" style={{ color: C.textPrimary }}>{inr(due)}</span>
      </div>
      <Field label="Amount (₹)"><Input type="number" min="0" max={due} value={amt} onChange={e => setAmt(e.target.value)} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-check" loading={busy} disabled={!(Number(amt) > 0)} onClick={async () => { setBusy(true); await onPay(Math.min(Number(amt), due)) }}>Record</Btn>
      </div>
    </Modal>
  )
}

function DuesList({ list, kind, statusFilter, onStatus, counts, onAdd, onPay, onDelete, busy }) {
  const isBill = kind === 'bill'
  const shown = (list || []).filter(r => statusFilter === 'all' || r.amount_type === statusFilter)
  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <Chips options={[['all', 'All'], ['unpaid', 'Unpaid'], ['partial', 'Partial'], ['paid', 'Paid']]} value={statusFilter} onChange={onStatus} counts={counts} />
        <Btn variant="accent" icon="ti-plus" onClick={onAdd}>{isBill ? 'Add bill' : 'Raise invoice'}</Btn>
      </div>
      {!list ? <Loader /> : shown.length === 0 ? <Empty icon={isBill ? 'ti-receipt' : 'ti-file-invoice'}>Nothing here.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 900 }}>
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
                <th className="px-5 py-2.5">{isBill ? 'Vendor' : 'Invoice'}</th><th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5 text-right">Total</th><th className="px-3 py-2.5 text-right">{isBill ? 'Paid' : 'Received'}</th>
                <th className="px-3 py-2.5">Status</th><th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(r => {
                const total = isBill ? r.bill_amount : r.total_amount
                const due = total - r.paid_amount
                return (
                  <tr key={r.id} className="mk-row" style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-5 py-3">
                      <div className="text-[13px] font-semibold" style={{ color: C.textPrimary }}>{isBill ? r.vendor_name : r.buyer_details}</div>
                      <div className="text-[11px]" style={{ color: C.textMuted }}>{isBill ? `${r.expense_head} · ${r.payment_type}` : <><span className="mono">{r.invoice_no}</span> · GST {r.tax_percent}%</>}</div>
                    </td>
                    <td className="px-3 py-3 text-[12px] whitespace-nowrap" style={{ color: C.textSecondary }}>{dt(isBill ? r.bill_date : r.invoice_date)}</td>
                    <td className="px-3 py-3 text-right text-[12.5px] font-semibold" style={{ color: C.textPrimary }}>{inr(total)}</td>
                    <td className="px-3 py-3 text-right text-[12px]" style={{ color: C.textSecondary }}>{inr(r.paid_amount)}</td>
                    <td className="px-3 py-3"><Pill small meta={PAY_STATUS[r.amount_type]} /></td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        {due > 0 && <Btn variant="success" icon={isBill ? 'ti-cash' : 'ti-cash-banknote'} onClick={() => onPay(r, due)} className="!px-2.5 !py-1.5 !text-[11.5px]">{isBill ? 'Pay' : 'Receive'}</Btn>}
                        <IconBtn icon="ti-trash" danger title="Delete" loading={busy === r.id} onClick={() => onDelete(r)} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

const statusCounts = (list) => {
  const c = { all: list?.length || 0 }
  Object.keys(PAY_STATUS).forEach(k => { c[k] = list?.filter(r => r.amount_type === k).length || 0 })
  return c
}

function BillsTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [heads, setHeads] = useState([])
  const [status, setStatus] = useState('all')
  const [adding, setAdding] = useState(false)
  const [paying, setPaying] = useState(null)
  const [busy, setBusy] = useState(null)
  const load = useCallback(() => getBills().then(setList), [])
  useEffect(() => { load(); getHeads().then(setHeads) }, [load])
  const counts = useMemo(() => statusCounts(list), [list])

  return (
    <>
      <DuesList list={list} kind="bill" statusFilter={status} onStatus={setStatus} counts={counts} busy={busy}
        onAdd={() => setAdding(true)} onPay={(r, due) => setPaying({ r, due })}
        onDelete={async (r) => { if (!window.confirm(`Delete bill from ${r.vendor_name}?`)) return; setBusy(r.id); await deleteBill(r.id); setBusy(null); load(); onChange(); toast(`Deleted — ${r.vendor_name}`) }} />
      {adding && <BillModal heads={heads} onClose={() => setAdding(false)} onSaved={(r) => { setAdding(false); load(); onChange(); toast(`Bill added — ${r.vendor_name}`) }} />}
      {paying && <PaymentModal title={`Pay ${paying.r.vendor_name}`} due={paying.due} onClose={() => setPaying(null)}
        onPay={async (amt) => { await payBill(paying.r.id, amt); setPaying(null); load(); onChange(); toast(`Payment recorded — ${inr(amt)}`) }} />}
    </>
  )
}

function BillModal({ heads, onClose, onSaved }) {
  const [f, setF] = useState({ vendor_name: '', bill_amount: '', expense_head: heads[0] || '', bill_date: today(), payment_type: PAYMENT_TYPES[0], paid_amount: '', narration: '', comments: '' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  return (
    <Modal title="Add vendor bill" onClose={onClose} width={580}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Vendor name"><Input value={f.vendor_name} onChange={e => set('vendor_name', e.target.value)} /></Field>
        <Field label="Bill amount (₹)"><Input type="number" min="0" value={f.bill_amount} onChange={e => set('bill_amount', e.target.value)} /></Field>
        <Field label="Expense head"><Select value={f.expense_head} onChange={e => set('expense_head', e.target.value)} className="w-full">{heads.map(h => <option key={h}>{h}</option>)}</Select></Field>
        <Field label="Bill date"><Input type="date" value={f.bill_date} onChange={e => set('bill_date', e.target.value)} /></Field>
        <Field label="Payment type"><Select value={f.payment_type} onChange={e => set('payment_type', e.target.value)} className="w-full">{PAYMENT_TYPES.map(p => <option key={p}>{p}</option>)}</Select></Field>
        <Field label="Already paid (₹)"><Input type="number" min="0" value={f.paid_amount} onChange={e => set('paid_amount', e.target.value)} placeholder="0" /></Field>
      </div>
      <Field label="Narration">
        <div className="flex gap-2 items-start">
          <textarea value={f.narration} onChange={e => set('narration', e.target.value)} rows={2} className="mk-input w-full text-[13px] px-3 py-2 rounded-xl" style={textareaStyle} />
          <Btn icon="ti-sparkles" onClick={() => set('narration', suggestNarration({ type: 'Expense', party: f.vendor_name, head: f.expense_head, amount: f.bill_amount, date: f.bill_date }))}>Suggest</Btn>
        </div>
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-device-floppy" loading={busy} disabled={!f.vendor_name.trim() || !(Number(f.bill_amount) > 0)} onClick={async () => { setBusy(true); onSaved(await createBill(f)) }}>Save bill</Btn>
      </div>
    </Modal>
  )
}

function InvoicesTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [status, setStatus] = useState('all')
  const [adding, setAdding] = useState(false)
  const [paying, setPaying] = useState(null)
  const [busy, setBusy] = useState(null)
  const load = useCallback(() => getInvoices().then(setList), [])
  useEffect(() => { load() }, [load])
  const counts = useMemo(() => statusCounts(list), [list])

  return (
    <>
      <DuesList list={list} kind="invoice" statusFilter={status} onStatus={setStatus} counts={counts} busy={busy}
        onAdd={() => setAdding(true)} onPay={(r, due) => setPaying({ r, due })}
        onDelete={async (r) => { if (!window.confirm(`Delete invoice ${r.invoice_no}?`)) return; setBusy(r.id); await deleteInvoice(r.id); setBusy(null); load(); onChange(); toast(`Deleted — ${r.invoice_no}`) }} />
      {adding && <InvoiceModal onClose={() => setAdding(false)} onSaved={(r) => { setAdding(false); load(); onChange(); toast(`Invoice raised — ${r.invoice_no}`) }} />}
      {paying && <PaymentModal title={`Receive ${paying.r.invoice_no}`} due={paying.due} onClose={() => setPaying(null)}
        onPay={async (amt) => { await receiveInvoice(paying.r.id, amt); setPaying(null); load(); onChange(); toast(`Receipt recorded — ${inr(amt)}`) }} />}
    </>
  )
}

function InvoiceModal({ onClose, onSaved }) {
  const [f, setF] = useState({ invoice_no: nextInvoiceNo(), invoice_date: today(), buyer_details: '', amount_details: '', invoice_amount: '', tax_percent: 18, paid_amount: '', payment_type: PAYMENT_TYPES[0], narration: '', comments: '' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  const total = Math.round((Number(f.invoice_amount) || 0) * (1 + (Number(f.tax_percent) || 0) / 100))
  return (
    <Modal title="Raise invoice" onClose={onClose} width={580}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Invoice no."><Input value={f.invoice_no} onChange={e => set('invoice_no', e.target.value)} className="mono" /></Field>
        <Field label="Invoice date"><Input type="date" value={f.invoice_date} onChange={e => set('invoice_date', e.target.value)} /></Field>
        <Field label="Bill to (client)"><Input value={f.buyer_details} onChange={e => set('buyer_details', e.target.value)} placeholder="e.g. MBSE School" /></Field>
        <Field label="Item / service"><Input value={f.amount_details} onChange={e => set('amount_details', e.target.value)} placeholder="e.g. EasyLearn subscription" /></Field>
        <Field label="Amount before tax (₹)"><Input type="number" min="0" value={f.invoice_amount} onChange={e => set('invoice_amount', e.target.value)} /></Field>
        <Field label="GST %"><Select value={String(f.tax_percent)} onChange={e => set('tax_percent', Number(e.target.value))} className="w-full">{[0, 5, 12, 18, 28].map(t => <option key={t} value={t}>{t}%</option>)}</Select></Field>
        <Field label="Already received (₹)"><Input type="number" min="0" value={f.paid_amount} onChange={e => set('paid_amount', e.target.value)} placeholder="0" /></Field>
        <Field label="Payment type"><Select value={f.payment_type} onChange={e => set('payment_type', e.target.value)} className="w-full">{PAYMENT_TYPES.map(p => <option key={p}>{p}</option>)}</Select></Field>
      </div>
      <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
        <span className="text-[12px]" style={{ color: C.textSecondary }}>Total incl. GST</span>
        <span className="text-[15px] font-extrabold" style={{ color: THEME.accentDeep }}>{inr(total)}</span>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-device-floppy" loading={busy} disabled={!f.invoice_no.trim() || !f.buyer_details.trim() || !(Number(f.invoice_amount) > 0)}
          onClick={async () => { setBusy(true); onSaved(await createInvoice({ ...f, narration: f.narration || suggestNarration({ type: 'Income', party: f.buyer_details, head: f.amount_details, amount: total, date: f.invoice_date }) })) }}>Raise invoice</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Activity ───────── */

function ActivityTab() {
  const [audit, setAudit] = useState(null)
  useEffect(() => { getAccountAudit().then(setAudit) }, [])
  return (
    <Card>
      <CardHeader title="Activity log" sub="Entries, bills, invoices and payments" />
      {!audit ? <Loader /> : audit.length === 0 ? <Empty>No activity yet.</Empty> : audit.map(a => (
        <div key={a.id} className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: C.surfaceAlt, color: C.textPrimary }}>{a.by[0]}</span>
          <div className="min-w-0 flex-1"><div className="text-[12.5px]" style={{ color: C.textPrimary }}><b>{a.by}</b> · {a.action}</div><div className="text-[11.5px] truncate" style={{ color: C.textMuted }}>{a.target}</div></div>
          <span className="text-[11px] shrink-0" style={{ color: C.textMuted }}>{timeAgo(a.at)}</span>
        </div>
      ))}
    </Card>
  )
}
