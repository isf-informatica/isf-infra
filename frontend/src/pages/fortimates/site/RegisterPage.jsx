import AuthLayout from '../features/auth/AuthLayout.jsx'
import RegisterForm from '../features/auth/RegisterForm.jsx'

export default function RegisterPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Start verifying users in minutes.">
      <RegisterForm />
    </AuthLayout>
  )
}
