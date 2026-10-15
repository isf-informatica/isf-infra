import * as Icons from 'lucide-react'
import { motion } from 'framer-motion'
import Reveal from '../../components/common/Reveal.jsx'
import SectionHeading from '../../components/common/SectionHeading.jsx'
import { services } from '../../data/mockData.js'

export default function Services() {
  return (
    <section id="services" className="py-24 md:py-32 bg-abyss-950 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeading
          title="Everything the shield checks, before risk reaches you."
          description="Six connected layers of verification, working together as one system."
        />

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service, i) => {
            const Icon = Icons[service.icon] ?? Icons.Shield
            return (
              <Reveal key={service.title} delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className={`group p-7 h-full border border-white/5 bg-facet-card hover:border-signal-500/30 transition-colors ${
                    i % 2 === 0 ? 'clip-facet' : 'clip-facet-r'
                  }`}
                >
                  <div className="w-11 h-11 flex items-center justify-center bg-signal-500/10 text-signal-400 clip-shield group-hover:bg-amber-500/10 group-hover:text-amber-400 transition-colors">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-mist-100">{service.title}</h3>
                  <p className="mt-2.5 text-sm text-mist-300 leading-relaxed">{service.description}</p>
                </motion.div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
