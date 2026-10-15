import { Linkedin } from '../../components/common/BrandIcons.jsx'
import Reveal from '../../components/common/Reveal.jsx'
import SectionHeading from '../../components/common/SectionHeading.jsx'
import BiometricPortrait from '../../components/common/BiometricPortrait.jsx'
import { team } from '../../data/mockData.js'

export default function Team() {
  return (
    <section id="team" className="py-24 md:py-32 bg-abyss-950">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <SectionHeading
          title="The people behind the shield."
          description="A small team of security engineers, designers and analysts obsessed with keeping fraud out."
        />

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, i) => (
            <Reveal key={member.name} delay={i * 0.08}>
              <div className="group relative">
                <div className="relative overflow-hidden clip-facet border border-white/5">
                  <BiometricPortrait
                    src={member.photo}
                    alt={member.name}
                    className="aspect-[3/4] grayscale-[15%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  />
                  <a
                    href="#"
                    aria-label={`${member.name} on LinkedIn`}
                    className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center bg-abyss-950/80 backdrop-blur text-mist-200 hover:text-signal-400 clip-shield opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Linkedin size={14} />
                  </a>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-mist-100">{member.name}</h3>
                <p className="text-xs text-mist-400">{member.role}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
