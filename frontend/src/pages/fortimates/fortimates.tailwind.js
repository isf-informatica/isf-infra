/**
 * FortiMates Tailwind tokens — spread into EasyReach's tailwind.config.js
 * under theme.extend. Only NEW names are added (abyss, signal, mist, fonts,
 * gradients, glows, animations), so EasyReach's existing classes don't change.
 *
 * Note: FortiMates' custom `amber` shades are intentionally NOT added —
 * overriding amber would change EasyReach's own amber badges. FortiMates
 * uses Tailwind's default amber-400/500/600 instead (nearly identical gold).
 */
export const fortimatesColors = {
  abyss: { 950: '#050B18', 900: '#0A1730', 800: '#0F2148', 700: '#153061', 600: '#1C3F80' },
  signal: { 400: '#4FD6E8', 500: '#2BC4D9', 600: '#1AA6BC' },
  mist: { 100: '#F4F7FC', 200: '#DCE4F2', 300: '#AAB8D6', 400: '#7C8CAF' }
}

export const fortimatesFontFamily = {
  display: ['"Space Grotesk"', 'sans-serif'],
  body: ['"Inter"', 'sans-serif']
}

export const fortimatesBackgroundImage = {
  'mesh-hero':
    'radial-gradient(circle at 15% 20%, rgba(79,214,232,0.18), transparent 40%), radial-gradient(circle at 85% 0%, rgba(245,174,14,0.14), transparent 45%), linear-gradient(180deg, #050B18 0%, #0A1730 55%, #0F2148 100%)',
  'facet-card': 'linear-gradient(155deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
  'gold-signal': 'linear-gradient(120deg, #F5AE0E 0%, #FFC94A 45%, #4FD6E8 100%)'
}

export const fortimatesBoxShadow = {
  glow: '0 0 0 1px rgba(79,214,232,0.15), 0 20px 60px -20px rgba(79,214,232,0.35)',
  amberGlow: '0 0 0 1px rgba(245,174,14,0.25), 0 20px 60px -20px rgba(245,174,14,0.45)'
}

export const fortimatesAnimation = {
  scan: 'scan 3.2s linear infinite',
  'pulse-ring': 'pulseRing 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
  float: 'float 6s ease-in-out infinite',
  marquee: 'marquee 28s linear infinite'
}

export const fortimatesKeyframes = {
  scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
  pulseRing: {
    '0%': { transform: 'scale(0.9)', opacity: '0.7' },
    '70%': { transform: 'scale(1.6)', opacity: '0' },
    '100%': { transform: 'scale(1.6)', opacity: '0' }
  },
  float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-14px)' } },
  marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } }
}
