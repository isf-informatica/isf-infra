import Reveal from './Reveal.jsx'

export default function SectionHeading({ title, description, align = 'left' }) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left'
  return (
    <Reveal className={`max-w-2xl ${alignment}`}>
      <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-mist-100">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-mist-300 text-base md:text-lg leading-relaxed">
          {description}
        </p>
      )}
    </Reveal>
  )
}
