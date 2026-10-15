import { motion } from 'framer-motion'

/**
 * Large isometric-style shield with circuit traces, glowing nodes, and the
 * brand's "F" mark at the center — the right-side visual anchor, in the
 * style of the SILA/LEFTA references. Built entirely in SVG so it never
 * breaks or looks mismatched like a stock photo can.
 */
export default function ShieldIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:max-w-none">
      {/* glow beams behind the shield */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-signal-500/20 blur-[100px]" />
      </div>
      <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-amber-500/20 blur-[80px]" />

      <motion.svg
        viewBox="0 0 480 520"
        className="relative w-full h-auto drop-shadow-[0_0_60px_rgba(79,214,232,0.25)]"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <defs>
          <linearGradient id="shieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#153061" />
            <stop offset="100%" stopColor="#0A1730" />
          </linearGradient>
          <linearGradient id="shieldEdge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4FD6E8" />
            <stop offset="100%" stopColor="#F5AE0E" />
          </linearGradient>
          {/* Clips the scan sweep to the shield's own outline, so it can
              never overflow past the narrow top point like it used to. */}
          <clipPath id="shieldClip">
            <path d="M240 40 L400 100 V260 C400 360 330 430 240 470 C150 430 80 360 80 260 V100 Z" />
          </clipPath>
        </defs>

        {/* circuit traces radiating out from the shield */}
        <g stroke="#2BC4D9" strokeWidth="1.2" fill="none" opacity="0.35">
          <path d="M240 260 L120 180 L60 180" />
          <path d="M240 260 L100 320 L40 320" />
          <path d="M240 260 L360 150 L420 150" />
          <path d="M240 260 L380 340 L440 340" />
          <path d="M240 260 L240 420 L240 470" />
        </g>
        <g fill="#4FD6E8" opacity="0.7">
          <circle cx="60" cy="180" r="4" />
          <circle cx="40" cy="320" r="4" />
          <circle cx="420" cy="150" r="4" />
          <circle cx="440" cy="340" r="4" />
          <circle cx="240" cy="470" r="4" />
        </g>

        {/* the shield body */}
        <path
          d="M240 40 L400 100 V260 C400 360 330 430 240 470 C150 430 80 360 80 260 V100 Z"
          fill="url(#shieldFill)"
          stroke="url(#shieldEdge)"
          strokeWidth="3"
        />

        {/* inner facet */}
        <path
          d="M240 80 L360 125 V255 C360 330 310 380 240 410 C170 380 120 330 120 255 V125 Z"
          fill="none"
          stroke="#4FD6E8"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* the brand's "F" mark, centered in the shield */}
        <g fill="url(#shieldEdge)">
          <rect x="203" y="165" width="20" height="130" rx="2" />
          <rect x="203" y="165" width="72" height="24" rx="2" />
          <rect x="203" y="216" width="58" height="22" rx="2" />
        </g>

        {/* scan sweep — clipped to the shield outline */}
        <g clipPath="url(#shieldClip)">
          <motion.rect
            x="80"
            y="40"
            width="320"
            height="40"
            fill="url(#shieldEdge)"
            opacity="0.15"
            animate={{ y: [40, 430, 40] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>
      </motion.svg>

      {/* floating trust chip anchored to the illustration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-6 right-2 md:right-6 bg-abyss-900/90 backdrop-blur border border-white/10 px-4 py-2.5 clip-facet-r text-xs text-mist-200 shadow-glow"
      >
        <span className="text-signal-400 font-semibold">Identity verified</span> · 0.8s
      </motion.div>
    </div>
  )
}
