import { FM_BASE, FM_DASH, FM_LOGIN, FM_EXIT_PATH } from '../../config.js'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import BrandLogo from '../../assets/BrandLogo.jsx'
import Button from '../common/Button.jsx'

const links = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Team', href: '#team' },
  { label: 'Pricing', href: '#pricing' }
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-abyss-950/85 backdrop-blur-md border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 h-20">
        <Link to={FM_BASE} className="flex items-center">
          <BrandLogo variant="full" className="h-9 md:h-10 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-9">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-mist-300 hover:text-signal-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {/* Integrated into EasyReach: way back to the ISF Infra home */}
          <Link to={FM_EXIT_PATH} className="text-sm text-mist-400 hover:text-amber-400 transition-colors mr-3">
            ← ISF Infra
          </Link>
          <NavLink to={FM_LOGIN} className="text-sm text-mist-300 hover:text-signal-400 transition-colors">
            Login
          </NavLink>
          <Button to={FM_DASH} variant="primary" className="!py-2.5 !px-5 !text-xs">
            Open Dashboard
          </Button>
        </div>

        <button
          className="md:hidden text-mist-100"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-abyss-950/95 border-b border-white/5"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="py-2.5 text-mist-300 hover:text-signal-400 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to={FM_DASH}
                onClick={() => setOpen(false)}
                className="mt-2 py-2.5 text-signal-400 font-medium"
              >
                Open Dashboard →
              </Link>
              <Link
                to={FM_EXIT_PATH}
                onClick={() => setOpen(false)}
                className="py-2.5 text-mist-400"
              >
                ← Back to ISF Infra
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
