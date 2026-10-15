import { Quote } from 'lucide-react'
import Reveal from '../../components/common/Reveal.jsx'
import SectionHeading from '../../components/common/SectionHeading.jsx'
import { testimonials } from '../../data/mockData.js'

export default function Testimonials() {
  return (
    <section className="py-24 md:py-32 bg-abyss-900">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeading title="Trusted by teams who can't afford to guess." align="center" />

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div className="p-7 h-full bg-facet-card border border-white/5 clip-facet-r flex flex-col">
                <Quote className="text-amber-400/70" size={22} />
                <p className="mt-4 text-sm text-mist-200 leading-relaxed flex-1">
                  {t.quote}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="w-10 h-10 object-cover clip-shield"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-semibold text-mist-100">{t.name}</p>
                    <p className="text-xs text-mist-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
