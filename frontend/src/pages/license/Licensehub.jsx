import { useEffect, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { MdmPage, useToasts } from '../../components/mdm/MdmKit'
import { getLicenseStats } from '../../api/license'
import LicenseDashboardView from './Licensedashboardview'
import LicenseGenerateView from './Licensegenerateview'
import LicenseManageView from './Licensemanageview'
import LicenseAssignView from './Licenseassignview'
import LicenseUsageView from './Licenseusageview'
import LicenseViolationsView from './Licenseviolationsview'

/* License Management — same MdmPage shell as DRM / VAPT / MDM (topbar, back
   link, header, tab bar). The six existing views are rendered unchanged inside
   the tabs; the tab comes from the URL (/license/:tab), so every existing
   navigate('/license/…') call inside those views simply switches tab. */

const THEME = {
  accent: '#9333EA', accentDeep: '#7E22CE', accentBg: '#FAF5FF', accentBorder: '#E9D5FF',
  gradient: 'linear-gradient(135deg, #A855F7, #7E22CE)',
}

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard', View: LicenseDashboardView },
  { key: 'generate', label: 'Generate', icon: 'ti-key', View: LicenseGenerateView },
  { key: 'manage', label: 'Manage', icon: 'ti-list-details', View: LicenseManageView },
  { key: 'assign', label: 'Assign to Schools', icon: 'ti-building-community', View: LicenseAssignView },
  { key: 'usage', label: 'Usage & Activity', icon: 'ti-history', View: LicenseUsageView },
  { key: 'violations', label: 'Violations', icon: 'ti-alert-triangle', View: LicenseViolationsView },
]

export default function LicenseHub() {
  const { tab = 'dashboard' } = useParams()
  const navigate = useNavigate()
  const { toasts } = useToasts()
  const [stats, setStats] = useState(null)

  useEffect(() => { getLicenseStats().then(setStats).catch(() => {}) }, [tab])

  const current = TABS.find(t => t.key === tab)
  if (!current) return <Navigate to="/license" replace />
  const View = current.View

  return (
    <MdmPage {...THEME} icon="ti-key" title="License Management"
      subtitle="Generate, assign and monitor licenses across every institution"
      tabs={TABS} tab={tab} onTab={(k) => navigate(k === 'dashboard' ? '/license' : `/license/${k}`)} toasts={toasts}
      activeKey="license" backPath="/home" backLabel="Home"
      status={stats ? `${stats.active_licenses} active · ${stats.total_licenses} total` : 'connecting…'}>
      {/* The views were built as full pages — inside the shell, drop their own
          page padding/background and the duplicate title (the tab already says it). */}
      <style>{`
        .lic-embed > div { padding: 0 !important; background: transparent !important; min-height: 0 !important; }
        .lic-embed h2.text-2xl, .lic-embed h2.text-2xl + p { display: none; }
        .lic-embed > div > div.mb-6:first-child:not(:has(button)) { display: none; }
        .lic-embed > div > div.mb-6:first-child:has(button) { justify-content: flex-end; }
      `}</style>
      <div className="lic-embed"><View /></div>
    </MdmPage>
  )
}
