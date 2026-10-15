import { FM_REGISTER } from '../../config.js'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Sparkles, ArrowRight } from 'lucide-react'
import Button from '../../components/common/Button.jsx'
import AnimatedCounter from '../../components/common/AnimatedCounter.jsx'
import VideoModal from './VideoModal.jsx'
import ShieldIllustration from './ShieldIllustration.jsx'

export default function Hero() {
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <section className="relative min-h-screen w-full overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 bg-mesh-hero">
      <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 relative grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-signal-500/30 bg-signal-500/5 clip-facet-r text-xs text-signal-300"
          >
            <Sparkles size={12} />
            AI-verified identity platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] font-display font-bold leading-[1.08] text-mist-100"
          >
            Stop fraud before<br />
            it reaches <span className="text-gradient-signal">your users.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lg text-mist-300 max-w-lg leading-relaxed"
          >
            FortiMates checks every email, login and identity against breach
            data, fraud patterns and KYC checks in real time — so genuine
            users pass through and threats never get in.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Button to={FM_REGISTER} variant="primary">
              Get Started
              <ArrowRight size={16} />
            </Button>
            <button
              onClick={() => setVideoOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 clip-facet-r border border-white/15 text-mist-100 text-sm font-display font-semibold hover:bg-white/5 transition-colors"
            >
              <Play size={15} />
              Watch Video
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-4"
          >
            <div>
              <p className="text-2xl font-display font-semibold text-mist-100">
                <AnimatedCounter value={248} suffix="K+" />
              </p>
              <p className="text-xs text-mist-400 mt-1">Accounts protected</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-2xl font-display font-semibold text-mist-100">
                <AnimatedCounter value={99.4} suffix="%" decimals={1} />
              </p>
              <p className="text-xs text-mist-400 mt-1">Detection accuracy</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-2xl font-display font-semibold text-mist-100">
                <AnimatedCounter value={0.8} suffix="s" decimals={1} />
              </p>
              <p className="text-xs text-mist-400 mt-1">Average scan time</p>
            </div>
          </motion.div>
        </div>

        {/* Right: illustration */}
        <ShieldIllustration />
      </div>

      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} videoUrl="" />
    </section>
  )
}
