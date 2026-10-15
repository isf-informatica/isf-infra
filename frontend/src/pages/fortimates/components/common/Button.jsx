import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 px-6 py-3 font-display font-semibold text-sm tracking-wide transition-all duration-300 clip-facet-r'

const variants = {
  primary:
    'bg-gold-signal text-abyss-950 shadow-amberGlow hover:brightness-110',
  outline:
    'border border-signal-500/50 text-mist-100 hover:border-signal-400 hover:bg-signal-500/10',
  ghost: 'text-mist-200 hover:text-signal-400'
}

export default function Button({
  children,
  to,
  href,
  variant = 'primary',
  className = '',
  onClick,
  type = 'button',
  disabled = false
}) {
  const classes = `${base} ${variants[variant]} ${className}`

  const content = (
    <motion.span
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={classes}
    >
      {children}
    </motion.span>
  )

  if (to) {
    return (
      <Link to={to} className="inline-block">
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className="inline-block" target="_blank" rel="noreferrer">
        {content}
      </a>
    )
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="inline-block disabled:opacity-40 disabled:cursor-not-allowed">
      {content}
    </button>
  )
}
