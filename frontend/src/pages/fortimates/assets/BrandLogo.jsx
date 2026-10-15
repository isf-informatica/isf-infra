/**
 * Official FortiMates brand mark, supplied as artwork (not recreated in CSS).
 * `variant="icon"` -> shield mark only, for tight spaces (sidebar, favicon-adjacent).
 * `variant="full"` -> shield + wordmark lockup, for navbar/footer/hero.
 */
export default function BrandLogo({ variant = 'full', className = 'h-9 w-auto' }) {
  const src = variant === 'icon' ? '/fortimates/brand/logo-icon.png' : '/fortimates/brand/logo-full.png'
  return <img src={src} alt="FortiMates" className={className} draggable={false} />
}
