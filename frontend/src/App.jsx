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
import ComingSoon from './pages/modules/ComingSoon'
import MdmHub from './pages/mdm/MdmHub'
import GroupsRoles from './pages/mdm/GroupsRoles'
import ReportsView from './pages/mdm/ReportsView'
import GeofencingView from './pages/mdm/GeofencingView'
import EnrollmentView from './pages/mdm/EnrollmentView'
import RemoteManagementView from './pages/mdm/RemoteManagementView'
import SupportDesk from './pages/support/SupportDesk'
import InfraPointLanding from './pages/marketing/InfraPointLanding'
import useAuthStore from './store/authStore'
import LicenseHub from './pages/license/licensehub'
import LicenseDashboardView from './pages/license/Licensedashboardview'
import LicenseGenerateView from './pages/license/Licensegenerateview'
import LicenseManageView from './pages/license/Licensemanageview'
import LicenseAssignView from './pages/license/Licenseassignview'
import LicenseUsageView from './pages/license/Licenseusageview'
import LicenseViolationsView from './pages/license/Licenseviolationsview'

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
        <Route path="/support" element={<ProtectedRoute><SupportDesk /></ProtectedRoute>} />
        <Route path="/mdm" element={<ProtectedRoute><MdmHub /></ProtectedRoute>} />
        <Route path="/mdm/groups-roles" element={<ProtectedRoute><GroupsRoles /></ProtectedRoute>} />
        <Route path="/mdm/reports" element={<ProtectedRoute><ReportsView /></ProtectedRoute>} />
        <Route path="/mdm/geofencing" element={<ProtectedRoute><GeofencingView /></ProtectedRoute>} />
        <Route path="/mdm/enrollment" element={<ProtectedRoute><EnrollmentView /></ProtectedRoute>} />
        <Route path="/mdm/remote-management" element={<ProtectedRoute><RemoteManagementView /></ProtectedRoute>} />
        <Route path="/modules/drm" element={<ProtectedRoute><ComingSoon title="Digital Rights Management" moduleKey="drm" /></ProtectedRoute>} />
        <Route path="/modules/vapt" element={<ProtectedRoute><ComingSoon title="VAPT" moduleKey="vapt" /></ProtectedRoute>} />
        <Route path="/modules/fortimates" element={<ProtectedRoute><ComingSoon title="FortiMates" moduleKey="fortimates" /></ProtectedRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/schools/new" element={<ProtectedRoute><NewSchool /></ProtectedRoute>} />
        <Route path="/schools/setup" element={<ProtectedRoute><SmartSetup /></ProtectedRoute>} />
        <Route path="/schools/:id" element={<ProtectedRoute><SchoolDetail /></ProtectedRoute>} />
        <Route path="/schools/:id/kill" element={<ProtectedRoute><KillSwitch /></ProtectedRoute>} />
        <Route path="/schools/:id/setup" element={<ProtectedRoute><SetupGuide /></ProtectedRoute>} />
        <Route path="/schools/:id/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
        <Route path="/license" element={<LicenseHub />} />
        <Route path="/license/dashboard" element={<LicenseDashboardView />} />
        <Route path="/license/generate" element={<LicenseGenerateView />} />
        <Route path="/license/manage" element={<LicenseManageView />} />
        <Route path="/license/assign" element={<LicenseAssignView />} />
        <Route path="/license/usage" element={<LicenseUsageView />} />
        <Route path="/license/violations" element={<LicenseViolationsView />} />
      </Routes>
    </BrowserRouter>
  )
}