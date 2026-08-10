import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import logo from '../../assets/logo.png'

const BG = '#E8E8E3'
const INK = '#1A1A18'
const SUB = '#5C5C57'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const data = await login(email, password)
      setAuth({ name: data.name, role: data.role, email }, data.access_token)
      navigate('/home')
    } catch { setError('Invalid email or password') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex font-sans" style={{ background: INK }}>

      {/* ───────────────── Left — brand panel ───────────────── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden" style={{ background: BG }}>
        <div className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(${INK}22 1px, transparent 1px)`,
            backgroundSize: '22px 22px',
          }} />

        <div className="relative flex items-center gap-2.5">
          <img src={logo} alt="ISF-Infra" className="w-8 h-8 object-contain" />
          <span className="text-sm font-bold tracking-tight" style={{ color: INK }}>ISF-INFRA</span>
        </div>

        <div className="relative max-w-sm">
          <span className="inline-block text-[11px] font-semibold tracking-widest uppercase border px-2.5 py-1 mb-5"
            style={{ borderColor: INK + '40', color: SUB }}>
            Media server control
          </span>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight leading-[1.1]" style={{ color: INK }}>
            Manage every on-premise server from one console.
          </h1>
          <p className="text-sm mt-5 leading-relaxed" style={{ color: SUB }}>
            Monitor uptime, push configuration, and resolve incidents across your
            institution's infrastructure — without leaving your desk.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'Real-time server health across all sites',
              'Centralized configuration & rollout',
              'Role-based access for your team',
            ].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <i className="ti ti-arrow-right text-base shrink-0" style={{ color: SUB }} aria-hidden="true"></i>
                <span className="text-sm" style={{ color: INK }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[12px]" style={{ color: SUB }}>
          © {new Date().getFullYear()} ISF Analytica &amp; Informatica Pvt. Ltd.
        </p>
      </div>

      {/* ───────────────── Right — sign-in form ───────────────── */}
      <div className="flex-1 flex flex-col" style={{ background: '#111110' }}>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px] bg-white border p-8" style={{ borderColor: INK + '1A' }}>

            {/* mobile-only logo */}
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 flex items-center justify-center" style={{ background: '#4B4B47' }}>
                <img src={logo} alt="ISF-Infra" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-bold tracking-tight" style={{ color: INK }}>ISF-INFRA</span>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-extrabold uppercase tracking-tight" style={{ color: INK }}>Sign in</h2>
              <p className="text-sm mt-1.5" style={{ color: SUB }}>
                Welcome back. Enter your credentials to continue.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ color: INK }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="yash@isf.com"
                  required
                  className="w-full px-3.5 py-2.5 text-sm border outline-none transition-colors"
                  style={{ borderColor: INK + '33', color: INK }}
                  onFocus={e => e.target.style.borderColor = INK}
                  onBlur={e => e.target.style.borderColor = INK + '33'}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[13px] font-semibold" style={{ color: INK }}>Password</label>
                  <button type="button" className="text-[12.5px] font-semibold" style={{ color: SUB }}>
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm border outline-none transition-colors"
                    style={{ borderColor: INK + '33', color: INK }}
                    onFocus={e => e.target.style.borderColor = INK}
                    onBlur={e => e.target.style.borderColor = INK + '33'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: SUB }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'} text-[17px]`} aria-hidden="true"></i>
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-0.5 cursor-pointer select-none">
                <input type="checkbox" className="w-3.5 h-3.5" style={{ accentColor: INK }} />
                <span className="text-[13px]" style={{ color: SUB }}>Keep me signed in</span>
              </label>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 text-[13px] border" style={{ background: '#FDECEC', borderColor: '#E8A5A5', color: '#8A2A2A' }}>
                  <i className="ti ti-alert-circle text-sm shrink-0" aria-hidden="true"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-bold text-white border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                style={{ background: INK }}
              >
                {loading ? (
                  <>
                    <i className="ti ti-loader-2 animate-spin text-base" aria-hidden="true"></i>
                    Signing in
                  </>
                ) : (
                  <>
                    Sign in
                    <i className="ti ti-arrow-right text-base" aria-hidden="true"></i>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[13px] mt-8" style={{ color: SUB }}>
              Need access? Contact your{' '}
              <span className="font-semibold" style={{ color: INK }}>system administrator</span>.
            </p>
          </div>

          {/* trust strip */}
          <div className="w-full max-w-[400px] flex items-center justify-center gap-6 mt-8">
            {[
              { icon: 'ti-shield-check', label: '256-bit encryption' },
              { icon: 'ti-lock', label: 'SSO ready' },
              { icon: 'ti-server', label: '99.9% uptime' },
            ].map((t, i) => (
              <div key={t.label} className="flex items-center gap-6">
                {i > 0 && <div className="w-px h-3 bg-white/15"></div>}
                <div className="flex items-center gap-1.5 text-white/50">
                  <i className={`ti ${t.icon} text-[15px]`} aria-hidden="true"></i>
                  <span className="text-[12px]">{t.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}