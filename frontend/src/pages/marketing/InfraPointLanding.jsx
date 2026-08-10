import { useNavigate } from 'react-router-dom'
import heroBg from '../../assets/hero-bg.png'
import logo from '../../assets/logo.png'

const BG = '#E8E8E3'
const INK = '#1A1A18'
const SUB = '#5C5C57'

function BtnPrimary({ children, onClick }) {
  return (
    <button onClick={onClick} className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white"
      style={{ background: INK }}>
      {children}
    </button>
  )
}

function BtnOutline({ children, onClick }) {
  return (
    <button onClick={onClick} className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold border"
      style={{ borderColor: INK, color: INK, background: 'transparent' }}>
      {children}
    </button>
  )
}

export default function InfraPointLanding() {
  const navigate = useNavigate()

  return (
    <div style={{ background: BG, color: INK }} className="font-sans min-h-screen">

      {/* ═══════════════ NAV ═══════════════ */}
      <header className="sticky top-0 z-50 border-b" style={{ background: BG, borderColor: '#1A1A18' + '1A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="InfraPoint" className="h-6 sm:h-7 w-auto" />
            <span className="text-xs sm:text-sm font-bold tracking-tight">INFRAPOINT</span>
          </div>
          <button onClick={() => navigate('/login')} className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 border" style={{ borderColor: INK }}>
            Sign in
          </button>
        </div>
      </header>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden flex items-center min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.14]" />
        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-[1.08] max-w-3xl">
            One console. Every system you run.
          </h1>
          <p className="text-sm sm:text-base mt-4 sm:mt-5 max-w-xl sm:max-w-2xl leading-relaxed" style={{ color: SUB }}>
            InfraPoint is the unified infrastructure and security management platform built for
            institutions that run too many tools, across too many locations, with too little visibility.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-7 sm:mt-8 max-w-xs sm:max-w-none">
            <BtnPrimary onClick={() => navigate('/login')}>Request a Demo</BtnPrimary>
            <BtnOutline onClick={() => navigate('/login')}>Explore Modules</BtnOutline>
          </div>
        </div>
      </section>

      {/* ═══════════════ ABOUT ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <span className="inline-block text-[11px] font-semibold tracking-wide uppercase border border-[#1A1A18]/30 px-2.5 py-1 mb-4"
          style={{ color: INK }}>
          About InfraPoint
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">What is InfraPoint?</h2>

        <div className="grid md:grid-cols-[1fr_320px] gap-8 md:gap-10 mt-6">
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: SUB }}>
            <p>
              InfraPoint is a unified admin console built by <strong style={{ color: INK }}>ISF Analytica & Informatica Pvt. Ltd.</strong> that
              brings together device management, network monitoring, document control, cloud
              infrastructure, digital rights protection, communication security, vulnerability testing,
              surveillance, and IoT utility tracking — all into a single, role-based dashboard.
            </p>
            <p>
              Instead of juggling separate logins and tools for every system your institution runs,
              administrators manage everything from one point. InfraPoint delivers real-time visibility
              and centralized control across every physical and digital system — whether you operate
              one campus or hundreds of branches.
            </p>
          </div>
          <div className="p-6" style={{ background: INK }}>
            <p className="text-white text-sm font-bold uppercase tracking-wide mb-4">Built for</p>
            <ul className="space-y-2.5">
              {['K–12 schools and college districts', 'Government bodies and public agencies', 'Multi-branch enterprises', 'EdTech platforms and content publishers'].map((t) => (
                <li key={t} className="text-[13px] text-white/85 flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-white/60 shrink-0"></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════════ PROBLEM ═══════════════ */}
      <section className="border-y" style={{ background: '#DEDFD8', borderColor: '#1A1A18' + '14' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-16 pb-16 sm:pb-20">
        <span className="inline-block text-[11px] font-semibold tracking-wide uppercase border border-[#1A1A18]/30 px-2.5 py-1 mb-4"
          style={{ color: INK }}>
          The problem
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight max-w-3xl">
          Too many tools. Too many blind spots.
        </h2>
        <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: SUB }}>
          Institutions today run separate platforms for device management, network security, document
          storage, and compliance — each with its own login, its own team, and its own blind spots.
          When something goes wrong, administrators are left piecing together data from six different
          dashboards. Nobody has one place to answer the question:{' '}
          <strong style={{ color: INK }}>"Is everything okay right now?"</strong>
        </p>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 mt-10">
          {[
            { title: 'Fragmented tools', text: 'Separate logins and interfaces for every system create operational silos and slow down response times.' },
            { title: 'No unified visibility', text: 'Without a single pane of glass, critical alerts are missed and cross-system issues go undetected.' },
            { title: 'Compliance gaps', text: 'Scattered data and inconsistent reporting make it nearly impossible to demonstrate compliance at audit time.' },
            { title: 'Resource drain', text: 'IT teams waste hours context-switching between platforms instead of resolving issues and driving value.' },
          ].map((p) => (
            <div key={p.title} className="p-6 border" style={{ background: '#D7D8D1', borderColor: '#1A1A18' + '14' }}>
              <p className="text-sm font-bold uppercase tracking-wide">{p.title}</p>
              <p className="text-[13px] mt-2 leading-relaxed" style={{ color: SUB }}>{p.text}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ═══════════════ SOLUTION ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-lg">
              InfraPoint solves it
            </h2>
            <p className="text-sm mt-5 max-w-md leading-relaxed" style={{ color: SUB }}>
              InfraPoint unifies monitoring, control, and reporting into one console with role-based
              access — so every administrator, from the institution level to the master account, sees
              exactly what they need and nothing they don't.
            </p>

            <div className="mt-10 space-y-8">
              {[
                { title: 'Unify', text: 'Consolidate every tool your institution runs into a single, authenticated dashboard.' },
                { title: 'Monitor', text: 'Get real-time status across devices, networks, documents, cloud, and physical infrastructure.' },
                { title: 'Control', text: "Take action — remotely lock a device, flag a vulnerability, or approve a document — without switching tools." },
                { title: 'Report', text: 'Generate compliance-ready, exportable reports across every module, project, and institution.' },
              ].map((s) => (
                <div key={s.title} className="flex items-start gap-4">
                  <i className="ti ti-arrow-right text-xl mt-1 shrink-0" style={{ color: SUB }} aria-hidden="true"></i>
                  <div>
                    <p className="text-lg font-bold uppercase tracking-wide">{s.title}</p>
                    <p className="text-sm mt-1.5 leading-relaxed max-w-md" style={{ color: SUB }}>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[360px] lg:h-[620px] lg:sticky lg:top-24 overflow-hidden rounded-2xl border" style={{ borderColor: '#1A1A18' + '14' }}>
            <img
              src={heroBg}
              alt="InfraPoint infrastructure network"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 100%', transform: 'scale(1.3)' }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════ MODULES ═══════════════ */}
      <section className="border-t" style={{ background: '#DEDFD8', borderColor: '#1A1A18' + '14' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 mb-4"
            style={{ color: SUB }}>
            Platform modules
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">
            Nine modules. One platform.
          </h2>
          <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: SUB }}>
            Each InfraPoint module addresses a distinct operational domain. Together, they form a
            complete infrastructure and security management ecosystem.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10 mt-12">
            {[
              { icon: 'ti-device-laptop', name: 'InfraDC', text: 'Remote device management — control, lock, wipe, and monitor every device from one place.' },
              { icon: 'ti-shield-lock', name: 'InfraDRM', text: 'Digital Rights Management — protect and license digital content across your network.' },
              { icon: 'ti-affiliate', name: 'InfraNet', text: 'Network monitoring — real-time visibility into connectivity and infrastructure health.' },
              { icon: 'ti-file-text', name: 'InfraDMS', text: 'Document Management System — centralized, secure document storage and workflows.' },
              { icon: 'ti-cloud', name: 'InfraCloud', text: 'Cloud infrastructure layer — storage, backup, and hosting for all InfraPoint modules.' },
              { icon: 'ti-mail', name: 'FortiMates', text: 'Verified-ID email and call system — eliminate fraud with sender verification and call tracking.' },
              { icon: 'ti-shield-check', name: 'VAPT', text: 'Vulnerability Assessment and Penetration Testing — find and fix security gaps before attackers do.' },
              { icon: 'ti-video', name: 'InfraSurveillance', text: 'Camera and physical monitoring — live feeds and incident alerts across all sites.' },
              { icon: 'ti-gauge', name: 'SmartMeters', text: 'IoT utility tracking — monitor electricity, water, and resource usage in real time.' },
            ].map((m) => (
              <div key={m.name}>
                <i className={`ti ${m.icon} text-3xl`} style={{ color: INK }} aria-hidden="true"></i>
                <p className="text-lg font-extrabold uppercase tracking-tight mt-4" style={{ color: SUB }}>{m.name}</p>
                <p className="text-sm mt-2 leading-relaxed max-w-md" style={{ color: SUB }}>{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ROLES ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <span className="inline-block text-[11px] font-semibold tracking-wide uppercase border border-[#1A1A18]/30 px-2.5 py-1 mb-4"
          style={{ color: INK }}>
          Access control
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight max-w-3xl">
          Role-based access across every module
        </h2>
        <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: SUB }}>
          InfraPoint's role hierarchy ensures every user — from a master administrator to an
          institution-level manager — sees exactly the scope they need. Access is governed centrally
          and enforced across every module.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-x-6 gap-y-14 mt-16">
          {[
            { n: '1', title: 'Master', text: 'Full configuration access across all projects, modules, and institutions.', span: 'lg:col-span-2' },
            { n: '2', title: 'Project Manager', text: 'Manages a specific deployment — overseeing all districts and institutions within it.', span: 'lg:col-span-2' },
            { n: '3', title: 'Project Supervisor', text: 'Manages specific districts or functions such as health, inventory, or grievance resolution.', span: 'lg:col-span-2' },
            { n: '4', title: 'Institution Manager', text: "Manages a single institution's data, devices, and operational status.", span: 'lg:col-span-3' },
            { n: '5', title: 'Service Provider', text: 'Installation and servicing partner with scoped, read/write access limited to assigned tasks.', span: 'lg:col-span-3' },
          ].map((r) => (
            <div key={r.n} className={`relative ${r.span}`}>
              <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center text-base font-extrabold"
                style={{ background: '#DEDFD8', color: INK }}>
                {r.n}
              </div>
              <div className="p-6 border-t-4" style={{ borderTopColor: '#B9BAB2', borderLeft: '1px solid ' + INK + '14', borderRight: '1px solid ' + INK + '14', borderBottom: '1px solid ' + INK + '14' }}>
                <p className="text-xl font-extrabold uppercase tracking-tight" style={{ color: SUB }}>{r.title}</p>
                <p className="text-sm mt-3 leading-relaxed" style={{ color: SUB }}>{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ MODULE 1: INFRADC ═══════════════ */}
      <section style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 mb-4"
            style={{ color: '#94A3B8' }}>
            Module 1
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-3xl text-white">
            InfraDC — Device Control
          </h2>
          <p className="italic text-base mt-6 max-w-3xl" style={{ color: '#CBD5E1' }}>
            Every device, under control — from one screen.
          </p>
          <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: '#94A3B8' }}>
            InfraDC is InfraPoint's device management module for interactive displays, laptops, and
            Android and Windows devices deployed across institutions. It gives administrators complete
            remote control over enrollment, security policies, app access, and content — with real-time
            location and usage tracking built in.
          </p>
          <button className="mt-8 px-5 py-3 text-sm font-bold border border-white text-white">
            Learn More About InfraDC
          </button>
        </div>
      </section>

      {/* ═══════════════ INFRADC KEY FEATURES ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-3xl">
          InfraDC — Key Features
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 mt-10">
          {[
            { icon: 'ti-clipboard-list', title: 'Device Overview', text: 'List and grid views of all devices showing online/offline status, battery level, and last-seen location.' },
            { icon: 'ti-device-mobile', title: 'Remote Management', text: 'Enroll, unenroll, configure, lock, or wipe any device remotely — no physical access required.' },
            { icon: 'ti-apps', title: 'App Control', text: 'Blacklist or whitelist applications; push custom apps and updates across device groups.' },
            { icon: 'ti-shield-lock', title: 'Security Policies', text: 'Disable camera, Wi-Fi, or external storage per device or group; enforce data encryption policies.' },
            { icon: 'ti-map-pin', title: 'Geo-Fencing', text: 'Set institute location as center point; receive alerts if any device leaves the configured radius.' },
            { icon: 'ti-wifi', title: 'Wi-Fi Fencing', text: 'Alert when a device connects to any unauthorized or unrecognized wireless network.' },
          ].map((f) => (
            <div key={f.title} className="p-6" style={{ background: '#D7D8D1' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#C7C8C1' }}>
                <i className={`ti ${f.icon} text-xl`} style={{ color: INK }} aria-hidden="true"></i>
              </div>
              <p className="text-lg font-extrabold uppercase tracking-tight mt-4">{f.title}</p>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: SUB }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ MODULE 2: INFRADRM ═══════════════ */}
      <section style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 mb-4"
            style={{ color: '#94A3B8' }}>
            Module 2
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-4xl text-white">
            InfraDRM — Digital Rights Management
          </h2>
          <p className="italic text-base mt-6 max-w-3xl" style={{ color: '#CBD5E1' }}>
            Protect what you publish.
          </p>
          <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: '#94A3B8' }}>
            InfraDRM secures and licenses digital content — documents, videos, and learning materials —
            distributed across InfraPoint-managed devices. It gives publishers and administrators
            fine-grained control over who can view, copy, print, or share protected content, and for how
            long.
          </p>
        </div>
      </section>

      {/* ═══════════════ INFRADRM KEY FEATURES ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-3xl">
          InfraDRM — Key Features
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {[
            { icon: 'ti-certificate', num: '01', title: 'Content Licensing and Access Control', text: 'Assign time-limited or role-specific licenses to digital assets. Ensure only authorized users within your network can access sensitive or proprietary content.' },
            { icon: 'ti-lock', num: '02', title: 'Copy, Print, and Share Restrictions', text: 'Enforce restrictions on protected files at the file level — prevent unauthorized duplication, printing, or external sharing of licensed content.' },
            { icon: 'ti-hourglass', num: '03', title: 'Expiry-Based Access', text: 'Issue time-limited licenses that expire automatically. Ideal for academic content subscriptions or project-scoped material that should not persist beyond a defined period.' },
            { icon: 'ti-history', num: '04', title: 'Usage Audit Logs', text: 'Track every access event — who opened what file, when, and from which device — providing a complete audit trail for compliance and rights enforcement.' },
          ].map((f) => (
            <div key={f.title}
              className="group relative bg-white p-6 pt-7 overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ boxShadow: '0 1px 2px rgba(26,26,24,0.06)' }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(26,26,24,0.18)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px rgba(26,26,24,0.06)'}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"
                style={{ background: 'linear-gradient(90deg,#1A1A18,#5C5C57)' }}></div>
              <span className="absolute top-5 right-5 text-[11px] font-semibold tracking-wider" style={{ color: '#C7C8C1' }}>{f.num}</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg,#1A1A18,#3A3A34)' }}>
                <i className={`ti ${f.icon} text-xl text-white`} aria-hidden="true"></i>
              </div>
              <p className="text-base font-extrabold uppercase tracking-tight mt-5 leading-snug">{f.title}</p>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: SUB }}>{f.text}</p>
            </div>
          ))}
        </div>

        <div className="relative flex items-start gap-4 p-6 mt-12 overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#DBEAFE,#EFF6FF)', border: '1px solid #BFDBFE' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white shrink-0 shadow-sm">
            <i className="ti ti-info-circle text-lg" style={{ color: '#1D4ED8' }} aria-hidden="true"></i>
          </div>
          <p className="text-sm leading-relaxed pt-1.5" style={{ color: '#1E3A5F' }}>
            InfraDRM is especially valuable for EdTech platforms and content publishers distributing
            licensed learning material across managed institution devices.
          </p>
        </div>
      </section>

      {/* ═══════════════ MODULE 3: INFRANET ═══════════════ */}
      <section style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 mb-4"
            style={{ color: '#94A3B8' }}>
            Module 3
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-4xl text-white">
            InfraNet — Network Monitoring
          </h2>
          <p className="italic text-base mt-6 max-w-3xl" style={{ color: '#CBD5E1' }}>
            See your network before it goes down.
          </p>
          <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: '#94A3B8' }}>
            InfraNet delivers real-time visibility into the network infrastructure connecting every
            institution — routers, bandwidth, uptime, and connectivity health — so your team catches
            issues and resolves them before they result in costly downtime. With multi-site topology
            views and historical reporting, InfraNet turns reactive firefighting into proactive
            infrastructure management.
          </p>
        </div>
      </section>

      {/* ═══════════════ INFRANET KEY FEATURES ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-3xl">
          InfraNet — Key Features
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 mt-10">
          {[
            { title: 'Live Network Topology', text: 'Visual connectivity map showing real-time status of all network nodes across every institution in your deployment.' },
            { title: 'Bandwidth Monitoring', text: 'Per-institution bandwidth usage dashboards that surface congestion, heavy consumers, and trending utilization patterns.' },
            { title: 'Downtime & Outage Alerts', text: 'Instant alerts with precise timestamps whenever a node, link, or site connectivity drops — so response begins the moment something fails.' },
            { title: 'Historical Uptime Reports', text: 'Exportable uptime history per institution for SLA tracking, capacity planning, and infrastructure investment decisions.' },
          ].map((f) => (
            <div key={f.title} className="p-6" style={{ background: '#D7D8D1' }}>
              <p className="text-lg font-extrabold uppercase tracking-tight">{f.title}</p>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: SUB }}>{f.text}</p>
            </div>
          ))}
        </div>

        <p className="text-sm mt-8" style={{ color: SUB }}>
          InfraNet is purpose-built for network administrators and infrastructure teams overseeing
          multi-site connectivity at scale.
        </p>
      </section>

      {/* ═══════════════ MODULE 4: INFRADMS ═══════════════ */}
      <section style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 mb-4"
            style={{ color: '#94A3B8' }}>
            Module 4
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-4xl text-white">
            InfraDMS — Document Management System
          </h2>
          <p className="italic text-base mt-6 max-w-3xl" style={{ color: '#CBD5E1' }}>
            Every document, one secure place.
          </p>
          <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: '#94A3B8' }}>
            InfraDMS centralizes document storage, approval workflows, and access control for
            institutional records — replacing scattered folders and email attachments with a
            searchable, permissioned repository that keeps your organization audit-ready at all times.
          </p>
        </div>
      </section>

      {/* ═══════════════ INFRADMS KEY FEATURES ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-3xl">
          InfraDMS — Key Features
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 mt-10">
          {[
            { icon: 'ti-folder', title: 'Centralized Repository', text: 'Folder and category structures that mirror your institutional hierarchy — so every record has a logical home and is easy to locate.' },
            { icon: 'ti-stamp', title: 'Approval Workflows', text: 'Role-based access with configurable multi-step approval flows — route documents for review, sign-off, and archival without leaving the platform.' },
            { icon: 'ti-history', title: 'Version History & Audit Trail', text: 'Every change is logged with a full version history — who edited what and when — giving compliance teams irrefutable documentation.' },
            { icon: 'ti-search', title: 'Search and Tagging', text: 'Full-text search with custom tagging ensures documents are retrieved in seconds, regardless of volume or folder depth.' },
          ].map((f) => (
            <div key={f.title}>
              <div className="w-14 h-14 rounded flex items-center justify-center" style={{ background: '#D7D8D1' }}>
                <i className={`ti ${f.icon} text-2xl`} style={{ color: INK }} aria-hidden="true"></i>
              </div>
              <p className="text-lg font-extrabold uppercase tracking-tight mt-4" style={{ color: SUB }}>{f.title}</p>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: SUB }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ MODULE 5: INFRACLOUD ═══════════════ */}
      <section style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 mb-4"
            style={{ color: '#94A3B8' }}>
            Module 5
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-4xl text-white">
            InfraCloud — Cloud Infrastructure
          </h2>
          <p className="italic text-base mt-6 max-w-3xl" style={{ color: '#CBD5E1' }}>
            The backbone behind every module.
          </p>
          <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: '#94A3B8' }}>
            InfraCloud is the underlying storage, backup, and hosting layer that powers all InfraPoint
            modules — ensuring data from devices, documents, network logs, and surveillance feeds is
            stored securely, backed up reliably, and available when it matters most.
          </p>
        </div>
      </section>

      {/* ═══════════════ INFRACLOUD KEY FEATURES ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-3xl">
          InfraCloud — Key Features
        </h2>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 mt-10 items-start">
          <div className="p-8" style={{ background: INK }}>
            <p className="text-xl font-extrabold uppercase tracking-tight text-white">What InfraCloud provides</p>
            <ul className="space-y-3 mt-6">
              {[
                'Centralized cloud storage with scheduled backup automation',
                'Storage usage dashboards broken down per module and institution',
                'Disaster recovery and redundancy status monitoring',
                'Granular access logs for all stored data',
              ].map((t) => (
                <li key={t} className="text-sm text-white/85 flex items-start gap-3">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-white/60 shrink-0"></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xl font-extrabold uppercase tracking-tight">Why it matters</p>
            <p className="text-sm mt-4 leading-relaxed" style={{ color: SUB }}>
              Without a reliable infrastructure layer, every other module is only as dependable as its
              weakest storage link. InfraCloud eliminates single points of failure, ensures institutional
              data survives hardware failures, and gives IT teams clear visibility into storage
              consumption and health across the entire platform.
            </p>
            <p className="text-sm mt-4 leading-relaxed" style={{ color: SUB }}>
              Designed for IT infrastructure teams and system administrators responsible for platform
              reliability and data governance.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ MODULE 6: FORTIMATES ═══════════════ */}
      <section style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 mb-4"
            style={{ color: '#94A3B8' }}>
            Module 6
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-4xl text-white">
            FortiMates — Verified-ID Communication
          </h2>
          <p className="italic text-base mt-6 max-w-3xl" style={{ color: '#CBD5E1' }}>
            Smart system for smart users.
          </p>
          <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: '#94A3B8' }}>
            FortiMates is a verified-ID mailing and call management system that eliminates fraud by
            validating sender identity through KYC — including face, document, address, and consent
            verification. Combined with intelligent email analytics and call tracking, FortiMates
            transforms institutional communications into a secure, accountable, and data-driven channel.
          </p>
        </div>
      </section>

      {/* ═══════════════ FORTIMATES KEY FEATURES ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-3xl">
          FortiMates — Key Features
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-10">
          {[
            { icon: 'ti-id', title: 'Sender Verification', text: 'QR-code-based identity display with face, document, address, and consent verification — every sender is who they claim to be.' },
            { icon: 'ti-chart-line', title: 'Email Analytics', text: 'Prioritization, extraction, sentiment analysis, and auto-reply via NLG — turning high-volume inboxes into manageable, actionable queues.' },
            { icon: 'ti-mail', title: 'Segregated Dashboard', text: 'Visual snapshot of email volume, priority buckets, and status — so administrators always know what needs immediate attention.' },
            { icon: 'ti-phone', title: 'Call Management', text: 'Call tracking, recording, tracing, and statistical reporting — full accountability for every inbound and outbound communication.' },
            { icon: 'ti-alert-triangle', title: 'Fraud Detection', text: 'Automatically flags fraudulent or unverified senders before messages reach their recipients — reducing social engineering risk significantly.' },
          ].map((f) => (
            <div key={f.title} className="p-6" style={{ background: '#D7D8D1' }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#C7C8C1' }}>
                <i className={`ti ${f.icon} text-xl`} style={{ color: INK }} aria-hidden="true"></i>
              </div>
              <p className="text-lg font-extrabold uppercase tracking-tight mt-4">{f.title}</p>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: SUB }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ MODULE 7: VAPT ═══════════════ */}
      <section style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 mb-4"
            style={{ color: '#94A3B8' }}>
            Module 7
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-4xl text-white">
            VAPT — Vulnerability Assessment &amp; Penetration Testing
          </h2>
          <p className="italic text-base mt-6 max-w-3xl" style={{ color: '#CBD5E1' }}>
            Find the gaps before attackers do.
          </p>
          <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: '#94A3B8' }}>
            VAPT is InfraPoint's built-in security testing module — continuously scanning systems and
            networks for vulnerabilities and simulating real-world attacks to validate your defenses
            before actual threats can exploit them. It delivers actionable remediation guidance and
            compliance-ready documentation in one unified workflow.
          </p>
        </div>
      </section>

      {/* ═══════════════ VAPT KEY FEATURES ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-3xl">
          VAPT — Key Features
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 mt-10">
          {[
            { icon: 'ti-radar-2', title: 'Automated Vulnerability Scans', text: 'Scheduled and on-demand scans across all devices and network endpoints — continuously surfacing exposures as your infrastructure changes.' },
            { icon: 'ti-calendar-event', title: 'Penetration Test Scheduling', text: 'Plan, execute, and report on penetration tests from within InfraPoint — with structured findings and timeline tracking across engagements.' },
            { icon: 'ti-gauge', title: 'Risk Severity Scoring', text: 'Every finding is scored by severity, with prioritized remediation recommendations so your team addresses the highest-risk exposures first.' },
            { icon: 'ti-file-check', title: 'Compliance-Ready Audit Reports', text: 'Exportable, structured reports formatted for compliance submissions — giving auditors and security officers the documentation they need.' },
          ].map((f) => (
            <div key={f.title}>
              <div className="w-14 h-14 rounded flex items-center justify-center" style={{ background: '#D7D8D1' }}>
                <i className={`ti ${f.icon} text-2xl`} style={{ color: INK }} aria-hidden="true"></i>
              </div>
              <p className="text-lg font-extrabold uppercase tracking-tight mt-4" style={{ color: SUB }}>{f.title}</p>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: SUB }}>{f.text}</p>
            </div>
          ))}
        </div>

        <p className="text-sm mt-8" style={{ color: SUB }}>
          VAPT is designed for security teams, compliance officers, and institutions handling sensitive
          student, citizen, or employee data.
        </p>
      </section>

      {/* ═══════════════ MODULE 8: INFRASURVEILLANCE ═══════════════ */}
      <section style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 mb-4"
            style={{ color: '#94A3B8' }}>
            Module 8
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-4xl text-white">
            InfraSurveillance — Camera &amp; Physical Monitoring
          </h2>
          <p className="italic text-base mt-6 max-w-3xl" style={{ color: '#CBD5E1' }}>
            Eyes on every site, always.
          </p>
          <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: '#94A3B8' }}>
            InfraSurveillance connects camera feeds and physical monitoring systems across all
            institutions into a single dashboard — giving facility managers and security teams live
            visibility, motion-triggered incident alerts, and recorded footage access from one screen,
            regardless of how many sites they oversee.
          </p>
        </div>
      </section>

      {/* ═══════════════ INFRASURVEILLANCE KEY FEATURES ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-3xl">
          InfraSurveillance — Key Features
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 mt-10">
          {[
            { title: 'Live Camera Feeds', text: 'Access live video from cameras across multiple sites simultaneously — organized by institution, floor, or zone within the InfraPoint dashboard.' },
            { title: 'Motion & Incident Alerts', text: 'Configurable motion-triggered and incident-triggered alerts notify the right team members the moment something requires attention on any site.' },
            { title: 'Footage Search & Playback', text: 'Search recorded footage by site, camera, and time range — retrieve and review specific incidents without manual scrubbing through hours of footage.' },
            { title: 'Camera Health Status', text: 'Site-wise camera health monitoring ensures offline or degraded cameras are flagged immediately — maintaining surveillance integrity across the network.' },
          ].map((f) => (
            <div key={f.title} className="p-6" style={{ background: '#D7D8D1' }}>
              <p className="text-lg font-extrabold uppercase tracking-tight">{f.title}</p>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: SUB }}>{f.text}</p>
            </div>
          ))}
        </div>

        <p className="text-sm mt-8" style={{ color: SUB }}>
          InfraSurveillance is purpose-built for facility management teams, physical security officers,
          and institution administrators overseeing large, distributed campuses.
        </p>
      </section>

      {/* ═══════════════ MODULE 9: SMARTMETERS ═══════════════ */}
      <section style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 mb-4"
            style={{ color: '#94A3B8' }}>
            Module 9
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-4xl text-white">
            SmartMeters — IoT Utility Tracking
          </h2>
          <p className="italic text-base mt-6 max-w-3xl" style={{ color: '#CBD5E1' }}>
            Know what every site is consuming, in real time.
          </p>
          <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: '#94A3B8' }}>
            SmartMeters connects IoT-enabled utility meters — electricity, water, and other resources —
            across all institutions, delivering real-time consumption data, anomaly alerts, and trend
            reports. It gives operations and finance teams the visibility they need to control costs,
            catch waste early, and make data-driven decisions on resource allocation.
          </p>
        </div>
      </section>

      {/* ═══════════════ SMARTMETERS KEY FEATURES ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight max-w-3xl">
          SmartMeters — Key Features
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 mt-10">
          {[
            { icon: 'ti-bolt', title: 'Real-Time Usage Dashboards', text: 'Per-site electricity and water consumption displayed live — so facility managers can monitor usage the moment it occurs, not at the end of the billing cycle.' },
            { icon: 'ti-alert-triangle', title: 'Anomaly Detection', text: 'Automatic alerts when consumption spikes beyond expected thresholds — catching equipment failures, leaks, or unauthorized usage before they become costly incidents.' },
            { icon: 'ti-chart-histogram', title: 'Historical Trends & Cost Reports', text: 'Month-over-month and year-over-year usage trends with associated cost data — enabling informed budgeting, forecasting, and procurement decisions.' },
            { icon: 'ti-map-2', title: 'Multi-Site Comparison', text: 'Compare consumption across institutions in a single view — identify outliers, benchmark performance, and drive efficiency improvements at the sites that need it most.' },
          ].map((f) => (
            <div key={f.title}>
              <div className="w-14 h-14 rounded flex items-center justify-center" style={{ background: '#D7D8D1' }}>
                <i className={`ti ${f.icon} text-2xl`} style={{ color: INK }} aria-hidden="true"></i>
              </div>
              <p className="text-lg font-extrabold uppercase tracking-tight mt-4" style={{ color: SUB }}>{f.title}</p>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: SUB }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ ARCHITECTURE ═══════════════ */}
      <section className="border-t" style={{ background: '#DEDFD8', borderColor: '#1A1A18' + '14' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase border border-[#1A1A18]/30 px-2.5 py-1 mb-4"
            style={{ color: INK }}>
            Platform architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
            How InfraPoint fits together
          </h2>
          <p className="text-sm mt-4 max-w-3xl leading-relaxed" style={{ color: SUB }}>
            Every InfraPoint module operates independently but shares a unified data layer,
            authentication framework, and reporting engine. This architecture means adding a new
            module doesn't require a separate deployment — it simply extends what you already have.
          </p>

          <div className="grid lg:grid-cols-[420px_1fr] gap-12 items-center mt-14">
            <div className="relative w-full max-w-[420px] aspect-square mx-auto">
              <div className="absolute inset-0 rounded-full" style={{ background: '#9C9C88' }}></div>
              <div className="absolute inset-[15%] rounded-full" style={{ background: '#6E6E5E' }}></div>
              <div className="absolute inset-[32%] rounded-full flex items-center justify-center text-center px-4" style={{ background: '#33322D' }}>
                <p className="text-white text-xs font-bold uppercase tracking-wide">InfraCloud<br />core</p>
              </div>
            </div>
            <div className="space-y-10">
              <div>
                <p className="text-xl font-extrabold uppercase tracking-tight" style={{ color: SUB }}>Module layer</p>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: SUB }}>
                  InfraDC, InfraDRM, InfraNet, InfraDMS, FortiMates, VAPT, Surveillance, SmartMeters
                </p>
              </div>
              <div>
                <p className="text-xl font-extrabold uppercase tracking-tight" style={{ color: SUB }}>InfraCloud</p>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: SUB }}>
                  Centralized storage, backups, and hosting
                </p>
              </div>
              <div>
                <p className="text-xl font-extrabold uppercase tracking-tight" style={{ color: SUB }}>Reporting engine</p>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: SUB }}>
                  Cross-module analytics and compliance exports
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm mt-14" style={{ color: SUB }}>
            InfraCloud underpins the entire stack — providing the storage, redundancy, and access
            logging that makes every module reliable and auditable by default.
          </p>
        </div>
      </section>

      {/* ═══════════════ WHO IT'S BUILT FOR ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight max-w-xl">
          Who InfraPoint is built for
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 mt-10">
          {[
            { title: 'Schools & College Districts', text: 'Centralize device management, document workflows, network health, and physical surveillance across every campus from a single administrative console.' },
            { title: 'Government Bodies', text: 'Enforce compliance, verify communications, track utility consumption, and maintain a full audit trail across all offices and branches.' },
            { title: 'Multi-Branch Enterprises', text: 'Eliminate tool sprawl and bring infrastructure visibility, security testing, and document control under one roof — regardless of how many locations you operate.' },
            { title: 'EdTech Platforms', text: 'Distribute and protect licensed learning content with InfraDRM, manage the devices that access it via InfraDC, and track network health across partner institutions.' },
          ].map((b) => (
            <div key={b.title} className="p-6 border" style={{ borderColor: '#1A1A18' + '1F' }}>
              <p className="text-lg font-extrabold uppercase tracking-tight">{b.title}</p>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: SUB }}>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ ADVANTAGE ═══════════════ */}
      <section className="border-y" style={{ background: '#DEDFD8', borderColor: '#1A1A18' + '14' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase border border-[#1A1A18]/30 px-2.5 py-1 mb-4"
            style={{ color: INK }}>
            Why InfraPoint
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
            The InfraPoint advantage
          </h2>

          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-10 mt-12">
            {[
              { icon: 'ti-key', title: 'One login. Everything.', text: 'Eliminate credential sprawl. Every administrator accesses every system through a single, role-authenticated session — no more context switching between nine different tools.' },
              { icon: 'ti-activity', title: 'Real-time across all modules', text: 'Live dashboards, instant alerts, and synchronized data across devices, networks, cameras, and meters — so nothing happens in your infrastructure without you knowing.' },
              { icon: 'ti-arrows-maximize', title: 'Scales with your institution', text: "Whether you manage one school or a thousand branches, InfraPoint's project-district-institution hierarchy scales to your exact operational structure without custom development." },
              { icon: 'ti-shield-check', title: 'Built for compliance', text: 'Every module generates audit-ready, exportable reports. InfraPoint makes compliance documentation a byproduct of normal operations — not a separate effort.' },
            ].map((a) => (
              <div key={a.title} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: '#C7C8C1' }}>
                  <i className={`ti ${a.icon} text-xl`} style={{ color: INK }} aria-hidden="true"></i>
                </div>
                <div>
                  <p className="text-lg font-extrabold uppercase tracking-tight" style={{ color: SUB }}>{a.title}</p>
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: SUB }}>{a.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
          InfraPoint at a glance
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14 mt-16">
          {[
            { num: '9', title: 'Integrated Modules', text: 'One platform covering devices, networks, documents, cloud, communications, security, surveillance, and utilities.' },
            { num: '5', title: 'User Role Tiers', text: 'From Master to Service Provider — role-based access enforced across every module automatically.' },
            { num: '1', title: 'Unified Dashboard', text: 'One authenticated console replaces separate logins for every system your institution operates.' },
            { num: '∞', title: 'Sites Supported', text: 'Designed to scale from a single institution to thousands of branches without architectural changes.' },
          ].map((s) => (
            <div key={s.title}>
              <p className="text-5xl font-extrabold" style={{ color: SUB }}>{s.num}</p>
              <p className="text-lg font-extrabold uppercase tracking-tight mt-4">{s.title}</p>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: SUB }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section style={{ background: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
            Ready to unify your infrastructure?
          </h2>
          <p className="text-sm mt-5 max-w-2xl mx-auto leading-relaxed" style={{ color: '#94A3B8' }}>
            InfraPoint is deployed by ISF Analytica & Informatica Pvt. Ltd. — a team of infrastructure
            and security specialists with deep experience in institutional deployments. Whether you're
            starting with one module or the full platform, InfraPoint scales to where you are today and
            where you're going tomorrow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white" style={{ background: '#3B82F6' }}>
              Request a Demo
            </button>
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold border border-white text-white">
              Contact ISF Analytica
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t" style={{ borderColor: '#1A1A18' + '14' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-center text-[12px]" style={{ color: SUB }}>
            © {new Date().getFullYear()} ISF Analytica &amp; Informatica Pvt. Ltd. — All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}