import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import Hero from '../features/hero/Hero.jsx'
import About from '../features/about/About.jsx'
import Services from '../features/services/Services.jsx'
import HowItWorks from '../features/howItWorks/HowItWorks.jsx'
import Team from '../features/team/Team.jsx'
import Testimonials from '../features/testimonials/Testimonials.jsx'
import Pricing from '../features/pricing/Pricing.jsx'
import Contact from '../features/contact/Contact.jsx'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-abyss-950">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <HowItWorks />
        <Team />
        <Testimonials />
        <Pricing />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
