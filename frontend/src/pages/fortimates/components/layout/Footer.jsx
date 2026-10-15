import { FM_BASE, FM_DASH } from '../../config.js'
import { Link } from 'react-router-dom'
import { Twitter, Linkedin, Github } from '../common/BrandIcons.jsx'
import BrandLogo from '../../assets/BrandLogo.jsx'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-abyss-950 relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Link to={FM_BASE} className="flex items-center">
              <BrandLogo variant="full" className="h-9 w-auto" />
            </Link>
            <p className="mt-4 text-mist-400 text-sm max-w-sm leading-relaxed">
              Smart users for smart system. FortiMates verifies every account with
              AI-grade precision so trust never has to be assumed.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" aria-label="Twitter" className="text-mist-400 hover:text-signal-400 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-mist-400 hover:text-signal-400 transition-colors">
                <Linkedin size={18} />
              </a>
              <a href="#" aria-label="GitHub" className="text-mist-400 hover:text-signal-400 transition-colors">
                <Github size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-mist-100 mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-mist-400">
              <li><a href="#services" className="hover:text-signal-400 transition-colors">Services</a></li>
              <li><a href="#how-it-works" className="hover:text-signal-400 transition-colors">How it works</a></li>
              <li><a href="#pricing" className="hover:text-signal-400 transition-colors">Pricing</a></li>
              <li><Link to={FM_DASH} className="hover:text-signal-400 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-mist-100 mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-mist-400">
              <li><a href="#about" className="hover:text-signal-400 transition-colors">About</a></li>
              <li><a href="#team" className="hover:text-signal-400 transition-colors">Team</a></li>
              <li><a href="#contact" className="hover:text-signal-400 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-signal-400 transition-colors">Whitepaper</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-mist-400">
            © {new Date().getFullYear()} FortiMates. All rights reserved.
          </p>
          <p className="text-xs text-mist-400">Smart users for smart system.</p>
        </div>
      </div>
    </footer>
  )
}
