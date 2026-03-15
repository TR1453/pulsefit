# PulseFit

Eine kleine Fitness-Webapp mit:

- Registrierung und Login
- Workout-Tracking
- Kalorien-Tracking
- KI-Fitness-Coach mit OpenAI ueber eine Server-Route

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

## Hinweis

Die Fitnessdaten werden aktuell lokal im Browser mit IndexedDB gespeichert. Das bedeutet:

- jeder Browser hat seine eigenen Daten
- bei anderem Geraet sind die Daten nicht automatisch da
- fuer echte Benutzerkonten mit gemeinsamer Cloud-Datenbank waere spaeter ein richtiges Backend noetig
