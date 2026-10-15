import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Marketing site (first page) + auth pages
import LandingPage from './site/LandingPage.jsx'
import LoginPage from './site/LoginPage.jsx'
import RegisterPage from './site/RegisterPage.jsx'
import ForgotPasswordPage from './site/ForgotPasswordPage.jsx'

// Admin dashboard
import DashboardLayout from './dashboard/DashboardLayout.jsx'
import DashboardHome from './dashboard/pages/DashboardHome.jsx'
import RequestsPage from './dashboard/pages/RequestsPage.jsx'
import KycModulePage from './dashboard/pages/KycModulePage.jsx'
import KycPage from './dashboard/pages/KycPage.jsx'
import MailTrackerPage from './dashboard/pages/MailTrackerPage.jsx'
import CallTrackerPage from './dashboard/pages/CallTrackerPage.jsx'
import AdminPage from './dashboard/pages/AdminPage.jsx'
import ConfigurationsPage from './dashboard/pages/ConfigurationsPage.jsx'

import './fortimates.css'

const FONT_LINK_ID = 'fm-google-fonts'
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap'

/* Dashboard pages — same as the standalone project's DashboardPage.jsx */
function FortiMatesDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="kyc-module" element={<KycModulePage />} />
        <Route path="kyc-list" element={<KycPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="mail-tracker" element={<MailTrackerPage />} />
        <Route path="call-tracker" element={<CallTrackerPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="configurations" element={<ConfigurationsPage />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </DashboardLayout>
  )
}

/**
 * FortiMates inside EasyReach, mounted at /modules/fortimates/*
 *
 *   /modules/fortimates                    → landing page (first page)
 *   /modules/fortimates/login | register | forgot-password
 *   /modules/fortimates/dashboard/*        → admin dashboard
 *
 * Wrapped in `.fm-root` so FortiMates' dark theme stays inside this module.
 */
export default function FortiMatesApp() {
  useEffect(() => {
    // Load FortiMates fonts only when this module opens
    if (!document.getElementById(FONT_LINK_ID)) {
      const link = document.createElement('link')
      link.id = FONT_LINK_ID
      link.rel = 'stylesheet'
      link.href = FONT_HREF
      document.head.appendChild(link)
    }
    // Smooth scrolling for landing-page anchors (#about, #pricing...) —
    // restored when leaving FortiMates so EasyReach pages behave as before
    const html = document.documentElement
    const prev = html.style.scrollBehavior
    html.style.scrollBehavior = 'smooth'
    return () => {
      html.style.scrollBehavior = prev
    }
  }, [])

  return (
    <div className="fm-root">
      <Routes>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="dashboard/*" element={<FortiMatesDashboard />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </div>
  )
}
