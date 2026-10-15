import { FM_DASH } from '../config.js'
// Central content + mock data. In production, dashboard arrays below would be
// replaced by real API calls (see src/dashboard/pages for where to wire them in).

export const services = [
  {
    title: 'Breach Detection',
    description:
      'Continuously scans dark-web dumps and leaked databases to flag if a user\u2019s email or password has been exposed.',
    icon: 'ShieldAlert'
  },
  {
    title: 'AI Fraud Scoring',
    description:
      'A confidence-level engine that scores every login and registration for bot, spam and impersonation risk in real time.',
    icon: 'BrainCircuit'
  },
  {
    title: 'KYC Verification',
    description:
      'Document and identity checks that keep onboarding fast for genuine users and hard for fraudulent ones.',
    icon: 'FileCheck2'
  },
  {
    title: 'Mail Intelligence',
    description:
      'Tracks and filters inbound mail traffic, isolating phishing patterns before they reach an inbox.',
    icon: 'MailSearch'
  },
  {
    title: 'Live Threat Radar',
    description:
      'A rolling map of registrations, requests and anomalies so your team spots spikes the moment they happen.',
    icon: 'Radar'
  },
  {
    title: 'Passport & Corporate ID',
    description:
      'Separate verification lanes for individual and corporate accounts, each with its own trust threshold.',
    icon: 'BadgeCheck'
  }
]

export const howItWorks = [
  {
    step: '01',
    title: 'Connect your account',
    description: 'Link an email, app or corporate domain in under two minutes \u2014 no code required.'
  },
  {
    step: '02',
    title: 'The shield scans continuously',
    description: 'FortiMates cross-references breach feeds, device signals and behaviour patterns around the clock.'
  },
  {
    step: '03',
    title: 'Risk is scored instantly',
    description: 'Every event gets a clear trust score, so genuine users pass through and threats get stopped.'
  },
  {
    step: '04',
    title: 'You stay one step ahead',
    description: 'Alerts, reports and a live dashboard keep your team briefed before small risks become breaches.'
  }
]

export const stats = [
  { label: 'Accounts protected', value: 248000, suffix: '+' },
  { label: 'Breach records matched', value: 4.2, suffix: 'M', decimals: 1 },
  { label: 'Average scan time', value: 0.8, suffix: 's', decimals: 1 },
  { label: 'Detection accuracy', value: 99.4, suffix: '%', decimals: 1 }
]

// Human photography — sourced from randomuser.me (free, license-friendly headshot service)
export const team = [
  {
    name: 'Ananya Rao',
    role: 'Founder & CEO',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
  {
    name: 'Devraj Malhotra',
    role: 'Head of Security Engineering',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    name: 'Sara Kim',
    role: 'Lead Product Designer',
    photo: 'https://randomuser.me/api/portraits/women/45.jpg'
  },
  {
    name: 'Marcus Webb',
    role: 'AI & Fraud Systems Lead',
    photo: 'https://randomuser.me/api/portraits/men/76.jpg'
  }
]

export const testimonials = [
  {
    quote:
      'We rolled FortiMates out across our customer accounts and caught three credential-stuffing attempts in the first week alone.',
    name: 'Priya Nathan',
    role: 'CTO, Layerbank',
    photo: 'https://randomuser.me/api/portraits/women/22.jpg'
  },
  {
    quote:
      'The dashboard is the first thing our security team opens every morning. It actually tells us what changed overnight.',
    name: 'Jonas Weiss',
    role: 'Director of Trust & Safety, Northline',
    photo: 'https://randomuser.me/api/portraits/men/54.jpg'
  },
  {
    quote:
      'Onboarding felt instant, but the depth of the KYC and breach checks is what convinced our compliance team to sign off.',
    name: 'Fatima Al-Sayed',
    role: 'Head of Compliance, Vaultly',
    photo: 'https://randomuser.me/api/portraits/women/61.jpg'
  }
]

export const pricingPlans = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    description: 'For indie builders validating an idea.',
    features: ['Up to 500 protected accounts', 'Breach detection', 'Email alerts', 'Community support'],
    highlighted: false
  },
  {
    name: 'Growth',
    price: '$79',
    period: '/month',
    description: 'For products scaling past their first users.',
    features: [
      'Up to 50,000 protected accounts',
      'AI fraud scoring',
      'KYC verification',
      'Live threat radar dashboard',
      'Priority support'
    ],
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For platforms with compliance and scale needs.',
    features: [
      'Unlimited protected accounts',
      'Dedicated success engineer',
      'Custom KYC workflows',
      'SLA-backed uptime',
      'SSO & audit logs'
    ],
    highlighted: false
  }
]

// ---------------- Dashboard mock datasets ----------------

export const registrationSeries = [
  { day: 'Mon', today: 320, yesterday: 260 },
  { day: 'Tue', today: 412, yesterday: 380 },
  { day: 'Wed', today: 389, yesterday: 470 },
  { day: 'Thu', today: 501, yesterday: 210 },
  { day: 'Fri', today: 468, yesterday: 430 },
  { day: 'Sat', today: 275, yesterday: 300 },
  { day: 'Sun', today: 244, yesterday: 515 }
]

// Matches the "Total Mails" category split shown in the reference dashboard
export const mailSplit = [
  { name: 'Primary', value: 37.6, color: '#4FD6E8' },
  { name: 'Social', value: 21.6, color: '#7BAAF7' },
  { name: 'Promotional', value: 18.5, color: '#7C8CAF' },
  { name: 'Updates', value: 14.2, color: '#F5AE0E' },
  { name: 'Forums', value: 5.6, color: '#3E4F73' },
  { name: 'Spams', value: 2.5, color: '#EF476F' }
]

// Id / Email / Subject / Message table shown on the dashboard home
export const mailsList = [
  { id: '17062024', email: 'ashkondaskar01@gmail.com', subject: 'test', message: 'testAishwarya' },
  { id: '17062023', email: 'ashkondaskar01@gmail.com', subject: 'test', message: 'testAishwarya' },
  { id: '17062022', email: 'ashkondaskar01@gmail.com', subject: 'test', message: 'testAishwarya' },
  { id: '01052021', email: 'ashkondaskar01@gmail.com', subject: 'test', message: 'testAishwarya' },
  { id: '01052020', email: 'ashkondaskar01@gmail.com', subject: 'saam', message: 'YoAishwarya' },
  { id: '01052019', email: 'ashkondaskar01@gmail.com', subject: 'shameem', message: 'YoAishwarya' }
]

export const userSplit = {
  withPassport: 64,
  withoutPassport: 36,
  corporate: 41,
  totalUsers: 24800
}

export const dashboardStats = [
  { label: 'With Passport ID', value: 64, suffix: '%', icon: 'BadgeCheck' },
  { label: 'Without Passport ID', value: 36, suffix: '%', icon: 'UserX' },
  { label: 'Corporate Accounts', value: 41, suffix: '%', icon: 'Building2' },
  { label: 'Total Users', value: 24.8, suffix: 'K', decimals: 1, icon: 'Users' }
]

export const requestsQueue = [
  { name: 'Wren Okafor', email: 'wren.okafor@nyla.io', country: 'Nigeria', type: 'With Passport' },
  { name: 'Lena Petrova', email: 'lena.p@vektor.dev', country: 'Latvia', type: 'Without Passport' },
  { name: 'Marco Silva', email: 'marco.silva@obra.co', country: 'Brazil', type: 'Corporate' },
  { name: 'Hana Suzuki', email: 'hana.s@karesu.jp', country: 'Japan', type: 'With Passport' },
  { name: 'Tariq Aziz', email: 'tariq@duneworks.ae', country: 'UAE', type: 'Corporate' }
]

export const kycList = [
  { name: 'Wren Okafor', bankName: 'Zenith Trust', bankCategory: 'Retail' },
  { name: 'Marco Silva', bankName: 'Obra Capital', bankCategory: 'Corporate' },
  { name: 'Hana Suzuki', bankName: 'Karesu Bank', bankCategory: 'Retail' },
  { name: 'Tariq Aziz', bankName: 'Duneworks Financial', bankCategory: 'Corporate' },
  { name: 'Ines Moreau', bankName: 'Meridien Bank', bankCategory: 'Retail' }
]

export const mailTracker = [
  { subject: 'Password reset requested', from: 'no-reply@fortimates.com', status: 'Delivered', risk: 'Low' },
  { subject: 'Unusual login detected', from: 'alerts@fortimates.com', status: 'Delivered', risk: 'Medium' },
  { subject: 'Your KYC has been approved', from: 'kyc@fortimates.com', status: 'Delivered', risk: 'Low' },
  { subject: 'Payment verification needed', from: 'billing@fortimates.com', status: 'Queued', risk: 'Low' },
  { subject: 'Suspicious device sign-in', from: 'alerts@fortimates.com', status: 'Delivered', risk: 'High' }
]

// Full mail log — Id/From/Email/Location/Date/Time/Details, matching the
// original site's Mail Tracker table (with search), shown below the
// "Recent mail activity" summary widget.
export const mailLog = [
  { id: '17062024', from: 'FortiMates Alerts', email: 'alerts@fortimates.com', location: 'Mumbai, IN', date: '17 Jun 2026', time: '09:42 GMT' },
  { id: '17062023', from: 'FortiMates Billing', email: 'billing@fortimates.com', location: 'Austin, US', date: '17 Jun 2026', time: '08:15 GMT' },
  { id: '17062022', from: 'FortiMates KYC', email: 'kyc@fortimates.com', location: 'Lagos, NG', date: '16 Jun 2026', time: '22:03 GMT' },
  { id: '01052021', from: 'FortiMates Alerts', email: 'alerts@fortimates.com', location: 'Riga, LV', date: '01 May 2026', time: '14:27 GMT' },
  { id: '01052020', from: 'No-Reply', email: 'no-reply@fortimates.com', location: 'Tokyo, JP', date: '01 May 2026', time: '11:58 GMT' },
  { id: '01052019', from: 'FortiMates Billing', email: 'billing@fortimates.com', location: 'Dubai, AE', date: '01 May 2026', time: '10:12 GMT' }
]

// Call Tracker — Sr No / Name / Start Time / End Time / Outcome / Recording
export const callTracker = [
  { name: 'Wren Okafor', start: '09:12 AM', end: '09:24 AM', outcome: 'Verified', recording: true },
  { name: 'Lena Petrova', start: '10:05 AM', end: '10:19 AM', outcome: 'Follow-up needed', recording: true },
  { name: 'Marco Silva', start: '11:30 AM', end: '11:33 AM', outcome: 'No answer', recording: false },
  { name: 'Hana Suzuki', start: '01:15 PM', end: '01:28 PM', outcome: 'Verified', recording: true },
  { name: 'Tariq Aziz', start: '02:40 PM', end: '02:47 PM', outcome: 'Declined', recording: true }
]

// Every module reachable from the sidebar, shown as tiles on the Home page.
export const dashboardModules = [
  { label: 'KYC Module', to: `${FM_DASH}/kyc-module`, icon: 'ShieldCheck', tone: 'signal' },
  { label: 'KYC List', to: `${FM_DASH}/kyc-list`, icon: 'FileCheck2', tone: 'amber' },
  { label: 'Requests', to: `${FM_DASH}/requests`, icon: 'Inbox', tone: 'signal' },
  { label: 'Mail Tracker', to: `${FM_DASH}/mail-tracker`, icon: 'MailSearch', tone: 'amber' },
  { label: 'Call Tracker', to: `${FM_DASH}/call-tracker`, icon: 'Phone', tone: 'signal' },
  { label: 'Admin', to: `${FM_DASH}/admin`, icon: 'UserCog', tone: 'amber' },
  { label: 'Configurations', to: `${FM_DASH}/configurations`, icon: 'SlidersHorizontal', tone: 'signal' }
]

export const adminUser = {
  name: 'Admin',
  photo: 'https://randomuser.me/api/portraits/men/41.jpg'
}

// Admin/staff accounts with dashboard access — separate from Configurations
// (which is the logged-in user's own profile settings).
export const adminUsers = [
  { name: 'Ananya Rao', email: 'ananya@fortimates.com', role: 'Super Admin', status: 'Active' },
  { name: 'Devraj Malhotra', email: 'devraj@fortimates.com', role: 'Security Admin', status: 'Active' },
  { name: 'Sara Kim', email: 'sara@fortimates.com', role: 'Support Admin', status: 'Active' },
  { name: 'Marcus Webb', email: 'marcus@fortimates.com', role: 'Fraud Analyst', status: 'Invited' }
]
