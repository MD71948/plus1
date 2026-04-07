import { useState } from 'react'

interface OnboardingPageProps {
  onDone: () => void
}

const SLIDES = [
  {
    emoji: '⚡',
    title: 'Willkommen bei plus1',
    subtitle: 'Spontan. Echt. Jetzt.',
    desc: 'In 30 Sekunden von "Ich hab Bock" zu "Wir sind komplett." Finde Menschen die gerade das Gleiche wollen wie du.',
    bg: 'linear-gradient(160deg, #3B0764 0%, #7C3AED 60%, #9F67FF 100%)',
  },
  {
    emoji: '🗺️',
    title: 'Aktivitäten entdecken',
    subtitle: 'Was ist gerade los?',
    desc: 'Schau auf der Karte was in deiner Nähe passiert. Filtere nach Kategorie, Entfernung und Vibe. Anfrage senden — fertig.',
    bg: 'linear-gradient(160deg, #1E3A5F 0%, #2563EB 60%, #60A5FA 100%)',
  },
  {
    emoji: '🙌',
    title: 'Selbst was starten',
    subtitle: 'Du entscheidest.',
    desc: 'Post eine Aktivität in unter 15 Sekunden. Du siehst wer anfragen will, nimmst an oder lehnst ab — per Swipe.',
    bg: 'linear-gradient(160deg, #064E3B 0%, #059669 60%, #34D399 100%)',
  },
]

export function OnboardingPage({ onDone }: OnboardingPageProps) {
  const [step, setStep] = useState(0)
  const slide = SLIDES[step]
  const isLast = step === SLIDES.length - 1

  function finish() {
    localStorage.setItem('onboarding_done', '1')
    onDone()
  }

  function next() {
    if (isLast) finish()
    else setStep(s => s + 1)
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: slide.bg, transition: 'background 0.5s ease' }}>

      {/* Skip */}
      <div className="flex justify-end px-6 pt-12 pb-4">
        <button onClick={finish} className="text-white/60 text-sm font-semibold hover:text-white transition-colors">
          Überspringen
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Big emoji */}
        <div
          key={step}
          className="text-8xl mb-8 animate-fade-up"
          style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}>
          {slide.emoji}
        </div>

        <div key={`text-${step}`} className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-2">
            {slide.subtitle}
          </p>
          <h1 className="text-3xl font-black text-white mb-4 leading-tight">
            {slide.title}
          </h1>
          <p className="text-white/75 text-base leading-relaxed max-w-xs mx-auto">
            {slide.desc}
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-12 flex flex-col items-center gap-6">

        {/* Progress dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                background: i === step ? 'white' : 'rgba(255,255,255,0.35)',
              }}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={next}
          className="press w-full max-w-xs py-4 rounded-3xl text-base font-black transition-all"
          style={{
            background: 'white',
            color: step === 0 ? '#7C3AED' : step === 1 ? '#2563EB' : '#059669',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}>
          {isLast ? 'Los geht\'s ⚡' : 'Weiter →'}
        </button>
      </div>
    </div>
  )
}
