import { FM_DASH, FM_LOGIN } from '../../config.js'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, Building2, UserCircle } from 'lucide-react'
import Button from '../../components/common/Button.jsx'

export default function RegisterForm() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('individual')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      setError('Fill in every field to create your account.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords don\u2019t match.')
      return
    }
    if (!agreed) {
      setError('Please accept the terms to continue.')
      return
    }
    setError('')
    // No backend wired up yet — this is where you'd call your signup API.
    navigate(FM_DASH)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Individual / Corporate toggle */}
      <div className="flex border border-white/10 clip-facet-r overflow-hidden">
        <button
          type="button"
          onClick={() => setAccountType('individual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors ${
            accountType === 'individual'
              ? 'bg-signal-500/15 text-signal-400'
              : 'text-mist-400 hover:text-mist-200'
          }`}
        >
          <UserCircle size={14} />
          Individual
        </button>
        <button
          type="button"
          onClick={() => setAccountType('corporate')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors ${
            accountType === 'corporate'
              ? 'bg-signal-500/15 text-signal-400'
              : 'text-mist-400 hover:text-mist-200'
          }`}
        >
          <Building2 size={14} />
          Corporate
        </button>
      </div>

      <div>
        <label className="text-xs text-mist-400">
          {accountType === 'corporate' ? 'Company name' : 'Full name'}
        </label>
        <div className="relative mt-1.5">
          <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-400" />
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={accountType === 'corporate' ? 'Acme Inc.' : 'Jordan Lee'}
            className="w-full pl-11 pr-4 py-3 bg-abyss-900 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 placeholder:text-mist-400 clip-facet-r"
          />
        </div>
      </div>

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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-mist-400">Password</label>
          <div className="relative mt-1.5">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-400" />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full pl-11 pr-3 py-3 bg-abyss-900 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 placeholder:text-mist-400 clip-facet-r"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-mist-400">Confirm</label>
          <div className="relative mt-1.5">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist-400" />
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full pl-11 pr-3 py-3 bg-abyss-900 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 placeholder:text-mist-400 clip-facet-r"
            />
          </div>
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-mist-300">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-4 h-4 mt-0.5 accent-signal-500"
        />
        I agree to the Terms of Service and Privacy Policy.
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <Button type="submit" variant="primary" className="w-full justify-center">
        Create Account
      </Button>

      <p className="text-center text-sm text-mist-400">
        Already have an account?{' '}
        <Link to={FM_LOGIN} className="text-signal-400 hover:text-signal-300 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
