import AuthLayout from '../features/auth/AuthLayout.jsx'
import ForgotPasswordForm from '../features/auth/ForgotPasswordForm.jsx'

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to get back in.">
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
