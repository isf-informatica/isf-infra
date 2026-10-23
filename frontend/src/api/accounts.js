import { latency, uid, minsAgo, clone, currentUser, createStore, toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Account Manager API layer.

   Ported from:
     • isf-api/accounting/main.py   (FastAPI — books-of-accounts, bills,
       invoices, generate-narration)
     • easylearnv3 (mbse branch) app/Views/Easylearn/manageAccounts.php
       (Books of Accounts, expense heads, credit/debit in INR)

   ⚠️ DEMO MODE — the isf-infra backend has no accounting endpoints yet. Each
   function keeps the same async signature a real call would have; replace
   the body with the commented endpoint above it (isf-api paths) when wired
   in. The page (pages/accounts/AccountView.jsx) does not need any change.
   Reset demo data: localStorage.removeItem('easyreach_accounts_store_v1')
   ───────────────────────────────────────────────────────────────────────────── */

// category_name in books-of-accounts
export const ENTRY_TYPES = {
  Income: { label: 'Income', color: '#17B26A', bg: '#ECFDF5', border: '#A7E9C8', icon: 'ti-arrow-down-left' },
  Expense: { label: 'Expense', color: '#8A2A2A', bg: '#FBEAE9', border: '#EFC4C1', icon: 'ti-arrow-up-right' },
}

export const PAYMENT_TYPES = ['Bank transfer', 'UPI', 'Cheque', 'Cash', 'Card']

// amount_type on bills / invoices
export const PAY_STATUS = {
  paid: { label: 'Paid', color: '#17B26A', bg: '#ECFDF5', border: '#A7E9C8', icon: 'ti-circle-check' },
  partial: { label: 'Partially paid', color: '#8A6816', bg: '#FBF3E0', border: '#E7D39C', icon: 'ti-progress' },
  unpaid: { label: 'Unpaid', color: '#8A2A2A', bg: '#FBEAE9', border: '#EFC4C1', icon: 'ti-clock' },
}
export const payStatusOf = (total, paid) => (paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid')

const dateIso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10)

/* Simple stand-in for isf-api POST /generate-narration (Gemini). */
export const suggestNarration = ({ type, party, head, amount, date }) => {
  const amt = `₹${Number(amount || 0).toLocaleString('en-IN')}`
  const on = date ? ` on ${new Date(date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}` : ''
  if (type === 'Income') return `Being ${amt} received${party ? ` from ${party}` : ''} towards ${head || 'income'}${on}.`
  return `Being ${amt} paid${party ? ` to ${party}` : ''} towards ${head || 'expenses'}${on}.`
}

const seed = () => {
  const heads = ['Tuition Fees', 'Transport Fees', 'Salaries', 'Electricity', 'Internet & Hosting', 'Maintenance', 'Stationery', 'Software Licenses', 'Events', 'Grants & Donations']
  const books = [
    [2, 'Income', 'Tuition Fees', 'Term 2 tuition fee collection — Grade 1 to 5', 0, 845000, 'RCPT-2291'],
    [3, 'Expense', 'Salaries', 'Teaching staff salary — September', 612000, 0, 'SAL-0925'],
    [5, 'Expense', 'Electricity', 'MSEDCL bill — main campus', 48200, 0, 'MSEB-77821'],
    [6, 'Income', 'Transport Fees', 'Bus fee collection — Route 1 to 6', 0, 186000, 'RCPT-2297'],
    [8, 'Expense', 'Internet & Hosting', 'DigitalOcean + AWS S3 — monthly', 23400, 0, 'DO-INV-5521'],
    [11, 'Expense', 'Maintenance', 'Generator AMC — Kirloskar', 42000, 0, 'KIR-1182'],
    [13, 'Income', 'Grants & Donations', 'CSR grant — smart classroom', 0, 350000, 'CSR-0042'],
    [15, 'Expense', 'Software Licenses', 'EasyLearn annual license', 120000, 0, 'ISF-TI-2026-118'],
    [18, 'Expense', 'Stationery', 'Exam answer sheets & printing', 17800, 0, 'STN-449'],
    [21, 'Expense', 'Events', 'Annual sports day arrangements', 64500, 0, 'EVT-0091'],
    [24, 'Income', 'Tuition Fees', 'Late fee & re-admission charges', 0, 38500, 'RCPT-2310'],
  ].map(([d, type, head, narration, debit, credit, bill], i) => ({
    id: 5001 + i, transaction_id: `TXN-${(260900 + i * 7).toString()}`, transaction_date: dateIso(d),
    expense_head: head, category_name: type, narration, amount_in_usd: Math.round(((debit || credit) / 83.4) * 100) / 100,
    amount_in_euro: 0, conversion_rate: 83.4, transfer_charge_euro: 0,
    credit_amount: credit, debit_amount: debit, estimate_amount: 0, bill_no: bill, comment: '',
    added_by: i % 2 ? 'Shyam' : 'Yash',
  }))
  const bills = [
    ['MSEDCL', 48200, 'Electricity', 5, 'Bank transfer', 48200],
    ['Kirloskar Oil Engines', 42000, 'Maintenance', 11, 'Cheque', 21000],
    ['Navneet Stationers', 17800, 'Stationery', 18, 'UPI', 17800],
    ['Sai Events & Tent House', 64500, 'Events', 21, 'Bank transfer', 0],
    ['Airtel Business', 9800, 'Internet & Hosting', 2, 'Bank transfer', 0],
  ].map(([vendor, amt, head, d, pay, paid], i) => ({
    id: 7001 + i, vendor_name: vendor, bill_amount: amt, expense_head: head, bill_date: dateIso(d),
    payment_type: pay, paid_amount: paid, amount_type: payStatusOf(amt, paid),
    narration: suggestNarration({ type: 'Expense', party: vendor, head, amount: amt, date: dateIso(d) }), comments: '',
  }))
  const invoices = [
    ['ISF/INV/2026/118', 15, 'MBSE School', 18, 101695, 0],
    ['ISF/INV/2026/121', 9, 'Pimpri Chinchwad University', 18, 254237, 150000],
    ['ISF/INV/2026/124', 4, 'MET School Nashik', 18, 67797, 80000],
    ['ISF/INV/2026/126', 1, 'Vocational SkillMaster', 18, 42373, 0],
  ].map(([no, d, buyer, tax, amt, paid], i) => {
    const total = Math.round(amt * (1 + tax / 100))
    return {
      id: 8001 + i, invoice_no: no, invoice_date: dateIso(d), seller_details: 'ISF Analytica & Informatica Pvt. Ltd.', buyer_details: buyer,
      tax_percent: tax, amount_details: 'EasyLearn subscription', invoice_amount: amt, total_amount: total,
      paid_amount: Math.min(paid, total), amount_type: payStatusOf(total, Math.min(paid, total)), payment_type: 'Bank transfer',
      narration: suggestNarration({ type: 'Income', party: buyer, head: 'EasyLearn subscription', amount: total, date: dateIso(d) }), comments: '',
    }
  })
  return {
    heads, books, bills, invoices,
    audit: [
      { id: 'aa_1', at: minsAgo(60 * 5), by: 'Yash', action: 'Added book entry', target: 'TXN-260970 · ₹38,500' },
      { id: 'aa_2', at: minsAgo(60 * 30), by: 'Shyam', action: 'Recorded bill payment', target: 'Kirloskar Oil Engines' },
    ],
  }
}

const store = createStore('easyreach_accounts_store_v1', seed)
const S = () => store.get()
const audit = (action, target) => store.set(s => { s.audit.unshift({ id: uid('aa'), at: new Date().toISOString(), by: currentUser(), action, target }) })
const nextId = (rows, base) => Math.max(base, ...rows.map(r => r.id)) + 1

/* ── Summary ── */
// (aggregated from GET /books-of-accounts/, /bills/, /invoices/)
export const getAccountSummary = async () => {
  await latency()
  const s = S()
  const income = s.books.reduce((t, b) => t + b.credit_amount, 0)
  const expense = s.books.reduce((t, b) => t + b.debit_amount, 0)
  const byHead = {}
  s.books.forEach(b => { if (b.debit_amount) byHead[b.expense_head] = (byHead[b.expense_head] || 0) + b.debit_amount })
  const payables = s.bills.reduce((t, b) => t + (b.bill_amount - b.paid_amount), 0)
  const receivables = s.invoices.reduce((t, i) => t + (i.total_amount - i.paid_amount), 0)

  // last 6 months income vs expense
  const months = []
  for (let k = 5; k >= 0; k--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - k)
    const key = d.toISOString().slice(0, 7)
    const rows = s.books.filter(b => b.transaction_date.startsWith(key))
    months.push({ key, label: d.toLocaleDateString('en-IN', { month: 'short' }), income: rows.reduce((t, b) => t + b.credit_amount, 0), expense: rows.reduce((t, b) => t + b.debit_amount, 0) })
  }
  return {
    income, expense, net: income - expense, entries: s.books.length,
    payables, receivables,
    unpaidBills: s.bills.filter(b => b.amount_type !== 'paid').length,
    unpaidInvoices: s.invoices.filter(i => i.amount_type !== 'paid').length,
    byHead: Object.entries(byHead).sort((a, b) => b[1] - a[1]),
    months,
  }
}

/* ── Expense heads ── */
export const getHeads = async () => { await latency(150, 300); return clone(S().heads) }
export const addHead = async (name) => {
  await latency(200, 400)
  const n = name.trim()
  if (!n || S().heads.some(h => h.toLowerCase() === n.toLowerCase())) return clone(S().heads)
  store.set(s => { s.heads.push(n) })
  audit('Added expense head', n)
  return clone(S().heads)
}

/* ── Books of accounts ── */
// GET /books-of-accounts/
export const getBooks = async () => { await latency(); return clone(S().books).sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)) }

// POST /books-of-accounts/
export const createBook = async (data) => {
  await latency(400, 700)
  const isIncome = data.category_name === 'Income'
  const amount = Number(data.amount) || 0
  const rate = Number(data.conversion_rate) || 83.4
  const row = {
    id: nextId(S().books, 5000), transaction_id: data.transaction_id || `TXN-${Date.now().toString().slice(-6)}`,
    transaction_date: data.transaction_date, expense_head: data.expense_head, category_name: data.category_name,
    narration: data.narration, amount_in_usd: Math.round((amount / rate) * 100) / 100, amount_in_euro: 0,
    conversion_rate: rate, transfer_charge_euro: 0, credit_amount: isIncome ? amount : 0, debit_amount: isIncome ? 0 : amount,
    estimate_amount: Number(data.estimate_amount) || 0, bill_no: data.bill_no || '', comment: data.comment || '', added_by: currentUser(),
  }
  store.set(s => { s.books.push(row) })
  audit('Added book entry', `${row.transaction_id} · ₹${amount.toLocaleString('en-IN')}`)
  return clone(row)
}

// DELETE /books-of-accounts/{book_id}/delete
export const deleteBook = async (id) => {
  await latency(300, 500)
  const row = S().books.find(b => b.id === id)
  store.set(s => { s.books = s.books.filter(b => b.id !== id) })
  audit('Deleted book entry', row?.transaction_id)
  return { ok: true }
}

// GET /books-of-accounts/template  (CSV export of current rows)
export const exportBooks = async (rows) => {
  await latency(300, 600)
  return toCsvBlob(['Transaction ID', 'Date', 'Type', 'Expense head', 'Narration', 'Debit (INR)', 'Credit (INR)', 'Amount (USD)', 'Bill no', 'Comment'],
    rows.map(b => [b.transaction_id, b.transaction_date, b.category_name, b.expense_head, b.narration, b.debit_amount, b.credit_amount, b.amount_in_usd, b.bill_no, b.comment]))
}

/* ── Bills (payables) ── */
// GET /bills/
export const getBills = async () => { await latency(); return clone(S().bills).sort((a, b) => b.bill_date.localeCompare(a.bill_date)) }

// POST /bills/
export const createBill = async (data) => {
  await latency(400, 700)
  const amt = Number(data.bill_amount) || 0
  const paid = Math.min(amt, Number(data.paid_amount) || 0)
  const row = { id: nextId(S().bills, 7000), ...data, bill_amount: amt, paid_amount: paid, amount_type: payStatusOf(amt, paid) }
  store.set(s => { s.bills.push(row) })
  audit('Added bill', `${row.vendor_name} · ₹${amt.toLocaleString('en-IN')}`)
  return clone(row)
}

// POST /bills/{id}/payment   (record a payment against a bill)
export const payBill = async (id, amount) => {
  await latency(300, 600)
  let b
  store.set(s => {
    b = s.bills.find(x => x.id === id)
    b.paid_amount = Math.min(b.bill_amount, b.paid_amount + (Number(amount) || 0))
    b.amount_type = payStatusOf(b.bill_amount, b.paid_amount)
  })
  audit('Recorded bill payment', b.vendor_name)
  return clone(b)
}

// DELETE /bills/{bill_id}/delete
export const deleteBill = async (id) => { await latency(300, 500); store.set(s => { s.bills = s.bills.filter(b => b.id !== id) }); return { ok: true } }

/* ── Invoices (receivables) ── */
// GET /invoices/
export const getInvoices = async () => { await latency(); return clone(S().invoices).sort((a, b) => b.invoice_date.localeCompare(a.invoice_date)) }

// POST /invoices/
export const createInvoice = async (data) => {
  await latency(400, 700)
  const amt = Number(data.invoice_amount) || 0
  const tax = Number(data.tax_percent) || 0
  const total = Math.round(amt * (1 + tax / 100))
  const paid = Math.min(total, Number(data.paid_amount) || 0)
  const row = {
    id: nextId(S().invoices, 8000), seller_details: 'ISF Analytica & Informatica Pvt. Ltd.', ...data,
    invoice_amount: amt, tax_percent: tax, total_amount: total, paid_amount: paid, amount_type: payStatusOf(total, paid),
  }
  store.set(s => { s.invoices.push(row) })
  audit('Raised invoice', `${row.invoice_no} · ${row.buyer_details}`)
  return clone(row)
}

// POST /invoices/{id}/payment
export const receiveInvoice = async (id, amount) => {
  await latency(300, 600)
  let inv
  store.set(s => {
    inv = s.invoices.find(x => x.id === id)
    inv.paid_amount = Math.min(inv.total_amount, inv.paid_amount + (Number(amount) || 0))
    inv.amount_type = payStatusOf(inv.total_amount, inv.paid_amount)
  })
  audit('Recorded invoice receipt', inv.invoice_no)
  return clone(inv)
}

// DELETE /invoices/{invoice_id}/delete
export const deleteInvoice = async (id) => { await latency(300, 500); store.set(s => { s.invoices = s.invoices.filter(i => i.id !== id) }); return { ok: true } }

export const nextInvoiceNo = () => {
  const n = Math.max(0, ...S().invoices.map(i => Number(String(i.invoice_no).split('/').pop()) || 0)) + 1
  return `ISF/INV/${new Date().getFullYear()}/${n}`
}

/* ── Audit ── */
export const getAccountAudit = async () => { await latency(200, 400); return clone(S().audit) }
