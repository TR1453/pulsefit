# PulseFit

Eine kleine Fitness-Webapp mit:

- Registrierung und Login
- Workout-Tracking
- Kalorien-Tracking
- Profil mit Gewicht, Zielgewicht und Fokus
- Einzeln loeschbare Workouts und Mahlzeiten
- KI-Fitness-Coach mit OpenAI ueber eine Server-Route
- Supabase Auth fuer geraeteuebergreifenden Login

## Projekt starten

Dieses Projekt ist fuer ein Deployment auf Vercel vorbereitet.

## Wichtige Dateien

- `index.html` -> Benutzeroberflaeche
- `style.css` -> Design
- `script.js` -> Frontend-Logik
- `api/coach.js` -> Server-Route fuer OpenAI
- `vercel.json` -> Vercel-Konfiguration
- `.env.example` -> Beispiel fuer die benoetigte Umgebungsvariable

## OpenAI Variable

In Vercel muss diese Environment Variable gesetzt werden:

```env
OPENAI_API_KEY=sk-dein-key
```

## Deployment auf Vercel

1. Projekt in ein GitHub-Repository hochladen
2. Repository bei Vercel importieren
3. `OPENAI_API_KEY` in Vercel unter Environment Variables eintragen
4. `SUPABASE_URL` in Vercel unter Environment Variables eintragen
5. `SUPABASE_SERVICE_ROLE_KEY` in Vercel unter Environment Variables eintragen
6. Deploy starten

## Supabase einrichten

1. In Supabase den SQL Editor oeffnen
2. Den Inhalt aus `supabase-schema.sql` ausfuehren
3. Unter `Authentication` Email/Password aktiv lassen
4. In `script.js` sind URL und Publishable Key bereits eingetragen

## Profil und Daten

- `profiles` speichert Gewicht, Zielgewicht, Kalorienziel und Fokus
- `fitness_entries` speichert Workouts und Mahlzeiten
- einzelne Eintraege koennen direkt im Dashboard geloescht werden

## Security Logs

Login- und Registrierungsversuche koennen jetzt serverseitig mit IP-Adresse geloggt werden.

- Route: `api/security-log.js`
- Tabelle: `security_logs`
- ungefaehre Standortdaten: `country`, `region`, `city` ueber Server-Header
- Benoetigt in Vercel:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Hinweis

Die Fitnessdaten werden jetzt in Supabase gespeichert. Damit kannst du dich mit demselben Konto auf mehreren Geraeten anmelden.
