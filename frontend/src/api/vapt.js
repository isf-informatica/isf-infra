import api from './axios'
import { toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   VAPT console — LIVE backend.
   Real SAFE, non-intrusive scans (DNS resolve, TCP connect port scan, TLS/cert
   inspection, HTTP security-header review). No exploitation / brute force / payloads.
   Admin must confirm the target is authorised before a scan starts.
   Endpoints: /easyreach/vapt/...   Page (pages/vapt/VaptView.jsx) unchanged.
   ───────────────────────────────────────────────────────────────────────────── */

export const SEVERITY = {
  critical: { label: 'Critical', color: '#B5322A', bg: '#FDEEEC', border: '#F6C3BE', min: 9.0, rank: 4 },
  high: { label: 'High', color: '#C2410C', bg: '#FFF1E8', border: '#FED7AA', min: 7.0, rank: 3 },
  medium: { label: 'Medium', color: '#8A6816', bg: '#FBF3E0', border: '#E7D39C', min: 4.0, rank: 2 },
  low: { label: 'Low', color: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC', min: 0.1, rank: 1 },
  info: { label: 'Info', color: '#5C5C57', bg: '#F2F2EE', border: '#D5D5CE', min: 0.0, rank: 0 },
}
export const sevOf = (cvss) => Object.keys(SEVERITY).find(k => cvss >= SEVERITY[k].min) || 'info'

export const SCAN_TYPES = {
  network: { label: 'Network / Port scan', icon: 'ti-network', desc: 'Open ports, services & versions' },
  web: { label: 'Web application', icon: 'ti-world-www', desc: 'Headers, TLS & misconfig' },
  api: { label: 'API security', icon: 'ti-api', desc: 'CORS, headers, info exposure' },
  infra: { label: 'Infrastructure', icon: 'ti-server-2', desc: 'Exposed services & ports' },
  cloud: { label: 'Cloud security', icon: 'ti-cloud', desc: 'Exposed endpoints & TLS' },
}

export const OWASP = [
  ['A01', 'Broken Access Control'], ['A02', 'Cryptographic Failures'], ['A03', 'Injection'],
  ['A04', 'Insecure Design'], ['A05', 'Security Misconfiguration'], ['A06', 'Vulnerable & Outdated Components'],
  ['A07', 'Identification & Authentication Failures'], ['A08', 'Software & Data Integrity Failures'],
  ['A09', 'Security Logging & Monitoring Failures'], ['A10', 'Server-Side Request Forgery (SSRF)'],
]

export const FRAMEWORKS = ['ISO/IEC 27001', 'SOC 2', 'PCI DSS', 'NIST CSF', 'GDPR']

// GET /vapt/summary
export const getVaptSummary = async () => {
  const res = await api.get('/easyreach/vapt/summary')
  return res.data
}

/* ── Scans ── */
// GET /vapt/scans
export const getScans = async () => {
  const res = await api.get('/easyreach/vapt/scans')
  return res.data.data || []
}

// POST /vapt/scans   { target, type, project, authorized }
export const startScan = async ({ target, type, project, authorized }) => {
  const res = await api.post('/easyreach/vapt/scans', { target, type, project, authorized: !!authorized })
  return res.data.data
}

/* ── Findings ── */
// GET /vapt/findings
export const getFindings = async () => {
  const res = await api.get('/easyreach/vapt/findings')
  return res.data.data || []
}

// PATCH /vapt/findings/{id}   { status }
export const setFindingStatus = async (id, status) => {
  const res = await api.patch(`/easyreach/vapt/findings/${id}`, { status })
  return res.data.data
}

// Findings CSV — built client-side from rows the page already has.
export const exportFindings = async (rows) => {
  return toCsvBlob(
    ['Severity', 'CVSS', 'Title', 'OWASP', 'Asset', 'Status', 'Remediation', 'First seen'],
    (rows || []).map(f => [SEVERITY[f.severity]?.label || f.severity, f.cvss, f.title, f.owasp, f.asset, f.status, f.fix,
      f.firstSeen ? new Date(f.firstSeen).toLocaleDateString('en-IN') : '']))
}

/* ── Compliance mapping ── */
// GET /vapt/compliance
export const getCompliance = async () => {
  const res = await api.get('/easyreach/vapt/compliance')
  return res.data
}

/* ── Scheduled scans ── */
// GET /vapt/schedule
export const getSchedule = async () => {
  const res = await api.get('/easyreach/vapt/schedule')
  return res.data.data
}
// PATCH /vapt/schedule
export const saveSchedule = async (sch) => {
  const res = await api.patch('/easyreach/vapt/schedule', sch)
  return res.data.data
}

/* ── Reports (aggregate + log server-side; PDF rendered client-side) ── */
// POST /vapt/reports
export const generateReport = async (kind, onStep) => {
  const steps = kind === 'executive'
    ? ['Aggregating findings', 'Building risk heatmap', 'Writing executive summary', 'Rendering PDF']
    : ['Aggregating findings', 'CVSS score table', 'Remediation plan & SLA', 'Compliance mapping', 'Rendering PDF']
  for (let i = 0; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, 250 + Math.random() * 350))
    onStep?.(i, steps)
  }
  const res = await api.post('/easyreach/vapt/reports', { kind })
  return { ...res.data, steps }
}

/* ── Audit ── */
// GET /vapt/audit
export const getAudit = async () => {
  const res = await api.get('/easyreach/vapt/audit')
  return res.data.data || []
}
