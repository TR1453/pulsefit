# PulseFit

Eine kleine Fitness-Webapp mit:

- Registrierung und Login
- Workout-Tracking
- Kalorien-Tracking
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
4. Deploy starten

## Supabase einrichten

1. In Supabase den SQL Editor oeffnen
2. Den Inhalt aus `supabase-schema.sql` ausfuehren
3. Unter `Authentication` Email/Password aktiv lassen
4. In `script.js` sind URL und Publishable Key bereits eingetragen

## Hinweis

Die Fitnessdaten werden jetzt in Supabase gespeichert. Damit kannst du dich mit demselben Konto auf mehreren Geraeten anmelden.
