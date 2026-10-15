import AuthLayout from '../features/auth/AuthLayout.jsx'
import LoginForm from '../features/auth/LoginForm.jsx'

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your FortiMates dashboard.">
      <LoginForm />
    </AuthLayout>
  )
}
