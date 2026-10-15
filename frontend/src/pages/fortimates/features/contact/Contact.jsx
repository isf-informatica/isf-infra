import { useState } from 'react'
import { Send } from 'lucide-react'
import Reveal from '../../components/common/Reveal.jsx'
import Button from '../../components/common/Button.jsx'
import BrandLogo from '../../assets/BrandLogo.jsx'

export default function Contact() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section id="contact" className="py-24 md:py-32 bg-abyss-900 relative overflow-hidden">
      <div className="absolute -right-24 -top-24 opacity-[0.07] rotate-6">
        <BrandLogo variant="icon" className="w-[380px] h-auto" />
      </div>
      <div className="max-w-3xl mx-auto px-6 md:px-10 relative text-center">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-semibold text-mist-100">
            Ready to put a shield in front of your users?
          </h2>
          <p className="mt-4 text-mist-300">
            Talk to us about your platform and we'll show you where the risk is hiding.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          {sent ? (
            <div className="p-8 border border-signal-500/30 bg-signal-500/5 clip-facet text-signal-400">
              Thanks — your message is on its way to our team.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="flex-1 px-5 py-3.5 bg-abyss-950 border border-white/10 focus:border-signal-500/60 outline-none text-sm text-mist-100 placeholder:text-mist-400 clip-facet-r"
              />
              <Button type="submit" variant="primary">
                <Send size={15} />
                Request a demo
              </Button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
