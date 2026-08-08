import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import useAuthStore from '../../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#EBF4FF 0%,#E8FFF5 50%,#F0F7FF 100%)'}}>
      <div className="w-full max-w-sm px-6">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{background:'linear-gradient(135deg,#60A5FA,#34D399)',boxShadow:'0 8px 24px rgba(96,165,250,0.3)'}}>
            <i className="ti ti-server-2 text-white text-2xl" aria-hidden="true"></i>
          </div>
          <h1 className="text-2xl font-medium text-[#1E3A5F]">EasyReach</h1>
          <p className="text-sm text-[#7BA7C7] mt-1">ISF Media Server Control Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-7 border border-[#D4E8FF]" style={{boxShadow:'0 8px 32px rgba(96,165,250,0.12)'}}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#5B7FA6] mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="yash@isf.com" required
                className="w-full rounded-xl px-4 py-3 text-sm border border-[#D4E8FF] bg-[#F5F9FF] text-[#1E3A5F] outline-none placeholder-[#A0B8D0] focus:border-[#60A5FA] focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5B7FA6] mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full rounded-xl px-4 py-3 text-sm border border-[#D4E8FF] bg-[#F5F9FF] text-[#1E3A5F] outline-none placeholder-[#A0B8D0] focus:border-[#60A5FA] focus:bg-white transition-all" />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs bg-[#FFF0F0] border border-[#FFCDD2] text-[#C62828]">
                <i className="ti ti-alert-circle" aria-hidden="true"></i> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer disabled:opacity-60 transition-all mt-2"
              style={{background:'linear-gradient(135deg,#60A5FA,#34D399)',boxShadow:'0 4px 12px rgba(96,165,250,0.3)'}}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#A0B8D0] mt-6">
          ISF Analytica & Informatica Pvt. Ltd.
        </p>
      </div>
    </div>
  )
}