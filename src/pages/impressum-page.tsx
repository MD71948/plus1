import { useNavigate } from 'react-router-dom'

export function ImpressumPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--bg)' }}>
      <div className="sticky top-0 z-10"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">Impressum</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 flex flex-col gap-5">
        <div className="bg-white rounded-3xl p-5 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <h2 className="text-base font-black text-gray-900 mb-4">Angaben gemäß § 5 TMG</h2>
          <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-1">
            <p className="font-bold text-gray-900">Marc Dahmann</p>
            <p>[Straße und Hausnummer]</p>
            <p>[PLZ Ort]</p>
            <p>Deutschland</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <h2 className="text-base font-black text-gray-900 mb-4">Kontakt</h2>
          <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-1">
            <p>E-Mail: <a href="mailto:[deine@email.de]" className="text-violet-600 font-semibold">[deine@email.de]</a></p>
            <p>Telefon: [Telefonnummer]</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <h2 className="text-base font-black text-gray-900 mb-4">Haftungsausschluss</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Die Inhalte dieser App wurden mit größtmöglicher Sorgfalt erstellt.
            Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann
            jedoch keine Gewähr übernommen werden. Als Diensteanbieter sind wir
            gemäß § 7 Abs.1 TMG für eigene Inhalte nach den allgemeinen Gesetzen
            verantwortlich.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 text-sm text-amber-700 font-medium">
          ⚠️ Bitte ersetze die Platzhalter oben mit deinen echten Daten vor dem Launch.
        </div>
      </div>
    </div>
  )
}
