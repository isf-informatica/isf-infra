import api from './axios'
import { toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Account Manager API layer — LIVE (EasyReach backend /easyreach/accounts).

   Ported from isf-api accounting/main.py + mbse manageAccounts.php.
   Same function names/shapes as the old demo layer, so AccountView.jsx barely
   changes. nextInvoiceNo() stays synchronous: it returns the number the server
   suggested on the last invoice-list load (GET /accounts/next-invoice-no).
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

/* Simple stand-in for isf-api POST /generate-narration (Gemini). */
export const suggestNarration = ({ type, party, head, amount, date }) => {
  const amt = `₹${Number(amount || 0).toLocaleString('en-IN')}`
  const on = date ? ` on ${new Date(date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}` : ''
  if (type === 'Income') return `Being ${amt} received${party ? ` from ${party}` : ''} towards ${head || 'income'}${on}.`
  return `Being ${amt} paid${party ? ` to ${party}` : ''} towards ${head || 'expenses'}${on}.`
}

const B = '/easyreach/accounts'
const d = (res) => res.data?.data ?? res.data
const fail = (e, msg) => new Error(e?.response?.data?.detail || msg, { cause: e })
// backend audit targets look like "TXN-1 - Rs 845000" — show them like the page does
const prettyTarget = (t) => (t || '').replace(/ - Rs (\d+)$/, (_, n) => ` · ₹${Number(n).toLocaleString('en-IN')}`).replace(/ - /, ' · ')

/* ── Summary ── */
// GET /easyreach/accounts/summary
export const getAccountSummary = async () => (await api.get(`${B}/summary`)).data

/* ── Expense heads ── */
// GET /easyreach/accounts/heads
export const getHeads = async () => d(await api.get(`${B}/heads`))
// POST /easyreach/accounts/heads  → full head list
export const addHead = async (name) => d(await api.post(`${B}/heads`, { name }))

/* ── Books of accounts ── */
// GET /easyreach/accounts/books
export const getBooks = async () => d(await api.get(`${B}/books`))

// POST /easyreach/accounts/books
export const createBook = async (data) => {
  const body = { ...data, amount: Number(data.amount) || 0, conversion_rate: Number(data.conversion_rate) || 83.4, estimate_amount: Number(data.estimate_amount) || 0 }
  try { return d(await api.post(`${B}/books`, body)) } catch (e) { throw fail(e, 'Could not save entry') }
}

// DELETE /easyreach/accounts/books/{id}
export const deleteBook = async (id) => (await api.delete(`${B}/books/${id}`)).data

export const exportBooks = async (rows) =>
  toCsvBlob(['Transaction ID', 'Date', 'Type', 'Expense head', 'Narration', 'Debit (INR)', 'Credit (INR)', 'Amount (USD)', 'Bill no', 'Comment'],
    rows.map(b => [b.transaction_id, b.transaction_date, b.category_name, b.expense_head, b.narration, b.debit_amount, b.credit_amount, b.amount_in_usd, b.bill_no, b.comment]))

/* ── Bills (payables) ── */
// GET /easyreach/accounts/bills
export const getBills = async () => d(await api.get(`${B}/bills`))

// POST /easyreach/accounts/bills
export const createBill = async (data) => {
  const body = { ...data, bill_amount: Number(data.bill_amount) || 0, paid_amount: Number(data.paid_amount) || 0, bill_date: data.bill_date || null }
  try { return d(await api.post(`${B}/bills`, body)) } catch (e) { throw fail(e, 'Could not save bill') }
}

// POST /easyreach/accounts/bills/{id}/pay   (record a payment against a bill)
export const payBill = async (id, amount) => {
  try { return d(await api.post(`${B}/bills/${id}/pay`, { amount: Number(amount) || 0 })) } catch (e) { throw fail(e, 'Could not record payment') }
}

// DELETE /easyreach/accounts/bills/{id}
export const deleteBill = async (id) => (await api.delete(`${B}/bills/${id}`)).data

/* ── Invoices (receivables) ── */
let nextNo = `ISF/INV/${new Date().getFullYear()}/1`
const refreshNextNo = async () => {
  try { nextNo = (await api.get(`${B}/next-invoice-no`)).data.invoice_no || nextNo } catch { /* keep last */ }
}

// GET /easyreach/accounts/invoices   (+ refreshes the suggested next invoice number)
export const getInvoices = async () => {
  const [rows] = await Promise.all([api.get(`${B}/invoices`), refreshNextNo()])
  return d(rows)
}

// POST /easyreach/accounts/invoices
export const createInvoice = async (data) => {
  const body = { ...data, invoice_amount: Number(data.invoice_amount) || 0, tax_percent: Number(data.tax_percent) || 0, paid_amount: Number(data.paid_amount) || 0, invoice_date: data.invoice_date || null }
  try {
    const row = d(await api.post(`${B}/invoices`, body))
    await refreshNextNo()
    return row
  } catch (e) { throw fail(e, 'Could not raise invoice') }
}

// POST /easyreach/accounts/invoices/{id}/receive
export const receiveInvoice = async (id, amount) => {
  try { return d(await api.post(`${B}/invoices/${id}/receive`, { amount: Number(amount) || 0 })) } catch (e) { throw fail(e, 'Could not record receipt') }
}

// DELETE /easyreach/accounts/invoices/{id}
export const deleteInvoice = async (id) => (await api.delete(`${B}/invoices/${id}`)).data

// Suggested next number (from the server, refreshed on every invoice list load / new invoice)
export const nextInvoiceNo = () => nextNo

/* ── Audit ── */
// GET /easyreach/accounts/audit
export const getAccountAudit = async () => d(await api.get(`${B}/audit`)).map(r => ({ ...r, target: prettyTarget(r.target) }))
