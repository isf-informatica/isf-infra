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
import InfraPointLanding from './pages/marketing/InfraPointLanding'
import useAuthStore from './store/authStore'

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
      </Routes>
    </BrowserRouter>
  )
}