import { FM_DASH, FM_FORGOT, FM_REGISTER } from '../../config.js'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import { apiPost } from '../../lib/api.js'

// Flip this to true once the backend routing (web.config) is confirmed
// working. While false, any email/password submits straight through to
// the dashboard — useful for reviewing the frontend without a live backend.
const USE_LIVE_DATA = false

export default function LoginForm() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Enter your email and password to continue.')
      return
    }
    setError('')

    if (!USE_LIVE_DATA) {
      navigate(FM_DASH)
      return
    }

    setLoading(true)
    try {
      // Backend expects the password field named "pass", not "password"
      const result = await apiPost('/auth/login', {
        email: form.email,
        pass: form.password
      })
      localStorage.setItem('fm_user', JSON.stringify(result.data.user))
      navigate(FM_DASH)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs text-mist-400">Email</label>
        <div className="relative mt-1.5">
          <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-400" />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
            className="w-full pl-11 pr-4 py-3 bg-abyss-900 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 placeholder:text-mist-400 clip-facet-r"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-mist-400">Password</label>
          <Link to={FM_FORGOT} className="text-xs text-signal-400 hover:text-signal-300">
            Forgot password?
          </Link>
        </div>
        <div className="relative mt-1.5">
          <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full pl-11 pr-11 py-3 bg-abyss-900 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 placeholder:text-mist-400 clip-facet-r"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-mist-400 hover:text-mist-200"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-mist-300">
        <input type="checkbox" className="w-4 h-4 accent-signal-500" />
        Remember me on this device
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <Button type="submit" variant="primary" className="w-full justify-center" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </Button>

      <p className="text-center text-sm text-mist-400">
        Don't have an account?{' '}
        <Link to={FM_REGISTER} className="text-signal-400 hover:text-signal-300 font-medium">
          Create one
        </Link>
      </p>
    </form>
  )
}
