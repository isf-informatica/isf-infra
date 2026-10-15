import { motion } from 'framer-motion'

/**
 * Wraps a human photo with a subtle biometric scan overlay (corner brackets +
 * a sweeping scan line) — the visual language used on identity-verification
 * sites like Innovatrics. Used wherever we show real people (team, about).
 */
export default function BiometricPortrait({ src, alt, className = '' }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />

      {/* corner scan brackets */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <g stroke="#4FD6E8" strokeWidth="0.6" fill="none" opacity="0.85">
          <path d="M4 14 V4 H14" />
          <path d="M86 4 H96 V14" />
          <path d="M96 86 V96 H86" />
          <path d="M14 96 H4 V86" />
        </g>
      </svg>

      {/* sweeping scan line */}
      <motion.div
        initial={{ y: '-10%' }}
        animate={{ y: '110%' }}
        transition={{ duration: 2.6, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
        className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-signal-400/25 to-transparent pointer-events-none"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-abyss-950/70 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}
