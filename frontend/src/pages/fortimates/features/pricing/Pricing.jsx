import { FM_DASH } from '../../config.js'
import { Check } from 'lucide-react'
import Reveal from '../../components/common/Reveal.jsx'
import SectionHeading from '../../components/common/SectionHeading.jsx'
import Button from '../../components/common/Button.jsx'
import { pricingPlans } from '../../data/mockData.js'

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 bg-abyss-950">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeading
          align="center"
          title="Straightforward pricing, whatever your scale."
          description="Start free. Upgrade the day fraud starts costing you more than the plan would."
        />

        <div className="mt-14 grid md:grid-cols-3 gap-6 items-stretch">
          {pricingPlans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08}>
              <div
                className={`relative p-8 h-full flex flex-col border ${
                  plan.highlighted
                    ? 'border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-transparent shadow-amberGlow clip-facet'
                    : 'border-white/5 bg-facet-card clip-facet-r'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-8 px-3 py-1 bg-amber-500 text-abyss-950 text-xs font-semibold clip-facet-r">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-mist-100">{plan.name}</h3>
                <p className="mt-1 text-sm text-mist-400">{plan.description}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-display font-semibold text-mist-100">{plan.price}</span>
                  {plan.period && <span className="text-sm text-mist-400 mb-1">{plan.period}</span>}
                </div>
                <ul className="mt-7 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-mist-300">
                      <Check size={16} className="text-signal-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  to={FM_DASH}
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  className="mt-8 w-full"
                >
                  Get started
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
