import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload, FileCheck2 } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import { apiUpload } from '../../lib/api.js'

/**
 * New applicant + KYC documents  →  POST /easyreach/fortimates/applications
 * The main document depends on the account type (the one needed for approval).
 */
const TYPES = ['With Passport', 'Without Passport', 'Corporate']

const MAIN_DOC = {
  'With Passport': { label: 'Passport', hint: 'Photo page of the passport' },
  'Without Passport': { label: 'Government ID', hint: 'Aadhaar / PAN / Driving licence' },
  Corporate: { label: 'Company registration certificate', hint: 'Certificate of incorporation / GST certificate' }
}

const ID_LABEL = {
  'With Passport': 'Passport number',
  'Without Passport': 'ID number',
  Corporate: 'Company registration no.'
}

const inputClass =
  'w-full px-3 py-2.5 border border-white/10 focus:border-signal-500/60 outline-none text-sm clip-facet-r'

// Solid colours set inline so the form is never see-through, even if the
// FortiMates Tailwind colours (abyss/mist/signal) are missing from tailwind.config.js
const COLORS = {
  overlay: 'rgba(3, 7, 16, 0.88)',
  panel: '#0A1730',
  input: '#050B18',
  text: '#F4F7FC',
  muted: '#AAB8D6',
  activeTabBg: 'rgba(43, 196, 217, 0.15)',
  activeTabText: '#4FD6E8'
}
const inputStyle = { background: COLORS.input, color: COLORS.text }

const EMPTY = {
  type: 'With Passport',
  name: '',
  email: '',
  phone: '',
  country: '',
  id_number: '',
  bank_name: ''
}

function FileField({ label, hint, required, file, onChange }) {
  return (
    <label className="block">
      <span className="text-xs text-mist-400">
        {label} {required && <span className="text-amber-400">*</span>}
      </span>
      <div
        className="mt-1.5 flex items-center gap-3 px-3 py-2.5 border border-dashed border-white/15 hover:border-signal-500/50 cursor-pointer clip-facet-r transition-colors"
        style={{ background: COLORS.input }}
      >
        {file ? <FileCheck2 size={16} className="text-signal-400 shrink-0" /> : <Upload size={16} className="text-mist-400 shrink-0" />}
        <span className={`text-xs truncate ${file ? 'text-mist-100' : 'text-mist-400'}`}>
          {file ? file.name : hint}
        </span>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </label>
  )
}

export default function NewApplicationForm({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY)
  const [mainDoc, setMainDoc] = useState(null)
  const [addressProof, setAddressProof] = useState(null)
  const [bankProof, setBankProof] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const corporate = form.type === 'Corporate'

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!mainDoc) {
      setError(`Upload the ${MAIN_DOC[form.type].label} — it is required for KYC approval.`)
      return
    }
    const tooBig = [mainDoc, addressProof, bankProof].find((f) => f && f.size > 5 * 1024 * 1024)
    if (tooBig) {
      setError(`${tooBig.name} is larger than 5 MB.`)
      return
    }
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.append('bank_category', corporate ? 'Corporate' : 'Retail')
    fd.append('main_document', mainDoc)
    if (addressProof) fd.append('address_proof', addressProof)
    if (bankProof) fd.append('bank_proof', bankProof)

    setSaving(true)
    try {
      const created = await apiUpload('/applications', fd)
      onCreated?.(created)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Rendered into .fm-root (not inside the table card) — the card's animation/clip-path
  // would otherwise trap and cut off a fixed-position modal.
  const target = document.querySelector('.fm-root') ?? document.body

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10"
      style={{ background: COLORS.overlay }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-2xl border border-white/10 clip-facet p-6 space-y-5 shadow-2xl"
        style={{ background: COLORS.panel, color: COLORS.text }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-mist-100">New application</h3>
            <p className="text-xs text-mist-400 mt-1">Applicant details and KYC documents (JPG, PNG or PDF, max 5 MB each).</p>
          </div>
          <button type="button" onClick={onClose} className="text-mist-400 hover:text-mist-100">
            <X size={18} />
          </button>
        </div>

        {/* Account type */}
        <div className="flex border border-white/10 clip-facet-r overflow-hidden">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, type: t }))
                setMainDoc(null)
              }}
              className="flex-1 py-2.5 text-xs font-medium transition-colors"
              style={
                form.type === t
                  ? { background: COLORS.activeTabBg, color: COLORS.activeTabText }
                  : { background: 'transparent', color: COLORS.muted }
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-mist-400">{corporate ? 'Company name' : 'Full name'} <span className="text-amber-400">*</span></span>
            <input required value={form.name} onChange={set('name')} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>
          <label className="block">
            <span className="text-xs text-mist-400">Email <span className="text-amber-400">*</span></span>
            <input required type="email" value={form.email} onChange={set('email')} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>
          <label className="block">
            <span className="text-xs text-mist-400">Phone</span>
            <input value={form.phone} onChange={set('phone')} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>
          <label className="block">
            <span className="text-xs text-mist-400">Country</span>
            <input value={form.country} onChange={set('country')} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>
          <label className="block">
            <span className="text-xs text-mist-400">{ID_LABEL[form.type]}</span>
            <input value={form.id_number} onChange={set('id_number')} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>
          <label className="block">
            <span className="text-xs text-mist-400">Bank name</span>
            <input value={form.bank_name} onChange={set('bank_name')} className={`${inputClass} mt-1.5`} style={inputStyle} />
          </label>
        </div>

        <div className="space-y-3 pt-1">
          <p className="text-xs font-semibold text-mist-200">KYC documents</p>
          <FileField
            label={MAIN_DOC[form.type].label}
            hint={MAIN_DOC[form.type].hint}
            required
            file={mainDoc}
            onChange={(f) => {
              setMainDoc(f)
              setError('')
            }}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <FileField label="Address proof" hint="Utility bill / rent agreement" file={addressProof} onChange={setAddressProof} />
            <FileField label="Bank proof" hint="Cancelled cheque / bank statement" file={bankProof} onChange={setBankProof} />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} className="!py-2.5 !px-4 !text-xs">
            Cancel
          </Button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 text-xs font-semibold clip-facet-r disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
            style={{ background: 'linear-gradient(120deg, #F5AE0E 0%, #FFC94A 45%, #4FD6E8 100%)', color: '#050B18' }}
          >
            {saving ? 'Submitting…' : 'Submit application'}
          </button>
        </div>
      </form>
    </div>,
    target
  )
}