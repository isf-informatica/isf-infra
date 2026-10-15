import { FM_BASE } from '../../config.js'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import BrandLogo from '../../assets/BrandLogo.jsx'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-abyss-950">
      {/* Left: brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 bg-mesh-hero overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-signal-500/20 blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[-60px] w-96 h-96 rounded-full bg-amber-500/15 blur-[130px]" />

        <Link to={FM_BASE} className="relative z-10">
          <BrandLogo variant="full" className="h-9 w-auto" />
        </Link>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-signal-500/30 bg-signal-500/5 clip-facet-r text-xs text-signal-300 mb-6">
            <ShieldCheck size={13} />
            AI-verified identity platform
          </div>
          <h2 className="text-3xl font-display font-bold text-mist-100 leading-tight">
            Every account, verified before risk gets in.
          </h2>
          <p className="mt-4 text-mist-300 leading-relaxed">
            FortiMates checks breach data, fraud signals and KYC in real time —
            so your platform only ever sees genuine users.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-xs text-mist-400">
          <span><strong className="text-mist-100 font-display">248K+</strong> accounts protected</span>
          <span><strong className="text-mist-100 font-display">99.4%</strong> detection accuracy</span>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Link to={FM_BASE} className="lg:hidden inline-block mb-8">
            <BrandLogo variant="full" className="h-8 w-auto" />
          </Link>
          <h1 className="text-2xl font-display font-semibold text-mist-100">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-mist-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  )
}
