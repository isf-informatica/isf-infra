import { latency, uid, minsAgo, clone, currentUser, createStore, toCsvBlob } from './mdmDemoStore'

/* ─────────────────────────────────────────────────────────────────────────────
   VAPT (Vulnerability Assessment & Penetration Testing) — management console.

   ⚠️ DEMO MODE — this is a read-only reporting/management UI with mock findings.
   It does NOT scan or attack anything. When the real backend is ready, replace
   each function body with the commented endpoint above it; the page
   (pages/vapt/VaptView.jsx) does not need any change.
   Reset demo data: localStorage.removeItem('easyreach_vapt_store_v1')
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
  web: { label: 'Web application', icon: 'ti-world-www', desc: 'OWASP Top 10 web checks' },
  api: { label: 'API security', icon: 'ti-api', desc: 'Auth, rate-limit, data exposure' },
  infra: { label: 'Infrastructure', icon: 'ti-server-2', desc: 'Servers, OS & misconfig' },
  cloud: { label: 'Cloud security', icon: 'ti-cloud', desc: 'Buckets, IAM, exposed services' },
}

// OWASP Top 10 (2021) — categories findings map to.
export const OWASP = [
  ['A01', 'Broken Access Control'], ['A02', 'Cryptographic Failures'], ['A03', 'Injection'],
  ['A04', 'Insecure Design'], ['A05', 'Security Misconfiguration'], ['A06', 'Vulnerable & Outdated Components'],
  ['A07', 'Identification & Authentication Failures'], ['A08', 'Software & Data Integrity Failures'],
  ['A09', 'Security Logging & Monitoring Failures'], ['A10', 'Server-Side Request Forgery (SSRF)'],
]

export const FRAMEWORKS = ['ISO/IEC 27001', 'SOC 2', 'PCI DSS', 'NIST CSF', 'GDPR']

/* Findings written at report level: what the weakness is + how to fix it.
   No exploitation steps or payloads. */
const FINDINGS = [
  { title: 'Outdated TLS 1.0/1.1 still accepted', cvss: 7.4, owasp: 'A02', asset: 'easylearn.org.in', type: 'web',
    summary: 'The server negotiates deprecated TLS 1.0/1.1 protocols, which have known weaknesses.',
    fix: 'Disable TLS 1.0/1.1 at the web server / load balancer; allow only TLS 1.2+ with modern cipher suites.', frameworks: ['PCI DSS', 'ISO/IEC 27001'] },
  { title: 'Missing security headers (CSP, HSTS, X-Frame-Options)', cvss: 5.3, owasp: 'A05', asset: 'easylearn.org.in', type: 'web',
    summary: 'Responses lack Content-Security-Policy, Strict-Transport-Security and anti-clickjacking headers.',
    fix: 'Add CSP, HSTS (with preload), X-Content-Type-Options and X-Frame-Options at the server or CDN.', frameworks: ['ISO/IEC 27001'] },
  { title: 'API endpoint returns verbose stack traces on error', cvss: 6.1, owasp: 'A05', asset: 'api.easylearn.org.in', type: 'api',
    summary: 'Unhandled errors return internal stack traces and framework versions to the client.',
    fix: 'Return generic error responses in production; log details server-side only and set DEBUG=false.', frameworks: ['SOC 2'] },
  { title: 'No rate limiting on login endpoint', cvss: 7.5, owasp: 'A07', asset: 'api.easylearn.org.in', type: 'api',
    summary: 'The authentication endpoint accepts unlimited attempts, allowing credential-stuffing at scale.',
    fix: 'Add per-IP and per-account rate limiting, exponential back-off and account lockout thresholds.', frameworks: ['ISO/IEC 27001', 'SOC 2'] },
  { title: 'Public S3 bucket lists objects', cvss: 8.2, owasp: 'A05', asset: 'AWS S3 — easylearn-media', type: 'cloud',
    summary: 'The media bucket allows anonymous listing of all stored objects.',
    fix: 'Block public access on the bucket, serve media via signed URLs or CloudFront OAI, audit bucket policy.', frameworks: ['PCI DSS', 'GDPR'] },
  { title: 'JWT accepted without expiry validation', cvss: 9.1, owasp: 'A07', asset: 'api.easylearn.org.in', type: 'api',
    summary: 'Tokens past their expiry are still accepted by some endpoints, extending session lifetime indefinitely.',
    fix: 'Validate the exp claim on every request, use short-lived access tokens with refresh tokens, rotate signing keys.', frameworks: ['ISO/IEC 27001', 'SOC 2'] },
  { title: 'Server exposes SSH (22) to the internet', cvss: 5.9, owasp: 'A05', asset: '103.21.58.0/24 (DO droplet)', type: 'infra',
    summary: 'SSH is reachable from any source IP, increasing brute-force exposure.',
    fix: 'Restrict SSH to a VPN/bastion or allow-listed IPs, disable password auth, use key-only access.', frameworks: ['ISO/IEC 27001'] },
  { title: 'Outdated Nginx version with known CVEs', cvss: 7.0, owasp: 'A06', asset: '103.21.58.0/24 (DO droplet)', type: 'infra',
    summary: 'The running Nginx build is several releases behind and has published CVEs.',
    fix: 'Upgrade Nginx to the current stable release and enable automatic security updates.', frameworks: ['ISO/IEC 27001'] },
  { title: 'Mixed content on login page', cvss: 4.3, owasp: 'A02', asset: 'infrapoint.co.in', type: 'web',
    summary: 'Some assets on the HTTPS login page load over HTTP, weakening transport security.',
    fix: 'Serve all assets over HTTPS and add an upgrade-insecure-requests CSP directive.', frameworks: [] },
  { title: 'Session cookie missing Secure & HttpOnly flags', cvss: 5.4, owasp: 'A05', asset: 'easylearn.org.in', type: 'web',
    summary: 'Session cookies can be sent over HTTP and read by client-side scripts.',
    fix: 'Set Secure, HttpOnly and SameSite=Strict on all session cookies.', frameworks: ['SOC 2'] },
  { title: 'Directory listing enabled on /uploads', cvss: 5.0, owasp: 'A05', asset: 'infrapoint.co.in', type: 'web',
    summary: 'The uploads directory returns a browsable index of files.',
    fix: 'Disable autoindex and restrict direct access to upload directories.', frameworks: [] },
  { title: 'Verbose server banner reveals software versions', cvss: 3.1, owasp: 'A05', asset: 'dolphin-app-33jp4.ondigitalocean.app', type: 'api',
    summary: 'HTTP response headers disclose exact server and framework versions.',
    fix: 'Suppress Server / X-Powered-By headers to reduce information disclosure.', frameworks: [] },
  { title: 'CORS policy allows any origin with credentials', cvss: 7.1, owasp: 'A05', asset: 'api.easylearn.org.in', type: 'api',
    summary: 'The API reflects Access-Control-Allow-Origin: * together with credentials.',
    fix: 'Allow-list specific trusted origins and never combine wildcard origin with credentials.', frameworks: ['SOC 2', 'ISO/IEC 27001'] },
  { title: 'Default admin path reachable (/admin)', cvss: 4.8, owasp: 'A01', asset: 'easylearn.org.in', type: 'web',
    summary: 'The admin console is reachable at a predictable path without network restriction.',
    fix: 'Move admin behind VPN/IP allow-list, enforce MFA, rename default paths.', frameworks: ['ISO/IEC 27001'] },
  { title: 'Password reset tokens do not expire', cvss: 6.5, owasp: 'A07', asset: 'api.easylearn.org.in', type: 'api',
    summary: 'Reset links remain valid indefinitely once issued.',
    fix: 'Expire reset tokens after a short window and invalidate on use.', frameworks: ['SOC 2'] },
]

const seed = () => {
  const findings = FINDINGS.map((f, i) => ({
    id: `vf_${i + 1}`, ...f, severity: sevOf(f.cvss),
    status: i < 9 ? 'open' : i < 12 ? 'fixed' : 'accepted',
    firstSeen: minsAgo(60 * 24 * (3 + i)), scanId: null,
  }))
  const scans = [
    { id: 'sc_01', target: 'easylearn.org.in', type: 'web', project: 'ISF Internal', status: 'completed', progress: 100, startedAt: minsAgo(60 * 5), finishedAt: minsAgo(60 * 4.6), by: 'Yash', found: { critical: 0, high: 2, medium: 3, low: 1, info: 2 } },
    { id: 'sc_02', target: 'api.easylearn.org.in', type: 'api', project: 'ISF Internal', status: 'completed', progress: 100, startedAt: minsAgo(60 * 26), finishedAt: minsAgo(60 * 25.4), by: 'Yash', found: { critical: 1, high: 2, medium: 2, low: 0, info: 1 } },
    { id: 'sc_03', target: 'AWS S3 — easylearn-media', type: 'cloud', project: 'ISF Internal', status: 'completed', progress: 100, startedAt: minsAgo(60 * 50), finishedAt: minsAgo(60 * 49.7), by: 'Shyam', found: { critical: 0, high: 1, medium: 0, low: 0, info: 0 } },
    { id: 'sc_04', target: '103.21.58.0/24 (DO droplet)', type: 'infra', project: 'ISF Internal', status: 'completed', progress: 100, startedAt: minsAgo(60 * 74), finishedAt: minsAgo(60 * 73), by: 'Shyam', found: { critical: 0, high: 1, medium: 1, low: 0, info: 0 } },
  ]
  return {
    findings, scans,
    schedule: { enabled: true, frequency: 'weekly', day: 'Sun', time: '02:00', scope: 'All production targets' },
    audit: [
      { id: 'va_1', at: minsAgo(60 * 4.6), by: 'Yash', action: 'Completed web scan', target: 'easylearn.org.in' },
      { id: 'va_2', at: minsAgo(60 * 24 * 2), by: 'Shyam', action: 'Marked finding as fixed', target: 'Missing X-Frame-Options' },
      { id: 'va_3', at: minsAgo(60 * 24 * 3), by: 'Yash', action: 'Accepted risk (compensating control)', target: 'Verbose server banner' },
    ],
  }
}

const store = createStore('easyreach_vapt_store_v1', seed)
const S = () => store.get()
const audit = (action, target) => store.set(s => { s.audit.unshift({ id: uid('va'), at: new Date().toISOString(), by: currentUser(), action, target }) })

const riskScore = (findings) => {
  const open = findings.filter(f => f.status === 'open')
  if (!open.length) return 0
  const w = { critical: 25, high: 12, medium: 5, low: 1, info: 0 }
  const raw = open.reduce((t, f) => t + w[f.severity], 0)
  return Math.min(100, Math.round(raw))
}

// GET /vapt/summary
export const getVaptSummary = async () => {
  await latency()
  const s = S()
  const open = s.findings.filter(f => f.status === 'open')
  const bySev = {}
  Object.keys(SEVERITY).forEach(k => { bySev[k] = open.filter(f => f.severity === k).length })
  const score = riskScore(s.findings)
  return {
    openVulns: open.length,
    critical: bySev.critical, high: bySev.high, medium: bySev.medium, low: bySev.low, info: bySev.info,
    bySeverity: bySev,
    scans: s.scans.length,
    lastScan: s.scans[0]?.finishedAt,
    assets: new Set(s.findings.map(f => f.asset)).size,
    fixed: s.findings.filter(f => f.status === 'fixed').length,
    riskScore: score,
    riskLabel: score >= 70 ? 'High' : score >= 40 ? 'Elevated' : score >= 15 ? 'Moderate' : 'Low',
    running: s.scans.some(x => x.status === 'running'),
    topAssets: Object.entries(open.reduce((a, f) => { a[f.asset] = (a[f.asset] || 0) + 1; return a }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5),
  }
}

/* ── Scans ── */
// GET /vapt/scans
export const getScans = async () => {
  await latency(200, 400)
  tickScans()
  return clone(S().scans).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
}

// POST /vapt/scans
export const startScan = async ({ target, type, project }) => {
  await latency(500, 900)
  const sc = { id: uid('sc'), target, type, project, status: 'running', progress: 0, startedAt: new Date().toISOString(), finishedAt: null, by: currentUser(), found: { critical: 0, high: 0, medium: 0, low: 0, info: 0 } }
  store.set(s => { s.scans.unshift(sc) })
  audit(`Started ${SCAN_TYPES[type].label}`, target)
  return clone(sc)
}

function tickScans() {
  store.set(s => {
    s.scans.forEach(sc => {
      if (sc.status !== 'running') return
      const el = (Date.now() - new Date(sc.startedAt).getTime()) / 1000
      sc.progress = Math.min(100, Math.round(el * 11 + Math.random() * 6))
      if (sc.progress >= 100) {
        sc.status = 'completed'
        sc.finishedAt = new Date().toISOString()
        // surface the findings that belong to this target
        const matched = s.findings.filter(f => f.asset === sc.target)
        const f = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
        matched.forEach(m => { f[m.severity]++ })
        sc.found = f
      }
    })
  })
}

/* ── Vulnerabilities ── */
// GET /vapt/findings
export const getFindings = async () => { await latency(); return clone(S().findings) }

// PATCH /vapt/findings/{id}   { status }
export const setFindingStatus = async (id, status) => {
  await latency(400, 700)
  let f
  store.set(s => { f = s.findings.find(x => x.id === id); f.status = status })
  audit(status === 'fixed' ? 'Marked finding as fixed' : status === 'accepted' ? 'Accepted risk' : 'Reopened finding', f.title)
  return clone(f)
}

// GET /vapt/findings/export
export const exportFindings = async (rows) => {
  await latency(400, 700)
  return toCsvBlob(['Severity', 'CVSS', 'Title', 'OWASP', 'Asset', 'Status', 'Remediation', 'First seen'],
    rows.map(f => [SEVERITY[f.severity].label, f.cvss, f.title, f.owasp, f.asset, f.status, f.fix, new Date(f.firstSeen).toLocaleDateString('en-IN')]))
}

/* ── Compliance mapping ── */
// GET /vapt/compliance
export const getCompliance = async () => {
  await latency()
  const open = S().findings.filter(f => f.status === 'open')
  const owasp = OWASP.map(([id, name]) => {
    const hits = open.filter(f => f.owasp === id)
    return { id, name, count: hits.length, worst: hits.length ? Math.max(...hits.map(h => SEVERITY[h.severity].rank)) : -1 }
  })
  const frameworks = FRAMEWORKS.map(fw => {
    const related = S().findings.filter(f => f.frameworks.includes(fw))
    const openCount = related.filter(f => f.status === 'open').length
    const total = related.length
    return { name: fw, open: openCount, total, passed: total - openCount, pct: total ? Math.round(((total - openCount) / total) * 100) : null }
  })
  return { owasp, frameworks }
}

/* ── Scheduled scans ── */
// GET/PATCH /vapt/schedule
export const getSchedule = async () => { await latency(200, 400); return clone(S().schedule) }
export const saveSchedule = async (sch) => { await latency(400, 700); store.set(s => { s.schedule = sch }); audit('Updated scan schedule', `${sch.frequency} · ${sch.time}`); return clone(sch) }

/* ── Reports ── */
// POST /vapt/reports   (generate executive / technical PDF)
export const generateReport = async (kind, onStep) => {
  const steps = kind === 'executive'
    ? ['Aggregating findings', 'Building risk heatmap', 'Writing executive summary', 'Rendering PDF']
    : ['Aggregating findings', 'CVSS score table', 'Remediation plan & SLA', 'Compliance mapping', 'Rendering PDF']
  for (let i = 0; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400))
    onStep?.(i, steps)
  }
  const s = S()
  const open = s.findings.filter(f => f.status === 'open')
  audit(`Generated ${kind} report`, `${open.length} open findings`)
  return {
    kind, generatedAt: new Date().toISOString(), by: currentUser(),
    openFindings: open.length, critical: open.filter(f => f.severity === 'critical').length,
    high: open.filter(f => f.severity === 'high').length, riskScore: riskScore(s.findings), steps,
  }
}

// GET /vapt/audit
export const getAudit = async () => { await latency(); return clone(S().audit) }
