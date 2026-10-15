import { Target, Compass } from 'lucide-react'
import Reveal from '../../components/common/Reveal.jsx'
import SectionHeading from '../../components/common/SectionHeading.jsx'
import BiometricPortrait from '../../components/common/BiometricPortrait.jsx'

export default function About() {
  return (
    <section id="about" className="py-24 md:py-32 bg-abyss-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <SectionHeading
            title="A secure mailing shield for the accounts you can't afford to lose."
            description="FortiMates was built after watching too many businesses lose money and trust to fraud they never saw coming. Breach exposure, fake registrations and identity theft don't announce themselves — so we built the system that catches them first."
          />

          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            <Reveal delay={0.05}>
              <div className="p-7 bg-facet-card border border-white/5 clip-facet h-full">
                <Compass className="text-signal-400" size={26} />
                <h3 className="mt-4 text-lg font-semibold text-mist-100">Our vision</h3>
                <p className="mt-2.5 text-sm text-mist-300 leading-relaxed">
                  A fraud-free environment that enables the healthy, sustainable growth
                  of the whole internet economy.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="p-7 bg-facet-card border border-white/5 clip-facet-r h-full">
                <Target className="text-amber-400" size={26} />
                <h3 className="mt-4 text-lg font-semibold text-mist-100">Our mission</h3>
                <p className="mt-2.5 text-sm text-mist-300 leading-relaxed">
                  Eliminate fake registrations at their source, using AI that reads
                  risk the way a trained analyst would — instantly, at scale.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.1}>
          <div className="relative max-w-md mx-auto">
            <BiometricPortrait
              src="https://images.pexels.com/photos/3785424/pexels-photo-3785424.jpeg"
              alt="A verified FortiMates user"
              className="aspect-[4/5] clip-facet border border-white/10"
            />
            <div className="absolute -bottom-5 -left-5 bg-abyss-950 border border-signal-500/30 px-4 py-2.5 clip-facet-r text-xs text-signal-400 shadow-glow">
              Identity confirmed · 0.8s
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
