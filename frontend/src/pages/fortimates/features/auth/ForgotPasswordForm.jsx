import { FM_LOGIN } from '../../config.js'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Button from '../../components/common/Button.jsx'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email) {
      setError('Enter the email address on your account.')
      return
    }
    setError('')
    setLoading(true)
    // No backend wired up yet — this is where you'd call Register::forgot_password().
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 600)
  }

  if (sent) {
    return (
      <div>
        <CheckCircle2 size={32} className="text-signal-400" />
        <h2 className="mt-4 text-lg font-semibold text-mist-100">Check your email</h2>
        <p className="mt-2 text-sm text-mist-400 leading-relaxed">
          If an account exists for <span className="text-mist-200">{email}</span>, we've sent
          a link to reset your password.
        </p>
        <Link
          to={FM_LOGIN}
          className="mt-6 inline-flex items-center gap-2 text-sm text-signal-400 hover:text-signal-300"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs text-mist-400">Email</label>
        <div className="relative mt-1.5">
          <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full pl-11 pr-4 py-3 bg-abyss-900 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 placeholder:text-mist-400 clip-facet-r"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
        {loading ? 'Sending…' : 'Send Reset Link'}
      </Button>

      <Link
        to={FM_LOGIN}
        className="flex items-center justify-center gap-2 text-sm text-mist-400 hover:text-mist-200"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>
    </form>
  )
}
