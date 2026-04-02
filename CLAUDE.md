# CLAUDE.md — plus1 App

## Über den Entwickler

- Ich bin Immobilienmakler und Nicht-Programmierer — erkläre jeden technischen Schritt einfach und kurz
- Technische Begriffe auf Englisch sind OK, aber immer mit einer kurzen Erklärung beim ersten Mal
- Antworte auf Deutsch, Code-Kommentare auf Englisch
- Ich lerne durch Machen, nicht durch Theorie — zeig mir direkt lauffähigen Code

## Kommunikationsregeln

- WICHTIG: Bevor du Code schreibst, erkläre in 1-2 Sätzen WAS du tust und WARUM
- Frag nach, wenn dir Infos fehlen — rate nicht
- Wenn du Entscheidungen triffst (z.B. welche Library), erkläre kurz warum
- Wenn etwas schiefgeht, erkläre den Fehler so, dass ich ihn verstehe — keine kryptischen Fehlermeldungen ohne Kontext
- Schlage nach jedem Schritt den nächsten logischen Schritt vor

## App: plus1

Spontan-Aktivitäten-App. Nutzer posten Aktivitäten wo noch Leute fehlen (z.B. "Brauche 4. Padel-Spieler, heute 18 Uhr"). Andere senden eine Anfrage, der Host bestätigt oder lehnt ab. Keine Dating-App.

## Tech Stack

- **Frontend**: React mit TypeScript, Tailwind CSS v4 für Styling
- **Backend**: Supabase (Auth, Datenbank, Storage, Realtime)
- **Hosting**: Vercel für Frontend-Deployment
- **Package Manager**: npm
- **Build Tool**: Vite
- **Karten**: Leaflet + OpenStreetMap (kostenlos, kein API Key)
- **Geocoding**: Nominatim (OpenStreetMap, kostenlos)

## Projektstruktur

```
my-app/
├── src/
│   ├── components/
│   │   ├── ui/         # Button, Input, Textarea
│   │   ├── layout/     # BottomNav, Header
│   │   └── features/   # AvatarUpload, LocationSearch, Tags
│   ├── pages/          # AuthPage, FeedPage, CreatePage, ProfilePage, ActivityDetailPage
│   ├── hooks/          # use-auth, use-profile
│   ├── lib/            # supabase.ts, constants.ts
│   └── types/          # index.ts
├── supabase/migrations/ # SQL Migrationen
└── CLAUDE.md
```

## Code Style

- Funktionale React-Komponenten mit Hooks
- ES Modules (`import/export`), NICHT CommonJS
- Eine Komponente pro Datei
- Dateinamen kebab-case, Komponenten PascalCase
- Tailwind für Styling
- `import type` für TypeScript-Typen (verbatimModuleSyntax!)
- Alle User-facing Texte auf Deutsch

## Design-Prinzipien

- **Mobile-first**: Alles zuerst für Handy designen, dann Desktop
- **Stil**: Modern und clean — orientiere dich an Instagram, Threads, BeReal
- **Farben**: Orange (#f97316) als Primärfarbe, weiße Karten, grauer Hintergrund
- **Karten**: Weiß, rounded-2xl, border border-gray-100, kein harter Schatten
- **Typography**: Klare Hierarchie — fett für Titel, grau für Metadaten
- **Accessibility**: Semantisches HTML, aria-labels, ausreichende Kontraste
- **Ladezeiten**: Lazy Loading für Bilder, keine riesigen Bundles

## Supabase

- URL: https://bvsdnhmngypfitxwfrlj.supabase.co
- Tabellen: user_profiles, activities, activity_requests
- RLS immer aktiviert
- Migrationen in supabase/migrations/

## Wichtige Regeln

- `import type` für alle TypeScript-Typen
- `type="time"` NICHT verwenden (Safari-Bug) — Stunden/Minuten-Dropdowns statt dessen
- Nach Profil speichern: setProfile Callback aufrufen
- Kein Google Maps — Leaflet + Nominatim
- Nach Code-Änderungen: `npx tsc --noEmit`
