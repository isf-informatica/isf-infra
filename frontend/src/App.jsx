import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import NewSchool from './pages/schools/NewSchool'
import SchoolDetail from './pages/schools/SchoolDetail'
import KillSwitch from './pages/schools/KillSwitch'
import SetupGuide from './pages/schools/SetupGuide'
import SmartSetup from './pages/schools/SmartSetup'
import Devices from './pages/schools/Devices'
import Home from './pages/modules/Home'
import ModuleIntro from './pages/modules/ModuleIntro'
import ComingSoon from './pages/modules/ComingSoon'
import MdmHub from './pages/mdm/MdmHub'
import GroupsRoles from './pages/mdm/GroupsRoles'
import ReportsView from './pages/mdm/ReportsView'
import GeofencingView from './pages/mdm/GeofencingView'
import EnrollmentView from './pages/mdm/EnrollmentView'
import RemoteManagementView from './pages/mdm/RemoteManagementView'
import AppManagementView from './pages/mdm/AppManagementView'
import PolicyManagementView from './pages/mdm/PolicyManagementView'
import ContentPublishingView from './pages/mdm/ContentPublishingView'
import SecureBrowserView from './pages/mdm/SecureBrowserView'
import DrmView from './pages/drm/DrmView'
import VaptView from './pages/vapt/VaptView'
import SignageView from './pages/signage/SignageView'
import SupportDesk from './pages/support/SupportDesk'
import InfraPointLanding from './pages/marketing/InfraPointLanding'
import useAuthStore from './store/authStore'
import LicenseHub from './pages/license/Licensehub'
import OrganizerView from './pages/organizer/OrganizerView'
import IssueView from './pages/issues/IssueView'
import AssetView from './pages/assets/AssetView'
import AccountView from './pages/accounts/AccountView'

// FortiMates module (pages/fortimates) — lazy-loaded so its heavy bundle
// (charts, icons, animations) only downloads when the FortiMates page is opened.
const FortiMatesApp = lazy(() => import('./pages/fortimates/FortiMatesApp.jsx'))

function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InfraPointLanding />} />
        <Route path="/about" element={<InfraPointLanding />} />

        <Route path="/login" element={<Login />} />

        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/home/:key" element={<ProtectedRoute><ModuleIntro /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportDesk /></ProtectedRoute>} />
        <Route path="/mdm" element={<ProtectedRoute><MdmHub /></ProtectedRoute>} />
        <Route path="/mdm/groups-roles" element={<ProtectedRoute><GroupsRoles /></ProtectedRoute>} />
        <Route path="/mdm/reports" element={<ProtectedRoute><ReportsView /></ProtectedRoute>} />
        <Route path="/mdm/geofencing" element={<ProtectedRoute><GeofencingView /></ProtectedRoute>} />
        <Route path="/mdm/enrollment" element={<ProtectedRoute><EnrollmentView /></ProtectedRoute>} />
        <Route path="/mdm/remote-management" element={<ProtectedRoute><RemoteManagementView /></ProtectedRoute>} />
        <Route path="/mdm/app-management" element={<ProtectedRoute><AppManagementView /></ProtectedRoute>} />
        <Route path="/mdm/policy-management" element={<ProtectedRoute><PolicyManagementView /></ProtectedRoute>} />
        <Route path="/mdm/content-publishing" element={<ProtectedRoute><ContentPublishingView /></ProtectedRoute>} />
        <Route path="/mdm/secure-browser" element={<ProtectedRoute><SecureBrowserView /></ProtectedRoute>} />
        <Route path="/modules/drm" element={<ProtectedRoute><DrmView /></ProtectedRoute>} />
        <Route path="/modules/vapt" element={<ProtectedRoute><VaptView /></ProtectedRoute>} />
        <Route path="/modules/signage" element={<ProtectedRoute><SignageView /></ProtectedRoute>} />
        <Route path="/modules/organizer" element={<ProtectedRoute><OrganizerView /></ProtectedRoute>} />
        <Route path="/modules/issues" element={<ProtectedRoute><IssueView /></ProtectedRoute>} />
        <Route path="/modules/assets" element={<ProtectedRoute><AssetView /></ProtectedRoute>} />
        <Route path="/modules/accounts" element={<ProtectedRoute><AccountView /></ProtectedRoute>} />
        {/* FortiMates: ComingSoon replaced by the real FortiMates module.
            "/*" lets its inner pages work: /modules/fortimates/dashboard, /login, etc. */}
        <Route
          path="/modules/fortimates/*"
          element={
            <ProtectedRoute>
              <Suspense fallback={null}>
                <FortiMatesApp />
              </Suspense>
            </ProtectedRoute>
          }
        />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/schools/new" element={<ProtectedRoute><NewSchool /></ProtectedRoute>} />
        <Route path="/schools/setup" element={<ProtectedRoute><SmartSetup /></ProtectedRoute>} />
        <Route path="/schools/:id" element={<ProtectedRoute><SchoolDetail /></ProtectedRoute>} />
        <Route path="/schools/:id/kill" element={<ProtectedRoute><KillSwitch /></ProtectedRoute>} />
        <Route path="/schools/:id/setup" element={<ProtectedRoute><SetupGuide /></ProtectedRoute>} />
        <Route path="/schools/:id/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
        {/* License Management: one shell (same as DRM / VAPT) with a tab per view.
            /license/dashboard, /generate, /manage, /assign, /usage, /violations
            still work — the :tab param picks the tab. */}
        <Route path="/license" element={<LicenseHub />} />
        <Route path="/license/:tab" element={<LicenseHub />} />
      </Routes>
    </BrowserRouter>
  )
}