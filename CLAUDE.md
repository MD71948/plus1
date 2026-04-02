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
- Wenn etwas schiefgeht, erkläre den Fehler so, dass ich ihn verstehe
- Schlage nach jedem Schritt den nächsten logischen Schritt vor

## Produkt-Vision

**plus1** — Spontan-Aktivitäten-App.
Kernversprechen: "In 30 Sekunden von 'Ich hab Bock' zu 'Wir sind komplett.'"
**KEINE Dating-App.** Mindestens 3 Teilnehmer pro Activity.

### Anti-Dating Regeln (immer einhalten)
- Mindestens 3 Teilnehmer pro Activity (spots_total >= 3)
- Kein "Like" auf Profile — nur Anfragen auf Activities
- Chat NUR im Gruppen-Kontext (nie 1:1)
- Report-Option: "Person nutzt App zum Daten"

### MVP Features (Priorität)
1. **Auth** — E-Mail + Google Login, Premium Onboarding
2. **Profil** — Name, Foto, Bio (max 150 Zeichen), Interest-Tags, Sprachen, Stadtteil/PLZ
3. **Activity erstellen** — Quick-Create unter 15 Sekunden: Kategorie → Titel → Wann → Wo → Wie viele → Fertig
4. **Feed** — Map als Hauptansicht mit Pins + Swipeable Cards als Zweitansicht. Filter: Kategorie, Entfernung (Slider 1-50km), Zeitraum. Tab "Jetzt sofort" (Activities in den nächsten 2h)
5. **Anfrage-System** — User sendet Anfrage → Host sieht Mini-Profil → Annehmen/Ablehnen per Swipe
6. **Gruppen-Chat** — Nur zwischen bestätigten Teilnehmern, kein privater DM
7. **"Jetzt sofort"-Button** — Großer Button auf Homescreen, filtert nach Interessen + Location
8. **Push Notifications** — Nur relevante Activities nach Interessen + Nähe
9. **Share** — WhatsApp Deep Link + Instagram Story Grafik
10. **Trust** — Show-up Score, Nach-Activity Bewertung (👍/👎), Host-Badge

### Killer Features (nach MVP)
- Activity Matchmaking: plus1 gruppiert automatisch nach Location + Level
- Crew System: Nach 3+ gemeinsamen Activities → automatische Crew
- Vibe Check: Filter nach Stimmung (Chill/Kompetitiv/Abenteuer/Kultur/Party)
- Live Activity Radar: Pulsierende Kreise auf Map wo gerade was läuft
- Weather-Smart: App checkt Wetter, passt Vorschläge an
- Recap Card: Auto-generierte Karte nach Activity zum Teilen

## Tech Stack

- **Frontend**: React mit TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Auth, Datenbank, Storage, Realtime)
- **Hosting**: Vercel
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
│   │   ├── layout/     # BottomNav
│   │   └── features/   # AvatarUpload, LocationSearch, Tags
│   ├── pages/          # AuthPage, FeedPage, CreatePage, ProfilePage, ActivityDetailPage, MyActivitiesPage
│   ├── hooks/          # use-auth, use-profile
│   ├── lib/            # supabase.ts, constants.ts, utils.ts
│   └── types/          # index.ts
├── supabase/migrations/
└── CLAUDE.md
```

## Design-Prinzipien

- **Mobile-first**: Alles zuerst für Handy designen
- **Stil**: Premium, modern — Referenz: Strava, Airbnb, Instagram
- **Hintergrund**: #F4F4F6 (hellgrau), Karten weiß mit card-shadow
- **Akzent**: Violet #7C3AED als Primärfarbe
- **Typography**: Plus Jakarta Sans, fett für Titel, grau für Metadaten
- **Karten**: rounded-3xl, weißer Hintergrund, card-shadow, border var(--border)
- **Buttons**: Violet-Gradient mit Schatten für primäre Aktionen
- **Accessibility**: Semantisches HTML, ausreichende Kontraste

## Design Tokens (index.css)

```css
--bg: #F4F4F6
--surface: #FFFFFF
--border: #E8E8ED
--accent: #7C3AED
--accent-light: #EDE9FE
--text: #0A0A0B
--text-2: #6B7280
--text-3: #9CA3AF
```

## Supabase

- URL: https://bvsdnhmngypfitxwfrlj.supabase.co
- Tabellen: user_profiles, activities, activity_requests, activity_messages
- RLS immer aktiviert
- Migrationen in supabase/migrations/

## Wichtige Regeln

- `import type` für alle TypeScript-Typen (verbatimModuleSyntax!)
- `type="time"` NICHT verwenden (Safari-Bug) — Stunden/Minuten-Dropdowns
- Nach Profil speichern: setProfile Callback aufrufen
- Kein Google Maps — Leaflet + Nominatim
- Nach Code-Änderungen: `npx tsc --noEmit`
- spots_total minimum = 3 (Anti-Dating Regel)
