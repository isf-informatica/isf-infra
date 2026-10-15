import Reveal from '../../components/common/Reveal.jsx'
import SectionHeading from '../../components/common/SectionHeading.jsx'
import { howItWorks } from '../../data/mockData.js'

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-abyss-900 relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 md:px-10 relative">
        <SectionHeading
          align="center"
          title="From first connection to constant protection."
          description="A four-step flow that runs quietly in the background of your product."
        />

        <div className="mt-16 grid md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-signal-500/30 to-transparent" />
          {howItWorks.map((item, i) => (
            <Reveal key={item.step} delay={i * 0.1}>
              <div className="relative text-center md:text-left">
                <div className="w-12 h-12 mx-auto md:mx-0 flex items-center justify-center bg-abyss-950 border border-signal-500/40 text-signal-400 font-display font-semibold clip-shield relative z-10">
                  {item.step}
                </div>
                <h3 className="mt-5 text-base font-semibold text-mist-100">{item.title}</h3>
                <p className="mt-2 text-sm text-mist-300 leading-relaxed">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
