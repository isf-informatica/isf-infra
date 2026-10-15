import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, FileText, CheckCircle2, XCircle, Eye, Upload, AlertTriangle } from 'lucide-react'
import Reveal from '../../components/common/Reveal.jsx'
import Button from '../../components/common/Button.jsx'
import { kycTerms } from '../../data/kycTerms.js'
import { apiGet, apiPost, apiUpload, openProtectedFile } from '../../lib/api.js'
import { FM_DASH } from '../../config.js'

/**
 * KYC Module — review desk for ONE applicant:
 *   pick a pending application → check details + KYC documents →
 *   accept the terms → Verify & Approve (moves to KYC List) or Reject.
 * Open directly for an applicant with  ?id=<request id>  (Requests → Review).
 */
const DOC_TYPES = {
  passport: 'Passport',
  government_id: 'Government ID',
  company_registration: 'Company registration certificate',
  address_proof: 'Address proof',
  bank_proof: 'Bank proof'
}

function formatSize(bytes) {
  if (!bytes) return ''
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-mist-400">{label}</p>
      <p className="text-sm text-mist-100 mt-0.5 break-words">{value || '—'}</p>
    </div>
  )
}

export default function KycModulePage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const selectedId = params.get('id') || ''

  const [agreed, setAgreed] = useState(false)
  const [status, setStatus] = useState('idle') // idle | verifying | verified | rejected
  const [pending, setPending] = useState([])
  const [applicant, setApplicant] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadType, setUploadType] = useState('')
  const [uploading, setUploading] = useState(false)

  // pending applications for the picker
  useEffect(() => {
    apiGet('/requests?status=pending')
      .then(setPending)
      .catch((err) => setError(err.message))
  }, [status])

  // selected applicant's details + documents
  useEffect(() => {
    setApplicant(null)
    setAgreed(false)
    setStatus('idle')
    setError('')
    if (!selectedId) return
    setLoading(true)
    apiGet(`/requests/${selectedId}`)
      .then((a) => {
        setApplicant(a)
        setUploadType(a.required_document?.doc_type ?? 'address_proof')
        if (a.status === 'approved') setStatus('verified')
        if (a.status === 'rejected') setStatus('rejected')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedId])

  const requiredType = applicant?.required_document?.doc_type
  const hasRequiredDoc = !!applicant?.documents?.some((d) => d.doc_type === requiredType)

  async function decide(decision) {
    setError('')
    setStatus('verifying')
    try {
      // POST /fortimates/requests/{id}/decision — approval needs the required document
      const updated = await apiPost(`/requests/${applicant.id}/decision`, { decision })
      setApplicant((a) => ({ ...a, ...updated }))
      setStatus(decision === 'approved' ? 'verified' : 'rejected')
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  async function uploadDoc(file) {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('doc_type', uploadType)
      fd.append('file', file)
      const doc = await apiUpload(`/requests/${applicant.id}/documents`, fd)
      setApplicant((a) => ({ ...a, documents: [...(a.documents ?? []), doc] }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function viewDoc(doc) {
    try {
      await openProtectedFile(`/documents/${doc.id}/download`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Reveal>
        <p className="text-sm text-mist-400">
          Select a pending application, check the KYC documents, accept the terms and verify the account.
        </p>
      </Reveal>

      {/* Applicant picker */}
      <Reveal delay={0.05}>
        <div className="p-6 bg-facet-card border border-white/5 clip-facet">
          <label className="text-xs text-mist-400">Application</label>
          <select
            value={selectedId}
            onChange={(e) => setParams(e.target.value ? { id: e.target.value } : {})}
            className="mt-1.5 w-full px-3 py-2.5 bg-abyss-950 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 clip-facet-r"
          >
            <option value="">— Select a pending application —</option>
            {applicant && applicant.status !== 'pending' && (
              <option value={applicant.id}>{applicant.name} ({applicant.status})</option>
            )}
            {pending.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.type} · {p.email}
              </option>
            ))}
          </select>
          {pending.length === 0 && !selectedId && (
            <p className="mt-3 text-xs text-mist-400">
              No pending applications. Add one from{' '}
              <button onClick={() => navigate(`${FM_DASH}/requests`)} className="text-signal-400 hover:text-signal-300">
                Requests → New Application
              </button>
              .
            </p>
          )}
        </div>
      </Reveal>

      {error && (
        <p className="flex items-center gap-2 text-xs text-red-400">
          <AlertTriangle size={14} /> {error}
        </p>
      )}
      {loading && <p className="text-sm text-mist-400">Loading application…</p>}

      {applicant && (
        <>
          {/* Details */}
          <div className="p-6 bg-facet-card border border-white/5 clip-facet grid sm:grid-cols-3 gap-5">
            <Detail label="Name" value={applicant.name} />
            <Detail label="Email" value={applicant.email} />
            <Detail label="Phone" value={applicant.phone} />
            <Detail label="Account type" value={applicant.type} />
            <Detail label="Country" value={applicant.country} />
            <Detail label="ID number" value={applicant.id_number} />
            <Detail label="Bank" value={applicant.bank_name} />
            <Detail label="Bank category" value={applicant.bank_category} />
            <Detail label="Status" value={applicant.status} />
          </div>

          {/* Documents */}
          <div className="p-6 bg-facet-card border border-white/5 clip-facet-r">
            <h3 className="text-sm font-semibold text-mist-100">KYC documents</h3>
            {applicant.required_document && (
              <p className={`mt-1 text-xs ${hasRequiredDoc ? 'text-signal-400' : 'text-amber-400'}`}>
                Required for approval: {applicant.required_document.label} {hasRequiredDoc ? '✓' : '(missing)'}
              </p>
            )}

            <div className="mt-4 divide-y divide-white/5">
              {(applicant.documents ?? []).length === 0 && (
                <p className="py-3 text-xs text-mist-400">No documents uploaded yet.</p>
              )}
              {(applicant.documents ?? []).map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-mist-100">{d.label ?? DOC_TYPES[d.doc_type] ?? d.doc_type}</p>
                    <p className="text-xs text-mist-400 truncate">
                      {d.file_name} {d.file_size ? `· ${formatSize(d.file_size)}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => viewDoc(d)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-signal-500/10 text-signal-400 hover:bg-signal-500/20 clip-facet-r shrink-0"
                  >
                    <Eye size={13} /> View
                  </button>
                </div>
              ))}
            </div>

            {applicant.status === 'pending' && (
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-3">
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="px-3 py-2 bg-abyss-950 border border-white/10 text-xs text-mist-100 outline-none clip-facet-r"
                >
                  {Object.entries(DOC_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 px-3 py-2 text-xs bg-white/5 text-mist-200 hover:bg-white/10 cursor-pointer clip-facet-r">
                  <Upload size={13} />
                  {uploading ? 'Uploading…' : 'Upload document'}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      uploadDoc(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Terms (unchanged content) */}
          {applicant.status === 'pending' && (
            <div className="p-6 bg-facet-card border border-white/5 clip-facet">
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-signal-400 mt-0.5 shrink-0" />
                <h3 className="text-sm font-semibold text-mist-100">Terms of Use</h3>
              </div>

              <div className="mt-4 max-h-64 overflow-y-auto pr-2 space-y-4">
                {kycTerms.sections.map((section) => (
                  <div key={section.heading}>
                    <h4 className="text-xs font-semibold text-mist-200">{section.heading}</h4>
                    <p className="mt-1 text-xs text-mist-400 leading-relaxed">{section.body}</p>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 mt-5 pt-4 border-t border-white/5 text-xs text-mist-300">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 accent-signal-500"
                />
                {kycTerms.consentLine}
              </label>
            </div>
          )}

          {/* Verify */}
          <div className="p-8 bg-facet-card border border-white/5 clip-facet-r text-center">
            {status === 'idle' && (
              <>
                <ShieldCheck size={36} className="mx-auto text-signal-400" />
                <p className="mt-3 text-sm text-mist-300">Ready to verify this account's identity.</p>
                {!hasRequiredDoc && (
                  <p className="mt-1 text-xs text-amber-400">Upload the required document to enable verification.</p>
                )}
                <div className="mt-5 flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={() => decide('rejected')} className="!py-2.5 !px-4 !text-xs">
                    Reject
                  </Button>
                  <Button variant="primary" onClick={() => decide('approved')} disabled={!agreed || !hasRequiredDoc}>
                    Verify &amp; Approve
                  </Button>
                </div>
              </>
            )}

            {status === 'verifying' && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-9 h-9 mx-auto border-2 border-signal-400 border-t-transparent rounded-full"
                />
                <p className="mt-4 text-sm text-mist-300">Saving decision…</p>
              </>
            )}

            {status === 'verified' && (
              <>
                <CheckCircle2 size={36} className="mx-auto text-signal-400" />
                <p className="mt-3 text-sm text-mist-100 font-medium">Identity verified</p>
                <p className="mt-1 text-xs text-mist-400">This account now appears in the KYC List.</p>
                <Button variant="ghost" className="mt-4 !text-xs" onClick={() => navigate(`${FM_DASH}/kyc-list`)}>
                  Open KYC List →
                </Button>
              </>
            )}

            {status === 'rejected' && (
              <>
                <XCircle size={36} className="mx-auto text-red-400" />
                <p className="mt-3 text-sm text-mist-100 font-medium">Application rejected</p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
