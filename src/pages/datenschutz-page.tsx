import { useNavigate } from 'react-router-dom'

export function DatenschutzPage() {
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
          <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">Datenschutz</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 flex flex-col gap-4">

        {([
          {
            title: '1. Verantwortlicher',
            text: 'Verantwortlich für die Datenverarbeitung in dieser App ist Marc Dahmann, [Adresse], [E-Mail].',
          },
          {
            title: '2. Welche Daten wir erheben',
            text: 'Wir erheben folgende Daten, die du freiwillig angibst: Name, E-Mail-Adresse, Profilfoto, Interessen, Wohnort (Stadtteil/PLZ), Sprachen, Alter. Außerdem werden durch die Nutzung der App erstellt: Aktivitäten, Anfragen, Chat-Nachrichten, Bewertungen.',
          },
          {
            title: '3. Zweck der Datenverarbeitung',
            text: 'Deine Daten werden ausschließlich genutzt, um die App-Funktionen bereitzustellen: Profilerstellung, Aktivitäten finden und erstellen, Kommunikation mit anderen Nutzern. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).',
          },
          {
            title: '4. Speicherung & Löschung',
            text: 'Deine Daten werden auf Servern von Supabase (EU-Region) gespeichert. Du kannst dein Konto und alle zugehörigen Daten jederzeit in den Einstellungen löschen. Nach der Löschung werden deine Daten unverzüglich entfernt.',
          },
          {
            title: '5. Deine Rechte',
            text: 'Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO) und Datenübertragbarkeit (Art. 20 DSGVO). Anfragen richte an: [deine@email.de]',
          },
          {
            title: '6. Drittanbieter',
            text: 'Wir nutzen Supabase (Datenbankhosting, EU), Open-Meteo (Wetterdaten, keine personenbezogenen Daten) und OpenStreetMap/Nominatim (Kartenansicht, keine personenbezogenen Daten). Für Google Login gilt die Datenschutzerklärung von Google.',
          },
          {
            title: '7. Kontakt',
            text: 'Bei Fragen zum Datenschutz wende dich an: [deine@email.de]',
          },
        ]).map(section => (
          <div key={section.title} className="bg-white rounded-3xl p-5 card-shadow" style={{ border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-black text-gray-900 mb-2">{section.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{section.text}</p>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400">Stand: April 2026</p>
      </div>
    </div>
  )
}
