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
    bg: 'linear-gradient(160deg, #3B0764 0%, #6D28D9 50%, #9F67FF 100%)',
    accentColor: '#7C3AED',
    // Visual: floating activity pins
    visual: (
      <div className="relative w-56 h-44 mx-auto">
        {/* Map-like background */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-30"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute border border-white/20"
              style={{ left: `${i * 25}%`, top: 0, bottom: 0, width: 1 }} />
          ))}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute border border-white/20"
              style={{ top: `${i * 25}%`, left: 0, right: 0, height: 1 }} />
          ))}
        </div>
        {/* Floating pins */}
        {[
          { emoji: '⚽', color: '#EF4444', top: '10%', left: '15%', delay: '0s' },
          { emoji: '🍕', color: '#F97316', top: '15%', right: '20%', delay: '0.3s' },
          { emoji: '🎵', color: '#EC4899', bottom: '25%', left: '10%', delay: '0.6s' },
          { emoji: '🎮', color: '#3B82F6', bottom: '10%', right: '15%', delay: '0.9s' },
          { emoji: '🏕️', color: '#22C55E', top: '45%', left: '40%', delay: '0.15s' },
        ].map((pin, i) => (
          <div key={i} className="absolute animate-bounce"
            style={{ top: pin.top, left: (pin as any).left, right: (pin as any).right, bottom: pin.bottom, animationDelay: pin.delay, animationDuration: '2.5s' }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg"
              style={{ background: pin.color, boxShadow: `0 4px 16px ${pin.color}66` }}>
              {pin.emoji}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    emoji: '🗺️',
    title: 'Entdecke was läuft',
    subtitle: 'Was ist gerade los?',
    desc: 'Schau auf der Karte was in deiner Nähe passiert. Filtere nach Kategorie, Entfernung und Vibe. Anfrage senden — fertig.',
    bg: 'linear-gradient(160deg, #1E3A5F 0%, #1D4ED8 50%, #60A5FA 100%)',
    accentColor: '#2563EB',
    visual: (
      <div className="relative w-56 h-44 mx-auto">
        {/* Phone mockup */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)' }}>
          {/* Map grid */}
          <div className="absolute inset-2 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            {/* Simulated streets */}
            <div className="absolute bg-white/20" style={{ top: '40%', left: 0, right: 0, height: 2 }} />
            <div className="absolute bg-white/20" style={{ top: '70%', left: 0, right: 0, height: 2 }} />
            <div className="absolute bg-white/20" style={{ left: '35%', top: 0, bottom: 0, width: 2 }} />
            <div className="absolute bg-white/20" style={{ left: '65%', top: 0, bottom: 0, width: 2 }} />
            {/* User dot */}
            <div className="absolute w-4 h-4 rounded-full bg-white"
              style={{ top: '38%', left: '33%', transform: 'translate(-50%,-50%)', boxShadow: '0 0 0 4px rgba(255,255,255,0.3)' }} />
            {/* Activity pins */}
            {[
              { emoji: '⚽', top: '15%', left: '55%' },
              { emoji: '🍕', top: '60%', left: '15%' },
              { emoji: '🎵', top: '25%', left: '80%' },
            ].map((p, i) => (
              <div key={i} className="absolute w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-md"
                style={{ top: p.top, left: p.left, transform: 'translate(-50%,-50%)', background: 'rgba(255,255,255,0.95)' }}>
                {p.emoji}
              </div>
            ))}
          </div>
        </div>
        {/* Radius circle */}
        <div className="absolute rounded-full border-2 border-white/40"
          style={{ width: 80, height: 80, top: '25%', left: '20%', transform: 'translate(-50%,-50%)', borderStyle: 'dashed' }} />
      </div>
    ),
  },
  {
    emoji: '🙌',
    title: 'Selbst was starten',
    subtitle: 'Du entscheidest.',
    desc: 'Post eine Aktivität in unter 15 Sekunden. Du siehst wer anfragen will, nimmst an oder lehnst ab — per Swipe.',
    bg: 'linear-gradient(160deg, #064E3B 0%, #047857 50%, #34D399 100%)',
    accentColor: '#059669',
    visual: (
      <div className="relative w-56 h-44 mx-auto flex flex-col items-center justify-center gap-3">
        {/* Swipe cards */}
        <div className="relative w-48 h-28">
          {/* Card 3 (back) */}
          <div className="absolute inset-0 rounded-2xl opacity-30"
            style={{ background: 'rgba(255,255,255,0.2)', transform: 'rotate(4deg) translateY(4px)' }} />
          {/* Card 2 */}
          <div className="absolute inset-0 rounded-2xl opacity-60"
            style={{ background: 'rgba(255,255,255,0.25)', transform: 'rotate(2deg) translateY(2px)' }} />
          {/* Card 1 (front) */}
          <div className="absolute inset-0 rounded-2xl flex items-center gap-3 px-4"
            style={{ background: 'rgba(255,255,255,0.95)' }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
              M
            </div>
            <div className="flex-1">
              <div className="text-gray-900 text-xs font-black">Marco, 28</div>
              <div className="text-gray-500 text-[10px]">"Bin dabei! 🏓"</div>
            </div>
          </div>
        </div>
        {/* Accept / Reject indicators */}
        <div className="flex gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-lg"
            style={{ background: 'rgba(239,68,68,0.85)' }}>👎</div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-lg"
            style={{ background: 'rgba(16,185,129,0.85)' }}>👍</div>
        </div>
      </div>
    ),
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
    <div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: slide.bg, transition: 'background 0.6s ease' }}>

      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: '-15%', right: '-15%',
          width: '55vw', height: '55vw', maxWidth: 320, maxHeight: 320,
          borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
          transition: 'all 0.6s ease',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-10%',
          width: '45vw', height: '45vw', maxWidth: 260, maxHeight: 260,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
          transition: 'all 0.6s ease',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: '-5%',
          width: '25vw', height: '25vw', maxWidth: 140, maxHeight: 140,
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
        }} />
      </div>

      {/* Skip */}
      <div className="relative flex justify-between items-center px-6 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black"
            style={{ background: 'rgba(255,255,255,0.2)' }}>⚡</div>
          <span className="text-white font-black text-base tracking-tight">
            plus<span className="opacity-60">1</span>
          </span>
        </div>
        {!isLast && (
          <button onClick={finish} className="text-white/50 text-sm font-semibold hover:text-white transition-colors">
            Überspringen
          </button>
        )}
      </div>

      {/* Visual illustration */}
      <div key={`visual-${step}`} className="relative flex items-center justify-center py-4 animate-fade-up px-6">
        {slide.visual}
      </div>

      {/* Text content */}
      <div key={`text-${step}`} className="relative flex-1 flex flex-col justify-center px-7 animate-fade-up"
        style={{ animationDelay: '0.08s' }}>
        <p className="text-white/55 text-xs font-black uppercase tracking-widest mb-2">
          {slide.subtitle}
        </p>
        <h1 className="text-3xl font-black text-white mb-3 leading-tight">
          {slide.title}
        </h1>
        <p className="text-white/70 text-base leading-relaxed">
          {slide.desc}
        </p>
      </div>

      {/* Bottom controls */}
      <div className="relative px-6 pb-10 flex flex-col items-center gap-5">
        {/* Progress dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 28 : 8,
                height: 8,
                background: i === step ? 'white' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <button onClick={next}
          className="press w-full max-w-xs py-4 rounded-3xl text-base font-black transition-all"
          style={{
            background: 'white',
            color: slide.accentColor,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
          }}>
          {isLast ? 'Los geht\'s ⚡' : 'Weiter →'}
        </button>
      </div>
    </div>
  )
}
